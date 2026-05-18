JOP WMS REST API
================

This document covers the JOP Overseas Warehouse Management System (WMS) integration. It explains the architecture, polling mechanism, environment setup, and all admin API endpoints.

---

Overview
--------

JOP WMS is an external HTTP-based warehouse system used to manage the full overseas warehouse lifecycle:

```
Product Sync → Inbound (stock in) → Outbound (fulfillment) → Shipping → Returns
```

### End-to-end order dispatch flow

```
Customer places order
       ↓
Admin approves (status → CONFIRMED)
       ↓
POST /v1/wms/orders/dispatch  →  returns { jobId } immediately (202)
       ↓ (background)
All confirmed orders collected → items grouped by 1688 shop
       ↓
One Gulltrans procurement order per shop (all customer orders merged)
       ↓
Variants synced to WMS → One WMS inbound per shop group
  (inbound covers all customer orders for that shop)
       ↓
[Scheduler polls inbound every 3 hours]
       ↓
Inbound status → "shelved" (goods received at warehouse)
       ↓
All inbounds for each customer order shelved? → wait if not
       ↓
Scheduler auto-creates one WMS outbound per customer order
       ↓
[Scheduler polls outbound every 3 hours]
  On transition to SHIPPED → waybillNo/query called immediately
  fetchMissingWaybillNumbers() retries any SHIPPED orders still missing waybillNo
```

**Key characteristics:**
- All requests use HTTP POST with JSON
- No webhooks — status changes must be polled
- Authentication is per-request using an MD5 signature

---

Architecture
------------

The integration lives entirely in `src/jop-wms/` as a self-contained layer. It is only accessible from admin routes.

```
JopWmsController  (v1/wms/*)
       │
       ▼
JopWmsService     (business logic — syncs with local DB, tracks orders)
       │
       ├──► JopWmsClient    (HTTP layer — builds MD5 signature, calls JOP WMS API)
       └──► JopWmsScheduler (cron-based polling — updates jop_wms_orders table)
```

**`JopWmsClient`** — thin wrapper around `fetch`. Reads credentials from env vars, computes the MD5 signature on every request, and handles HTTP errors.

**`JopWmsService`** — business logic layer. For product sync, it reads `ProductVariant` data from the local DB (populated via Gulltrans/1688 procurement) and maps it to the WMS format. For order creation, it automatically registers each order into the `jop_wms_orders` table so it enters the polling loop. The batch dispatch flow (`dispatchApprovedOrders`) runs in the background (fire-and-forget via `setImmediate`): it groups all confirmed orders by 1688 shop, makes one Gulltrans API call per shop, syncs all affected variants to WMS, and creates one WMS inbound per shop group covering all customer orders in it.

**`JopWmsScheduler`** — cron jobs that poll non-terminal orders on a fixed interval. When an inbound order transitions to `shelved`, the scheduler checks whether every inbound linked to each affected customer order is now shelved; only then does it create one WMS outbound per customer order. This ensures orders spanning multiple shops are consolidated into a single shipment. See the Polling section below.

---

Environment Variables
---------------------

Add these to your `.env`:

```
JOP_WMS_BASE_URL=https://wms.example.com/api
JOP_WMS_API_KEY=your_api_key
JOP_WMS_API_SECRET=your_api_secret
JOP_WMS_PROVIDER_API_KEY=your_provider_api_key
JOP_WMS_USER_TOKEN=your_user_token
JOP_WMS_WAREHOUSE_CODE=your_warehouse_code

# Default logistics channel used when auto-creating outbound orders
JOP_WMS_LOGISTICS_CHANNEL=your_logistics_channel_code

# Days before a non-terminal inbound is force-expired (default: 30)
WMS_STALE_INBOUND_DAYS=30
```

The Gulltrans warehouse address (where 1688 suppliers ship goods to) is read from the **active `Warehouse` record** in the database — not from env vars. Ensure the active warehouse has the following fields populated:

| Column | Maps to | Required |
|---|---|---|
| `contactName` | `receiver_name` | Yes |
| `phone` | `phone` | Yes |
| `addressLine1` + `addressLine2` | `address` | Yes |
| `city` | `city` | Yes |
| `state` | `province` | Yes |
| `country` | `country_name` | Yes |
| `countryCode` | `country.country_code` | Yes |
| `postcode` | `postcode` | No |
| `name` | `company` | No |

---

Authentication
--------------

Every outbound call to JOP WMS is signed automatically by `JopWmsClient`. No manual auth step is required from the caller.

The signature is computed as:

```
MD5(requestBodyJson + apiKey + apiSecret + timestamp)
```

The following headers are sent on every request:

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `apiKey` | `JOP_WMS_API_KEY` |
| `providerApiKey` | `JOP_WMS_PROVIDER_API_KEY` |
| `userToken` | `JOP_WMS_USER_TOKEN` |
| `timestamp` | Unix ms timestamp (generated per request) |
| `signature` | MD5 hash described above |

---

Polling
-------

JOP WMS has no webhooks, so order status must be polled. Four cron jobs run automatically in the background.

**Inbound, outbound, and return orders** — all polled every **3 hours**. Note: `outboundorder/status` does **not** return a waybill number — it only returns the order status and shipment dimensions. Waybill numbers are fetched separately via `waybillNo/query` (see below).

**Stale inbound expiry** — runs daily at midnight. Any inbound order that has been non-terminal for more than 30 days is force-marked as `deleted`, unblocking outbound creation for the linked customer orders. A warning is logged so admins can investigate the missing goods.

### How polling works

1. When an inbound, outbound, or return order is successfully created via the admin API, it is automatically registered in the `jop_wms_orders` table with `status = pending`.
2. On each cron tick, the scheduler queries all non-terminal orders of that type.
3. It calls the appropriate JOP WMS status endpoint and updates `status` and `lastPolledAt` in the DB.
4. For outbound orders: `outboundorder/status` returns `status` and shipment dimensions only — **no waybill number**. When the status transitions to `SHIPPED` for the first time, the scheduler immediately calls `waybillNo/query` to fetch and persist the waybill number. A separate `fetchMissingWaybillNumbers()` pass also runs after each outbound poll cycle and retries `waybillNo/query` for any SHIPPED outbound orders that still have `waybillNo = null` (handles cases where the inline fetch failed).
5. For inbound orders: if the status transitions to `shelved` (goods received at warehouse), the scheduler checks whether **all** inbound orders linked to each customer order (via `jop_wms_order_links`) are now shelved. Only when every inbound for a given customer order is shelved does it create one WMS outbound order, using the customer's shipping address and `JOP_WMS_LOGISTICS_CHANNEL`. If any inbound is still pending, outbound creation is deferred until the next poll that completes the set.
6. Once an order reaches a terminal status, it is excluded from future polls.

**Terminal statuses** (polling stops automatically): `completed`, `cancelled`, `shelved`, `closed`

> [!NOTE]
> `shelved` is terminal for **inbound** orders (goods are now on warehouse shelves) but triggers outbound creation. It is also terminal for **return** orders (returned goods are re-shelved). Outbound orders are not affected by this trigger.

**Customer notifications sent automatically by the scheduler:**
- Inbound → `shelved`: sends `ORDER_PROCESSING` to all customers linked to that inbound
- Outbound receives a waybill number (first time): sends `ORDER_SHIPPED` with the tracking number included in the message

### Error handling

Each order has an `errorCount` field. If the JOP WMS call fails, `errorCount` is incremented. Once an order accumulates **5 consecutive failures**, it is skipped in future poll cycles. This prevents a permanently broken order from blocking the scheduler.

### `jop_wms_orders` table

| Column | Description |
|---|---|
| `orderNo` | The `customerVoucherNo` sent to JOP WMS (unique, max 64 chars). Dispatch-created inbounds use a 32-character hex string (UUID with dashes stripped) per shop group; outbound orders use `<customer-order-uuid>-out` |
| `type` | `inbound`, `outbound`, or `return` |
| `status` | Last known status from WMS |
| `wmsAssignedId` | The internal order ID assigned by JOP WMS on creation (`inboundOrderId` / `outboundOrderId`). Stored for reference; not required for subsequent API calls |
| `waybillNo` | Carrier tracking number (outbound only). **Not returned by `outboundorder/status`** — populated via a separate `waybillNo/query` call once the order reaches SHIPPED status |
| `gulltransResponse` | Full Gulltrans API response payload stored as JSONB on inbound order creation (for audit and debugging) |
| `lastPolledAt` | Timestamp of last successful poll attempt |
| `errorCount` | Consecutive poll failures; order is skipped after 5 |

Customer orders linked to each WMS record are stored in the **`jop_wms_order_links`** junction table (`wms_order_id` → `order_id`), replacing the previous comma-separated `sourceOrderUuids` text column.

Use `GET /v1/wms/orders` to inspect this table from the admin dashboard.

---

Admin API
=========

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active.

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

All routes are prefixed with `/v1/wms`.

---

Order Dispatch
--------------

### Dispatch Approved Orders

Batch-dispatches all `CONFIRMED` customer orders that have not yet been procured. Before starting the background job, a **synchronous pre-flight check** runs: if `orderUuids` is provided and any UUID already has a WMS inbound order in `jop_wms_orders`, the request is rejected immediately with `400 Bad Request` and the conflicting UUIDs are returned. If the check passes, the endpoint returns `202 Accepted` with a `jobId` and the work continues in the background:

1. Collects all eligible orders and groups their items by 1688 shop (`shopId`)
2. Makes **one Gulltrans procurement order per shop** (all customer orders merged — e.g. 5 orders with items from the same shop = 1 Gulltrans order). Each SKU's `sku_info` is populated automatically from `ProductVariant.skuMeta` captured during import
3. Appends the returned Gulltrans order number (e.g. `"DG646"`) to each customer order's `gulltransOrderSns` array — one entry per shop, so a 3-shop order ends up with `["DG100", "DG200", "DG300"]`
4. Syncs all affected product variants to WMS (`product/synchronize`) before creating inbounds
5. Creates **one WMS inbound per shop group**, with a combined product list. The contributing customer order IDs are linked via `jop_wms_order_links`. The inbound `customerVoucherNo` is a 32-character hex string (UUID with dashes stripped)

When the inbound reaches `shelved`, the scheduler checks whether all inbounds for each linked customer order are shelved. Once they all are, it auto-creates one outbound per customer order, consolidating all items into a single shipment.

Products must have been imported via `POST /v1/procurement/import` first — the `shopId`, `shopName`, `procurementId`, and `skuMeta` stored during import are used to build the Gulltrans payload automatically. The warehouse address is read from the active `Warehouse` record in the database.

```http
POST /v1/wms/orders/dispatch HTTP/1.1
```

### Request Body
```json
{
    "orderUuids": ["uuid-1", "uuid-2"],
    "shipperMethod": 0,
    "shipperCompany": "DHL Freight"
}
```

### Request Body Fields
| Field | Required | Type | Description |
|---|---|---|---|
| orderUuids | No | UUID[] | Specific order UUIDs to dispatch. If omitted, all `CONFIRMED` orders with a null `gulltransOrderSns` array are processed |
| shipperMethod | Yes | Number | Shipping method: `0`=sea, `1`=air, `2`=express, `3`=rail, `4`=land |
| shipperCompany | No | String | Name of the freight company |

### Response Body

Returns **202 Accepted** immediately when the pre-flight check passes. Processing happens in the background.

```json
{
    "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

If any provided `orderUuids` are already dispatched, returns **400 Bad Request** synchronously:

```json
{
    "message": "Some orders have already been dispatched to WMS",
    "alreadyDispatched": ["uuid-1", "uuid-2"]
}
```

Use the server logs (tagged with `jobId`) to track progress and results.

### Notes
- Orders whose products were not imported from 1688 (missing `shopId`) are skipped with a warning log
- Products must be re-imported after the `skuMeta` feature was introduced — variants with `skuMeta: null` will send an empty `sku_info` which Gulltrans rejects
- One customer order spanning items from two shops produces two Gulltrans orders and two WMS inbounds; both inbounds link back to the same customer order via `jop_wms_order_links`. Outbound creation is deferred until all inbounds for that order are shelved
- Each customer order's `gulltransOrderSns` is a `text[]` array — one entry per shop (e.g. `["DG100", "DG200", "DG300"]` for a 3-shop order). Each shop job appends its SN concurrently without overwriting. The full Gulltrans response per shop is also stored as JSONB in `jop_wms_orders.gulltransResponse` on the corresponding inbound record
- Variant sync failures are non-blocking — the inbound is still created with a warning log
- Box dimensions are derived automatically from `ProductVariant.dimensions` and `ProductVariant.weight`
- Dispatch is blocked (400) if any provided UUID already has a row in `jop_wms_order_links`; omitting `orderUuids` bypasses this check (dispatch-all mode)

---

Products
--------

### Sync Product to WMS

Reads a `ProductVariant` from the local database by UUID and pushes it to JOP WMS via `product/synchronize`. The variant must have been imported via the procurement flow first.

```http
POST /v1/wms/products/sync HTTP/1.1
```

### Request Body
```json
{
    "variantUuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

### Request Body Fields
| Field | Required | Type | Description |
|---|---|---|---|
| variantUuid | Yes | UUID | UUID of the local `ProductVariant` to sync |

### What gets sent to WMS
The service maps the variant's local data — SKU, barcode, title, weight, dimensions, image URL, declared value — into the JOP WMS product format automatically.

### Response Body
```json
{
    "code": 200,
    "msg": "success",
    "data": {}
}
```

---

### Query Products in WMS

```http
GET /v1/wms/products HTTP/1.1
```

### Query Parameters
| Parameter | Required | Type | Description |
|---|---|---|---|
| sku | No | String | Filter by SKU |
| barcode | No | String | Filter by barcode |
| pageNumber | No | Number | Page number (default: 1) |
| itemsPerPage | No | Number | Items per page (default: 20) |

### Response Body
```json
{
    "code": 200,
    "data": {
        "list": [
            {
                "sku": "ABC-001",
                "barcode": "1234567890",
                "productName": "Blue Running Shoes",
                "weight": 800,
                "weightUnit": "g",
                "stock": 42
            }
        ],
        "total": 1
    }
}
```

---

Inbound Orders (Stock Entry)
----------------------------

Used to notify the warehouse that stock is incoming.

### Create Inbound Order

```http
POST /v1/wms/inbound HTTP/1.1
```

After a successful response, the order is automatically registered in `jop_wms_orders` and enters the polling loop.

### Request Body
```json
{
    "orderNo": "3792156ba31c4bf0923794c34798f8d2",
    "items": [
        { "sku": "ABC-001", "quantity": 100 },
        { "sku": "ABC-002", "quantity": 50 }
    ],
    "remark": "First batch from supplier"
}
```

### Request Body Fields
| Field | Required | Type | Description |
|---|---|---|---|
| orderNo | Yes | String | Your unique reference number for this inbound order |
| items | Yes | Array | At least one item required |
| items[].sku | Yes | String | Product SKU |
| items[].quantity | Yes | Number | Quantity being sent in |
| remark | No | String | Optional note |

---

### Get Inbound Order Status

```http
GET /v1/wms/inbound/status?orderNo=3792156ba31c4bf0923794c34798f8d2 HTTP/1.1
```

### Query Parameters
| Parameter | Required | Type | Description |
|---|---|---|---|
| orderNo | Yes | String | The inbound order number |

### Response Body
```json
{
    "code": 200,
    "data": {
        "orderNo": "3792156ba31c4bf0923794c34798f8d2",
        "status": "receiving",
        "items": [
            { "sku": "ABC-001", "expectedQty": 100, "receivedQty": 60 }
        ]
    }
}
```

---

### Cancel Inbound Order

```http
POST /v1/wms/inbound/:orderNo/cancel HTTP/1.1
```

### Response Body
```json
{
    "code": 200,
    "msg": "success"
}
```

---

### Get Inbound Label URL

Retrieves a printable shipping label URL for the inbound shipment.

```http
GET /v1/wms/inbound/:orderNo/label HTTP/1.1
```

### Response Body
```json
{
    "code": 200,
    "data": {
        "labelUrl": "https://wms.example.com/labels/3792156ba31c4bf0923794c34798f8d2.pdf"
    }
}
```

---

Outbound Orders (Fulfillment)
------------------------------

Used to instruct the warehouse to pick, pack, and ship an order to a customer.

### Create Outbound Order

```http
POST /v1/wms/outbound HTTP/1.1
```

After a successful response, the order is automatically registered in `jop_wms_orders`. The scheduler polls it every 3 hours via `outboundorder/status`. When the status first transitions to `SHIPPED`, the scheduler immediately calls `waybillNo/query` to fetch the carrier tracking number and saves it to `jop_wms_orders.waybillNo`.

### Request Body
```json
{
    "orderNo": "9f71e2650343cb59f0017b515bfb980out",
    "logisticsCode": "DHL-EXPRESS",
    "recipient": {
        "name": "John Doe",
        "phone": "+971501234567",
        "country": "AE",
        "province": "Dubai",
        "city": "Dubai",
        "address": "123 Sheikh Zayed Road",
        "zipCode": "00000"
    },
    "items": [
        { "sku": "ABC-001", "quantity": 2 }
    ],
    "remark": "Fragile — handle with care"
}
```

### Request Body Fields
| Field | Required | Type | Description |
|---|---|---|---|
| orderNo | Yes | String | Your unique reference number |
| logisticsCode | Yes | String | Logistics channel code (obtain from `GET /v1/wms/logistics`) |
| recipient | Yes | Object | Delivery recipient details |
| recipient.name | Yes | String | Full name |
| recipient.phone | Yes | String | Phone number including country code |
| recipient.country | Yes | String | ISO country code |
| recipient.province | Yes | String | Province or state |
| recipient.city | Yes | String | City |
| recipient.address | Yes | String | Street address |
| recipient.zipCode | No | String | Postal/ZIP code |
| items | Yes | Array | At least one item required |
| items[].sku | Yes | String | Product SKU |
| items[].quantity | Yes | Number | Quantity to ship |
| remark | No | String | Optional note |

---

### Get Outbound Order Status

```http
GET /v1/wms/outbound/:orderNo/status HTTP/1.1
```

> [!NOTE]
> `outboundorder/status` returns the order status and shipment dimensions only. **It does not return a waybill number.** Use `GET /v1/wms/waybill/:orderNo` to retrieve the tracking number.

### Response Body
```json
{
    "code": 200,
    "data": {
        "orderNo": "9f71e2650343cb59f0017b515bfb980out",
        "status": "shipped",
        "checkOutWeight": 1200,
        "checkOutLength": 30,
        "checkOutWidth": 20,
        "checkOutHeight": 15
    }
}
```

---

### Cancel Outbound Order

```http
POST /v1/wms/outbound/:orderNo/cancel HTTP/1.1
```

> [!NOTE]
> If the shipping forecast has failed, the recommended flow is: cancel the outbound order, then recreate it. This is handled at the application level — the WMS itself does not retry automatically.

### Response Body
```json
{
    "code": 200,
    "msg": "success"
}
```

---

### Estimate Shipping Cost

Returns the estimated shipping fee before creating an outbound order.

```http
POST /v1/wms/outbound/estimate-shipping HTTP/1.1
```

### Request Body
```json
{
    "logisticsCode": "DHL-EXPRESS",
    "countryCode": "AE",
    "items": [
        { "sku": "ABC-001", "quantity": 2 }
    ]
}
```

### Request Body Fields
| Field | Required | Type | Description |
|---|---|---|---|
| logisticsCode | Yes | String | Logistics channel code |
| countryCode | Yes | String | Destination ISO country code |
| items | Yes | Array | Items to estimate for |

### Response Body
```json
{
    "code": 200,
    "data": {
        "logisticsCode": "DHL-EXPRESS",
        "estimatedFee": 18.50,
        "currency": "USD",
        "estimatedDays": "5-7"
    }
}
```

---

Inventory
---------

### Query Inventory

Returns current stock levels in the overseas warehouse, including available vs. damaged quantities.

```http
GET /v1/wms/inventory HTTP/1.1
```

### Query Parameters
| Parameter | Required | Type | Description |
|---|---|---|---|
| sku | No | String | Filter by SKU |
| pageNumber | No | Number | Page number (default: 1) |
| itemsPerPage | No | Number | Items per page (default: 20) |

### Response Body
```json
{
    "code": 200,
    "data": {
        "list": [
            {
                "sku": "ABC-001",
                "availableQty": 38,
                "damagedQty": 2,
                "totalQty": 40
            }
        ],
        "total": 1
    }
}
```

---

Logistics
---------

### Get Logistics Channels

Returns available shipping channels for a given destination country. Use the `logisticsCode` values in outbound order creation and shipping estimation.

```http
GET /v1/wms/logistics?countryCode=AE HTTP/1.1
```

### Query Parameters
| Parameter | Required | Type | Description |
|---|---|---|---|
| countryCode | Yes | String | ISO country code of the destination |

### Response Body
```json
{
    "code": 200,
    "data": [
        {
            "logisticsCode": "DHL-EXPRESS",
            "logisticsName": "DHL Express",
            "estimatedDays": "5-7",
            "maxWeightKg": 30
        },
        {
            "logisticsCode": "ARAMEX-STD",
            "logisticsName": "Aramex Standard",
            "estimatedDays": "10-14",
            "maxWeightKg": 30
        }
    ]
}
```

---

Waybill (Tracking)
------------------

### Query Waybill Number

Returns the carrier tracking number for a shipped outbound order. The scheduler automatically calls this endpoint when an outbound transitions to SHIPPED and stores the result in `jop_wms_orders.waybillNo`. Use this endpoint to query on-demand if you need the tracking number immediately.

```http
GET /v1/wms/waybill/:orderNo HTTP/1.1
```

### Response Body
```json
{
    "code": 200,
    "data": {
        "orderNo": "9f71e2650343cb59f0017b515bfb980out",
        "waybillNo": "DHL1234567890",
        "carrier": "DHL"
    }
}
```

---

Returns
-------

### Create Return Order

Notifies the warehouse that a customer is sending stock back.

```http
POST /v1/wms/returns HTTP/1.1
```

After a successful response, the order is automatically registered in `jop_wms_orders` and polled every 3 hours. Terminal status for returns is `shelved` (goods put back in usable stock) or `cancelled`.

### Request Body
```json
{
    "returnOrderNo": "RET-2025-001",
    "originalOrderNo": "9f71e2650343cb59f0017b515bfb980out",
    "items": [
        { "sku": "ABC-001", "quantity": 1 }
    ],
    "remark": "Customer changed their mind"
}
```

### Request Body Fields
| Field | Required | Type | Description |
|---|---|---|---|
| returnOrderNo | Yes | String | Your unique reference for this return |
| originalOrderNo | Yes | String | The outbound order number being returned |
| items | Yes | Array | Items being returned |
| items[].sku | Yes | String | Product SKU |
| items[].quantity | Yes | Number | Quantity being returned |
| remark | No | String | Optional note |

---

### Query Return Order

```http
GET /v1/wms/returns?returnOrderNo=RET-2025-001 HTTP/1.1
```

### Query Parameters
| Parameter | Required | Type | Description |
|---|---|---|---|
| returnOrderNo | Yes | String | The return order number |

### Response Body
```json
{
    "code": 200,
    "data": {
        "returnOrderNo": "RET-2025-001",
        "status": "shelved",
        "items": [
            {
                "sku": "ABC-001",
                "returnedQty": 1,
                "qualifiedQty": 1,
                "damagedQty": 0
            }
        ]
    }
}
```

---

Polling State
-------------

### Get Tracked Orders

Returns all orders currently tracked in the local `jop_wms_orders` table, including their last known status, waybill number, last poll time, and error count.

```http
GET /v1/wms/orders HTTP/1.1
```

```http
GET /v1/wms/orders?type=outbound HTTP/1.1
```

### Query Parameters
| Parameter | Required | Type | Description |
|---|---|---|---|
| type | No | `inbound` \| `outbound` \| `return` | Filter by order type |

### Response Body
```json
[
    {
        "id": 1,
        "orderNo": "9f71e2650343cb59f0017b515bfb980out",
        "type": "outbound",
        "status": "14",
        "waybillNo": "DHL1234567890",
        "lastPolledAt": "2025-04-27T10:30:00.000Z",
        "errorCount": 0,
        "createdAt": "2025-04-27T08:00:00.000Z",
        "updatedAt": "2025-04-27T10:30:00.000Z"
    },
    {
        "id": 2,
        "orderNo": "3792156ba31c4bf0923794c34798f8d2",
        "type": "inbound",
        "status": "11",
        "waybillNo": null,
        "lastPolledAt": "2025-04-27T10:00:00.000Z",
        "errorCount": 0,
        "createdAt": "2025-04-26T09:00:00.000Z",
        "updatedAt": "2025-04-27T10:00:00.000Z",
        "linkedOrderUuids": [
            "550e8400-e29b-41d4-a716-446655440000",
            "550e8400-e29b-41d4-a716-446655440001"
        ]
    },
    {
        "id": 2,
        "orderNo": "550e8400-e29b-41d4-a716-446655440000-out",
        "type": "outbound",
        "status": "14",
        "wmsAssignedId": "701",
        "waybillNo": "DHL1234567890",
        "lastPolledAt": "2025-04-27T10:30:00.000Z",
        "errorCount": 0,
        "createdAt": "2025-04-27T08:00:00.000Z",
        "updatedAt": "2025-04-27T10:30:00.000Z",
        "linkedOrderUuids": [
            "550e8400-e29b-41d4-a716-446655440000"
        ]
    }
]
```

### Inbound Status Codes

| Code | Label | Notes |
|---|---|---|
| `pending` | Pending | Initial state — not yet polled |
| `10` | Draft | |
| `11` | Forecasted | Announced to the warehouse |
| `12` | Received | Goods signed for at warehouse |
| `13` | Partially Stored | Some items shelved |
| `14` | Stored | All goods shelved — **triggers auto outbound creation** |
| `15` | Warehouse Closed | Terminal |
| `16` | Deleted | Terminal |

### Outbound Status Codes

| Code | Label | Notes |
|---|---|---|
| `pending` | Pending | Initial state — not yet polled |
| `10` | Draft | |
| `11` | Processing | Forecast in progress |
| `12` | Processing Failed | Forecast failed — cancel and recreate |
| `13` | Processing Complete | Forecast confirmed |
| `14` | Shipped | `waybillNo` is available |
| `15` | Invalidated | Terminal |


---

Business Flows
--------------

### Full Order Dispatch (recommended)

End-to-end flow from customer order approval to warehouse fulfillment:

```
1. PATCH /v1/orders/:uuid/status  { status: "confirmed" }
                                         → admin approves customer order(s)

2. POST /v1/wms/orders/dispatch          → returns { jobId } immediately (202)
   { shipperMethod: 0 }                    background job:
                                           - groups orders by shop
                                           - creates one Gulltrans order per shop
                                           - syncs variants to WMS
                                           - creates one WMS inbound per shop group

3. GET  /v1/wms/inbound/label            → print inbound shipping label (optional)

4.      [scheduler polls inbound every 3h]
        [daily midnight job expires inbounds pending >30 days]

5. Inbound status → "shelved"            → scheduler checks all inbounds for each order are terminal
                                         → creates one outbound per customer order once all are ready

6.      [scheduler polls outbound every 3h via outboundorder/status]
        [on first SHIPPED transition → waybillNo/query called immediately]
        [fetchMissingWaybillNumbers() retries any SHIPPED orders still without waybillNo]

7. GET  /v1/wms/waybill/:orderNo         → retrieve tracking number on-demand
```

### Manual Inbound (Stock Entry)

For inbound orders not tied to a customer order (e.g. restocking):

```
1. POST /v1/wms/products/sync                    → sync product variant to WMS (required before inbound)
2. POST /v1/wms/inbound                          → create inbound order (auto-tracked)
3. GET  /v1/wms/inbound/:orderNo/label           → print label for shipment
4.      [scheduler polls inboundorder/status every 3h]
5. GET  /v1/wms/orders?type=inbound              → check polling state
```

### Manual Outbound (Order Fulfillment)

For outbound orders created independently of the dispatch flow:

```
1. GET  /v1/wms/logistics?countryCode=...        → get available channels
2. POST /v1/wms/outbound/estimate-shipping       → get cost estimate
3. POST /v1/wms/outbound                         → create outbound order (auto-tracked)
4.      [scheduler polls outboundorder/status every 3h]
        [outboundorder/status does NOT return waybillNo]
        [on first SHIPPED transition → waybillNo/query called separately]
        [fetchMissingWaybillNumbers() retries SHIPPED orders still without waybillNo]
5. GET  /v1/wms/waybill/:orderNo                 → get tracking number on-demand
```

If the shipping forecast fails, cancel and recreate:
```
POST /v1/wms/outbound/:orderNo/cancel
POST /v1/wms/outbound   (new orderNo)
```

### Returns

```
1. POST /v1/wms/returns                          → create return order (auto-tracked)
2.      [scheduler polls returnorder/query every 3h]
3. GET  /v1/wms/returns?returnOrderNo=...        → check status on-demand
```
