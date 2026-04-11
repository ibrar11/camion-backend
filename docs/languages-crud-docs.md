# Languages API

===========

This document includes the documentation of languages module.

---

## Procedure to Manage Languages

---

Follow the steps below to manage languages in the system.

1. Create a language.
2. Retrieve languages.
3. Retrieve a single language.
4. Update language details.
5. Delete a language.

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

---

## Create a Language

---

You can create a new language using the following API route.

```HTTP
POST /v1/languages HTTP/1.1
```

### Example

```bash
curl --location --request POST 'http://localhost:3000/v1/languages' \
--header 'Authorization: Bearer <YOUR_ACCESS_TOKEN>' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "French",
    "shortCode": "fr"
}'
```

### Response Body

```json
{
    "uuid": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "name": "French",
    "shortCode": "fr"
}
```

---

## Retrieve Languages

---

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`, `User`

```HTTP
GET /v1/languages HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "1",
        "name": "English",
        "shortCode": "en"
    },
    {
        "uuid": "2",
        "name": "Arabic",
        "shortCode": "ar"
    }
]
```

---

## Update Language

---

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```HTTP
PUT /v1/languages/<language-uuid> HTTP/1.1
```

### Request Body

```json
{
    "name": "French Updated",
    "shortCode": "fr"
}
```

### Response Body

```json
{
    "uuid": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "name": "French Updated",
    "shortCode": "fr"
}
```

---

## Delete Language

---

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```HTTP
DELETE /v1/languages/<language-uuid> HTTP/1.1
```

---

## ⚠️ Notes

---

* `shortCode` must be unique (e.g., en, ar, fr)
* `shortCode` is automatically converted to lowercase
* Duplicate `shortCode` will result in a **409 Conflict error**
* Default languages are automatically seeded on application startup

---

## 💡 Example Seeded Languages

---

The system initializes with the following languages:

* en — English
* ar — Arabic

---
