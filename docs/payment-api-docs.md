# Payment REST  API

==========================

This document includes the documentation for the payment management module.

---


---

# Payment REST API

---

## Save a Payment

> [!IMPORTANT]
> Requires authenticated customer (Customer, Affiliate or Influencer)

```http
POST /v1/payments/result HTTP/1.1
```

---

### Request Body

```json
{
    "amount": "6.05",
    "currency": "qar",
    "orderUUID": "order-uuid",
    "paymentStatus": "paid | failed | cancelled | rejected",
    "paymentId": "payment id",
    "tokenId"?: "token id",
    "failureReason"?: "failure reason",
    "errorCode"?: "error code",
}
```

---

### Response 201 Created

---

## Retrieve Saved Cards

```http
GET /v1/customers/me/saved-cards HTTP/1.1
```

---

### Response Body

```json
[
    {
        "uuid": "card-uuid",
        "tokenId": "token id",
        "cardBrand": "card brand",
        "last4": "last 4",
        "expiryMonth": "expiry month",
        "expiryYear": "expiry year",
        "isDefault": true,
        "isActive": true,
    }
]
```

## Update Saved Card

> [!IMPORTANT]
> Requires authenticated customer (Customer, Affiliate or Influencer)

```http
PATCH /v1/customers/me/saved-cards/<card-uuid> HTTP/1.1
```

---

---

### Response Body

```json
{
    "uuid": "card-uuid",
    "tokenId": "token id",
    "cardBrand": "card brand",
    "last4": "last 4",
    "expiryMonth": "expiry month",
    "expiryYear": "expiry year",
    "isDefault": true,
    "isActive": true,
}
```

## Delete Saved Card

> [!IMPORTANT]
> Requires authenticated customer (Customer, Affiliate or Influencer)

```http
DELETE /v1/customers/me/saved-cards/<card-uuid> HTTP/1.1
```

---