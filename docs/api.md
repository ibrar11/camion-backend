Camion REST API
===============

User Authentication
===================

Register your account as a user
-------------------------------

### API Endpoint
```http
POST /v1/auth/user/register HTTP/1.1
```

### Request Body
```json
{
    "fullName": "Camion User",
    "emailAddress": "user@camion-app.com",
    "password": "your-password"
}
```

### Response Body
```json
{
    "token": "your-access-token",
    "user": {
        "uuid": "47da9315-f06b-4419-a4e2-1d4c20b99b19",
        "fullName": "Camion User",
        "role": "user",
        "isMfaEnabled": false,
        "isActive": false
    }
}
```

Login as a user
---------------

### API Endpoint
```http
POST /v1/auth/user/login HTTP/1.1
```

### Request Body
```json
{
    "emailAddress": "user@camion-app.com",
    "password": "your-password"
}
```

### Response Body
```json
{
    "token": "your-access-token",
    "user": {
        "uuid": "47da9315-f06b-4419-a4e2-1d4c20b99b19",
        "fullName": "Camion User",
        "role": "user",
        "isMfaEnabled": false,
        "isActive": false
    }
}
```

Logout as a user
----------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

### API Endpoint
```http
POST /v1/auth/user/logout HTTP/1.1
```

Update User (Self)
------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

### API Endpoint
```http
POST /v1/auth/user/self HTTP/1.1
```

### Request Body
```json
{
    "fullName": "<Your new name>"
}
```

### Response Body
```json
{
    "uuid": "your-uuid",
    "fullName": "Your new name",
    "role": "user",
    "isMfaEnabled": false,
    "isActive": true
}
```

Update User Email Address (Self)
--------------------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

### API Endpoint
```http
POST /v1/auth/user/self/email-address HTTP/1.1
```

### Request Body
```json
{
    "emailAddress": "your-new-email@camion-app.com"
}
```

### Response Body
```json
{
    "uuid": "47da9315-f06b-4419-a4e2-1d4c20b99b19",
    "fullName": "Camion User",
    "role": "user",
    "isMfaEnabled": false,
    "isActive": true
}
```

Update User Password (Self)
---------------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

### API Endpoint
```http
POST /v1/auth/user/self/password HTTP/1.1
```

### Request Body
```json
{
    "passwordOld": "<your-old-password>",
    "passwordNew": "<your-new-password>",
    "passwordConfirm": "<your-new-password>"
}
```

### Response Body
```json
{
    "uuid": "47da9315-f06b-4419-a4e2-1d4c20b99b19",
    "fullName": "Camion User",
    "role": "user",
    "isMfaEnabled": false,
    "isActive": true
}
```

Customer Authentication
=======================

TODO:
