# OAuth & Clients REST API

==========================

This document includes the documentation of OAuth authentication and Clients management module.

---

## Procedure to Authenticate a Client

Follow the following steps to authenticate a client:

1. Create your client.
2. Generate access token using client credentials.
3. Use refresh token to regenerate tokens when needed.

---

# Clients API

Clients represent machine-to-machine consumers of the system.

---

## Create a Client

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
POST /v1/clients HTTP/1.1
```

---

### Request Body

```json
{
    "name": "My Service",
    "description": "Internal service",
    "homepage": "https://example.com"
}
```

---

### Response Body

```json
{
    "uuid": "client-uuid",
    "secret": "plain-generated-secret"
}
```

---

### Notes

* Secret is generated automatically
* Secret is returned only once
* Secret is stored hashed using bcrypt

---

## Retrieve Clients

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
GET /v1/clients HTTP/1.1
```

---

### Response Body

```json
[
    {
        "uuid": "client-uuid",
        "name": "My Service",
        "description": "Internal service",
        "homepage": "https://example.com",
        "status": "Active"
    }
]
```

---

## Retrieve Client

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
GET /v1/clients/<client-uuid> HTTP/1.1
```

---

### Response Body

```json
{
    "uuid": "client-uuid",
    "name": "My Service",
    "description": "Internal service",
    "homepage": "https://example.com",
    "status": "Active"
}
```

---

## Update Client

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
PUT /v1/clients/<client-uuid> HTTP/1.1
```

---

### Request Body

```json
{
    "name": "Updated Name",
    "description": "Updated description",
    "homepage": "https://example.com"
}
```

---

### Response Body

```json
{
    "uuid": "client-uuid",
    "name": "Updated Name",
    "description": "Updated description",
    "homepage": "https://example.com",
    "status": "Active"
}
```

---

## Update Client Status

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
PUT /v1/clients/<client-uuid>/status HTTP/1.1
```

---

### Request Body

```json
{
    "status": "ACTIVE"
}
```

---

### Response Body

```json
{
    "uuid": "client-uuid",
    "status": "ACTIVE"
}
```

---

### Behavior

* If status is not ACTIVE:

  * refreshToken is cleared
  * refreshTokenExpiresAt is cleared
* Immediately invalidates authentication capability

---

## Delete Client

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
DELETE /v1/clients/<client-uuid> HTTP/1.1
```

---

# OAuth API

> [!IMPORTANT]
> All requests must include required fields depending on the grant type.

---

## Generate Token

> [!IMPORTANT]
> Public endpoint used to generate access and refresh tokens.

```http
POST /v1/oauth/token HTTP/1.1
```

---

### Request Body (Client Credentials)

```json
{
    "grant_type": "client_credentials",
    "client_id": "client-uuid",
    "client_secret": "plain-secret"
}
```

---

### Request Body (Refresh Token)

```json
{
    "grant_type": "refresh_token",
    "refresh_token": "existing-refresh-token"
}
```

---

### Response Body

```json
{
    "access_token": "jwt-token",
    "refresh_token": "new-refresh-token",
    "token_type": "Bearer",
    "expires_in": "<dynamic: based on ACCESS_TOKEN_TTL>"
}
```

---

### Token Expiry

The `expires_in` value is dynamically derived from the `ACCESS_TOKEN_TTL` environment variable.

Supported formats include:

- `48h` (hours)
- `30m` (minutes)
- `3600s` (seconds)

> [!WARNING]
> Only integer values are supported for `ACCESS_TOKEN_TTL` (e.g., `48h`, `30m`, `3600s`).
> Decimal values like `1.5h` are not supported.

Example:

| ACCESS_TOKEN_TTL | expires_in |
|-----------------|-----------|
| 48h             | 172800    |
| 30m             | 1800      |
| 3600s           | 3600      |

---

### Behavior

Client Credentials Flow:

* Validates client existence
* Ensures client status is Active
* Verifies client secret using bcrypt
* Generates JWT access token (RS256)
* Generates refresh token
* Stores refresh token with 90-day expiry

Refresh Token Flow:

* Validates refresh token existence
* Ensures client status is Active
* Checks token expiration
* Generates new access token
* Rotates refresh token (invalidates old one)

---

### Errors

| Error            | Description                |
| ---------------- | -------------------------- |
| 400 Bad Request  | Missing required fields    |
| 400 Bad Request  | Unsupported grant type     |
| 401 Unauthorized | Invalid client credentials |
| 401 Unauthorized | Client is not active       |
| 401 Unauthorized | Invalid refresh token      |
| 401 Unauthorized | Refresh token expired      |

---

### Behavior

* Idempotent operation
* No error if client does not exist

---

# Security Notes

* Client secrets:

  * Generated using random bytes
  * Hashed using bcrypt

* JWT:

  * Signed using RS256
  * Payload:

```json
{
    "sub": "client-uuid",
    "type": "client"
}
```

* Refresh Tokens:

  * Generated using secure random bytes
  * Stored server-side
  * Rotated on each refresh
  * Expire after 90 days
