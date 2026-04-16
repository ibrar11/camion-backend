# Currencies API

===========

This document includes the documentation of currencies module.

---

## Procedure to Manage Currencies

---

Follow the steps below to manage currencies in the system.

1. Create a currency.
2. Retrieve currencies.
3. Update currency details.
4. Delete a currency.

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

---

## Create a Currency

---

You can create a new currency using the following API route.

```HTTP
POST /v1/currencies HTTP/1.1
```

### Example

```bash
curl --location --request POST 'http://localhost:3000/v1/currencies' \
--header 'Authorization: Bearer <YOUR_ACCESS_TOKEN>' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "Euro",
    "alphaCode": "EUR"
}'
```

### Response Body

```json
{
    "uuid": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "name": "Euro",
    "alphaCode": "EUR"
}
```

---

## Retrieve Currencies

---

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`, `User`

```HTTP
GET /v1/currencies HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "1",
        "name": "United States Dollar",
        "alphaCode": "USD"
    },
    {
        "uuid": "2",
        "name": "Saudi Riyal",
        "alphaCode": "SAR"
    }
]
```

> ⚠️ If no currencies have been created yet, this endpoint will return an empty array:

```json
[]
```

---

## Retrieve Currency

---

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`, `User`

```HTTP
GET /v1/currencies/<currency-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "name": "Euro",
    "alphaCode": "EUR"
}
```

---

## Update Currency

---

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```HTTP
PUT /v1/currencies/<currency-uuid> HTTP/1.1
```

### Request Body

```json
{
    "name": "Euro Updated",
    "alphaCode": "EUR"
}
```

### Response Body

```json
{
    "uuid": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "name": "Euro Updated",
    "alphaCode": "EUR"
}
```

---

## Delete Currency

---

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```HTTP
DELETE /v1/currencies/<currency-uuid> HTTP/1.1
```

---

## ⚠️ Notes

---

* `alphaCode` must be unique (e.g., USD, EUR, SAR)
* `name` must be unique
* `alphaCode` is automatically normalized to uppercase
* Duplicate `alphaCode` or `name` will result in a **409 Conflict error**
* Updating a currency with an existing `alphaCode` (belonging to another currency) will also result in a **409 Conflict error**
* Currencies are **admin-managed resources** and must be created via API or setup process

---

## 💡 Initial Data

---

No default currencies are seeded automatically.

If required, initial currencies (e.g., USD, SAR, AED, etc.) should be:

* Created manually via admin APIs, or
* Inserted through database migrations or setup scripts

---
