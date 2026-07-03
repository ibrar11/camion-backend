Camion Customer Auth API
========================

Customer Authentication
=======================

Register an account as customer
-------------------------------

### API Endpoint
```http
POST /v1/auth/customer/register HTTP/1.1
```

### Request Body
```json
{
    "fullName": "Your Name",
    "emailAddress": "your-name@your-domain.com",
    "countryCode": "QA",
    "phoneNumber": "12345678",
    "guestUUID": "1234534"
}
```

### Response Body
```json
{
    "token": "<your-access-token>",
    "customer": {
        "uuid": "880516d5-bb21-4dc1-80d0-d4bc7af8166e",
        "fullName": "Your Name",
        "emailAddress": "your-name@your-domain.com",
        "phoneNumber": "+974 12345678",
        "role": "customer"
    }
}
```

Login as a customer (Using your Email Address)
----------------------------------------------

The login happens in 2 stages. In the first stage you provide an email address and we'll generate a session token alongside an OTP. You'll need to provide the same token and the OTP in verification stage to continue your session.

### API Endpoint
```http
POST /v1/auth/customer/login/email-address HTTP/1.1
```

### Request Body
```json
{
    "emailAddress": "your-name@your-domain.com",
    "guestUUID": "1234534"
}
```

### Response Body
```json
{
    "token": "<your-login-session-token>"
}
```

### Errors

| Status | Description |
|---|---|
| 400 Bad Request | No account found with the provided email address |
| 401 Unauthorized | Account has been permanently deleted — contact support |
| 401 Unauthorized | Account is deactivated |

> Accounts with a **pending deletion** (within the grace period) are not blocked — the OTP proceeds normally and the deletion is cancelled on successful verification.

---

Verify login as a customer (Using your Email Address)
-----------------------------------------------------

Once you start your login session by providing your email address. You'll receive an OTP via email address. You'll need to provide that OTP to verify your email address and continue your session.

> The default OTP in `dev` and `local` environments is `123456`

### API Endpoint
```http
POST /v1/auth/customer/verify/email-address HTTP/1.1
```

### Request Body
```json
{
    "token": "<your-login-session-token>",
    "secret": "123456",
    "guestUUID": "<optional-guest-customer-uuid>"
}
```

| Field | Required | Description |
|---|---|---|
| `token` | Yes | Session token returned from the login step |
| `secret` | Yes | OTP received via email |
| `guestUUID` | No | Guest customer UUID — if provided, guest cart is merged into the authenticated account |

### Response Body
```json
{
    "token": "<your-access-token>",
    "customer": {
        "uuid": "880516d5-bb21-4dc1-80d0-d4bc7af8166e",
        "fullName": "Your Name",
        "emailAddress": "your-name@your-domain.com",
        "phoneNumber": "+974 12345678",
        "role": "customer"
    }
}
```

> If the account had a pending deletion, it is **automatically cancelled** on successful verification and the account is fully restored.

---

Login as a customer (Using your Phone Number)
---------------------------------------------

The login happens in 2 stages. In the first stage you provide a phone number and we'll generate a session token alongside an OTP. You'll need to provide the same token and the OTP in verification stage to continue your session.

### API Endpoint
```http
POST /v1/auth/customer/login/phone-number HTTP/1.1
```

### Request Body
```json
{
    "countryCode": "QA",
    "phoneNumber": "12345678",
    "guestUUID": "1234534"
}
```

### Response Body
```json
{
    "token": "<your-login-session-token>"
}
```

### Errors

| Status | Description |
|---|---|
| 400 Bad Request | No account found with the provided phone number |
| 401 Unauthorized | Account has been permanently deleted — contact support |
| 401 Unauthorized | Account is deactivated |

> Accounts with a **pending deletion** (within the grace period) are not blocked — the OTP proceeds normally and the deletion is cancelled on successful verification.

---

Verify login as a customer (Using your Phone Number)
-----------------------------------------------------

Once you start your login session by providing your phone number. You'll receive an OTP via SMS. You'll need to provide that OTP to verify your phone number and continue your session.

> The default OTP in `dev` and `local` environments is `123456`

### API Endpoint
```http
POST /v1/auth/customer/verify/phone-number HTTP/1.1
```

### Request Body
```json
{
    "token": "<your-login-session-token>",
    "secret": "123456",
    "guestUUID": "<optional-guest-customer-uuid>"
}
```

| Field | Required | Description |
|---|---|---|
| `token` | Yes | Session token returned from the login step |
| `secret` | Yes | OTP received via SMS |
| `guestUUID` | No | Guest customer UUID — if provided, guest cart is merged into the authenticated account |

### Response Body
```json
{
    "token": "<your-access-token>",
    "customer": {
        "uuid": "880516d5-bb21-4dc1-80d0-d4bc7af8166e",
        "fullName": "Your Name",
        "emailAddress": "your-name@your-domain.com",
        "phoneNumber": "+974 12345678",
        "role": "customer"
    }
}
```

> If the account had a pending deletion, it is **automatically cancelled** on successful verification and the account is fully restored.

Logout as a customer
--------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

### API Endpoint
```http
POST /v1/auth/customer/logout HTTP/1.1
```

Update Current Customer's Profile
---------------------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

### API Endpoint
```http
PUT /v1/auth/customer/self HTTP/1.1
```

### Request Body
```json
{
    "fullName": "James"
}
```

### Response Body
```json
{
    "uuid": "91f5c5a2-b828-4218-b6eb-04e87df57c53",
    "fullName": "James",
    "emailAddress": "your-name@your-domain.com",
    "phoneNumber": "+974 12345678",
    "role": "customer"
}
```

Update Current Customer's Email Address
---------------------------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

### API Endpoint
```http
PUT /v1/auth/customer/self/email-address HTTP/1.1
```

### Request Body
```json
{
    "uuid": "91f5c5a2-b828-4218-b6eb-04e87df57c53",
    "fullName": "James",
    "emailAddress": "your-name@your-domain.com",
    "phoneNumber": "+974 12345678",
    "role": "customer"
}
```
