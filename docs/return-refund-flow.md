# Return & Refund Flow

## Overview

This document describes the return and refund flow implemented in the Camion backend. The flow enforces strict eligibility rules, requires photo/video evidence, and involves an admin approval step before any refund is issued.

---

## Return Policy Rules

| # | Rule |
|---|---|
| 1 | Wrong variation received (e.g. ordered Small, got Medium) → **eligible** |
| 2 | Product arrived damaged or broken → **eligible** |
| 3 | Completely different product received → **eligible** |
| 4 | Customer dislikes the product but it matches the description → **not eligible** |
| 5 | Quality complaint if product matches what was described → **not eligible** |
| 6 | Customer must provide photo or video evidence → **mandatory** |
| 7 | Accepted parcel with no valid reason → **not eligible** |

---

## Flow Diagram

```
Customer places order
        ↓
Order status: DELIVERED
        ↓
Customer submits return request  →  POST /v1/return-requests
        ↓
Order status: RETURN_REQUESTED
Return status: PENDING
        ↓
Customer uploads evidence        →  POST /v1/return-requests/:uuid/evidence
(photo or video, required)
        ↓
Admin reviews request            →  GET /v1/return-requests/admin/all
        ↓
    ┌───┴───┐
APPROVE     REJECT
    ↓           ↓
Order: RETURNED  Order: DELIVERED (reverted)
Return: APPROVED Return: REJECTED
Inventory        Admin note saved
restocked        Notification sent
Refund amount
recorded
Notifications
sent
```

---

## Eligible Return Reasons

| Enum Value | Label | Description |
|---|---|---|
| `wrong_variation` | Wrong Variation | Received a different size, colour, or variant than ordered |
| `damaged_broken` | Damaged / Broken | Product arrived physically damaged or broken |
| `wrong_product` | Wrong Product | Received a completely different product than ordered |

> Quality complaints and buyer's remorse are **not** accepted.

---

## Return Request Statuses

| Status | Meaning |
|---|---|
| `pending` | Submitted, awaiting admin review |
| `approved` | Admin approved, refund initiated |
| `rejected` | Admin rejected with a reason |
| `refunded` | Refund completed |

---

## Order Statuses (relevant to returns)

| Status | Meaning |
|---|---|
| `delivered` | Order has been delivered — return window is open |
| `return_requested` | Customer has submitted a return request |
| `returned` | Return approved, inventory restocked, refund initiated |

---

## API Reference

### Customer Endpoints

#### Submit a Return Request
```
POST /v1/return-requests
Authorization: Bearer <customer-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderUuid": "550e8400-e29b-41d4-a716-446655440000",
  "orderItemUuid": "optional-item-uuid",
  "reason": "wrong_variation",
  "reasonDetail": "I ordered size Small but received size Large."
}
```

**Response:** `201 Created`
```json
{
  "uuid": "return-request-uuid",
  "reason": "wrong_variation",
  "reasonDetail": "I ordered size Small but received size Large.",
  "status": "pending",
  "refundAmount": { "amount": 150, "currencyCode": "qar" },
  "evidence": [],
  "createdAt": "2026-04-26T10:00:00.000Z"
}
```

**Validation errors:**
- Order not found or doesn't belong to customer → `404`
- Order is not in `delivered` status → `400`
- Return request already exists for this order → `400`

---

#### Upload Evidence
```
POST /v1/return-requests/:uuid/evidence
Authorization: Bearer <customer-token>
Content-Type: multipart/form-data
```

**Form field:** `file` — image or video file

**Response:** `201 Created`
```json
{
  "uuid": "evidence-uuid",
  "url": "s3://returns/...",
  "mimeType": "image/jpeg",
  "createdAt": "2026-04-26T10:05:00.000Z"
}
```

> Evidence can only be uploaded while the request is in `pending` status.

---

#### List My Return Requests
```
GET /v1/return-requests?pageNumber=1&itemsPerPage=20&status=pending
Authorization: Bearer <customer-token>
```

**Response:** `200 OK` — array of return request objects

---

#### Get Single Return Request
```
GET /v1/return-requests/:uuid
Authorization: Bearer <customer-token>
```

**Response:** `200 OK` — single return request with order, orderItem, and evidence

---

### Admin Endpoints

#### List All Return Requests
```
GET /v1/return-requests/admin/all?pageNumber=1&itemsPerPage=20&status=pending
Authorization: Bearer <admin-token>
Roles: SuperAdmin, Admin
```

**Response:** `200 OK` — array with customer info included

---

#### Approve or Reject a Return Request
```
PATCH /v1/return-requests/:uuid/status
Authorization: Bearer <admin-token>
Roles: SuperAdmin, Admin
Content-Type: application/json
```

**Approve:**
```json
{
  "status": "approved",
  "adminNote": "Evidence verified. Refund approved."
}
```

**Reject:**
```json
{
  "status": "rejected",
  "adminNote": "Product quality matches description. Return not eligible."
}
```

**Response:** `200 OK` — updated return request

**Validation errors:**
- No evidence uploaded → `400` (cannot approve without evidence)
- Request is not in `pending` status → `400`

---

### GraphQL Queries (Customer)

#### List My Return Requests
```graphql
query {
  getMyReturnRequests(pageNumber: 1, itemsPerPage: 20, status: "pending") {
    uuid
    reason
    reasonDetail
    status
    adminNote
    refundAmount { amount currencyCode }
    evidence { uuid url mimeType createdAt }
    order { uuid status }
    createdAt
  }
}
```

#### Get Single Return Request
```graphql
query {
  getMyReturnRequest(uuid: "return-request-uuid") {
    uuid
    reason
    reasonDetail
    status
    adminNote
    refundAmount { amount currencyCode }
    evidence { uuid url mimeType createdAt }
    order { uuid status total { amount currencyCode } }
    orderItem { uuid quantity total { amount currencyCode } }
    createdAt
    updatedAt
  }
}
```

---

## Notifications

The following in-app notifications are sent automatically:

| Trigger | Type | Recipient |
|---|---|---|
| Return request submitted | `order_returned` | Customer |
| Return approved | `order_refunded` | Customer |
| Refund initiated | `payment_refund_initiated` | Customer |
| Return rejected | `order_returned` | Customer |

---

## Data Model

### `return_requests` table

| Column | Type | Notes |
|---|---|---|
| id | int PK | Internal |
| uuid | uuid | Public identifier |
| customer_id | FK → customers | |
| order_id | FK → orders | |
| order_item_id | FK → order_items | Nullable — full order if null |
| reason | enum | `wrong_variation`, `damaged_broken`, `wrong_product` |
| reason_detail | text | Customer's description |
| status | enum | `pending`, `approved`, `rejected`, `refunded` |
| admin_note | varchar | Nullable |
| refund_amount | float + currency | Calculated at creation time |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `return_evidence` table

| Column | Type | Notes |
|---|---|---|
| id | int PK | Internal |
| uuid | uuid | Public identifier |
| return_request_id | FK → return_requests | Cascade delete |
| url | varchar | S3 URL (`s3://returns/...`) |
| mime_type | varchar | e.g. `image/jpeg`, `video/mp4` |
| created_at | timestamptz | |

---

## Module Structure

```
src/returns/
├── enums/
│   ├── ReturnReason.enum.ts
│   └── ReturnStatus.enum.ts
├── entities/
│   ├── return-request.entity.ts
│   └── return-evidence.entity.ts
├── dtos/
│   ├── CreateReturnRequestDto.ts
│   └── UpdateReturnRequestStatusDto.ts
├── returns.service.ts
├── returns.controller.ts
├── returns.resolver.ts
└── returns.module.ts
```

---

## Notes

- **Partial returns** are supported: if `orderItemUuid` is provided, only that item is returned and the `refundAmount` reflects that item's total. If omitted, the full order total is used.
- **Inventory restoration** happens automatically on approval — the returned item quantities are added back to the original warehouse.
- **Actual payment gateway refund** (Skipcash) is not yet wired. The `refundAmount` is stored and the `PAYMENT_REFUND_INITIATED` notification is sent as a trigger for manual or future automated processing.
- A customer can only have **one active return request per order**.
