# Newsletter API

===========

This document includes the documentation of the newsletter subscription module.

---

## Procedure to Subscribe to Newsletter

---

Follow the steps below to subscribe a user to the newsletter.

1. Provide an email address
2. Submit the request
3. Email is registered with Mailchimp audience

> [!IMPORTANT]
> This endpoint is **public** and does not require authentication.

---

## Subscribe to Newsletter

---

You can subscribe a user to the newsletter using the following API route.

```HTTP
POST /v1/newsletter/subscribe HTTP/1.1
```

---

### Request Body

```json
{
  "emailAddress": "user@example.com"
}
```

---

### Example

```bash
curl --location --request POST 'http://localhost:3000/v1/newsletter/subscribe' \
--header 'Content-Type: application/json' \
--data-raw '{
  "emailAddress": "user@example.com"
}'
```

---

## Response Body

---

```json
{
  "success": true
}
```

---

## ⚠️ Notes

---

* `emailAddress` must be a valid email format
* `emailAddress` must be a real, deliverable email address
* Email is automatically normalized (trimmed and lowercased)
* Some test or placeholder emails (e.g., `example.com`) may be rejected by Mailchimp
* Duplicate subscriptions are handled gracefully (no error)
* The request is idempotent — repeated calls with same email will succeed
* Integration is handled via Mailchimp audience
* On successful subscription, API returns **200 OK**
* This is a public endpoint

---

## ❌ Error Handling

---

### Invalid Email (Validation Error)

```json
{
  "statusCode": 400,
  "message": ["emailAddress must be an email"],
  "error": "Bad Request"
}
```

---

### Mailchimp Validation / Failure

Mailchimp may reject emails that appear invalid, fake, or non-existent.

Example:

```json
{
  "error": "testuser@example.com looks fake or invalid, please enter a real email address."
}
```

---

### Generic Failure

```json
{
  "error": "Failed to subscribe to newsletter"
}
```

---

## 🔐 Configuration

---

The following environment variables must be configured:

```env
MAILCHIMP_API_KEY=your_api_key-usXX
MAILCHIMP_AUDIENCE_ID=your_audience_id
```

---

## 💡 Behavior Summary

---

* Uses Mailchimp audience to store subscribers
* No local database persistence
* Safe for repeated requests (idempotent design)
* Designed as a public-facing endpoint

---
