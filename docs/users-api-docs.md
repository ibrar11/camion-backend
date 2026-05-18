Users API Docs
==============

Create User
-----------

```http
POST /v1/users HTTP/1.1
```

### Request Body

```json
{
    "fullName": "James",
    "emailAddress": "james@outlook.net",
    "password": "your-password",
    "role": "super-admin",
    "isActive": true
}
```

### Response Body

```json
{
    "uuid": "376edb0c-1b40-48ac-ae39-0b8dfc3fa458",
    "fullName": "James",
    "role": "super-admin",
    "isMfaEnabled": false,
    "isActive": true
}
```

Retrieve Users
--------------

```http
GET /v1/users HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "91f70385-9c1e-4af6-af2d-c536434ff439",
        "fullName": "Camion User",
        "role": "super-admin",
        "isMfaEnabled": false,
        "isActive": true
    },
    {
        "uuid": "dfb5fd9d-b3f7-4a6d-aa66-38e91f0eb93e",
        "fullName": "James",
        "role": "manager",
        "isMfaEnabled": false,
        "isActive": false
    },
    {
        "uuid": "3fa699a5-f820-4e61-9555-b4f93bd8ea5c",
        "fullName": "James",
        "role": "super-admin",
        "isMfaEnabled": false,
        "isActive": false
    },
    {
        "uuid": "376edb0c-1b40-48ac-ae39-0b8dfc3fa458",
        "fullName": "James",
        "role": "super-admin",
        "isMfaEnabled": false,
        "isActive": true
    }
]
```

Retrieve User
-------------

```http
GET /v1/users/<user-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "91f70385-9c1e-4af6-af2d-c536434ff439",
    "fullName": "Camion User",
    "role": "super-admin",
    "isMfaEnabled": false,
    "isActive": true
}
```

Update User
-----------

```http
PUT /v1/users/<user-uuid> HTTP/1.1
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
    "uuid": "91f70385-9c1e-4af6-af2d-c536434ff439",
    "fullName": "James",
    "role": "super-admin",
    "isMfaEnabled": false,
    "isActive": true
}
```

Update Email Address
--------------------

```http
PUT /v1/users/<user-uuid>/email-address HTTP/1.1
```

### Request Body

```json
{
    "emailAddress": "your-name@outlook.com"
}
```

### Response Body

```json
{
    "uuid": "376edb0c-1b40-48ac-ae39-0b8dfc3fa458",
    "fullName": "James",
    "role": "super-admin",
    "isMfaEnabled": false,
    "isActive": true
}
```

Update Password
---------------

```http
PUT /v1/users/<user-uuid>/password HTTP/1.1
```

### Request Body

```json
{
    "password": "your-password"
}
```

### Response Body

```json
{
    "uuid": "376edb0c-1b40-48ac-ae39-0b8dfc3fa458",
    "fullName": "James",
    "role": "super-admin",
    "isMfaEnabled": false,
    "isActive": true
}
```

Update Role
-----------

```http
PUT /v1/users/<user-uuid>/role HTTP/1.1
```

### Request Body

```json
{
    "role": "manager"
}
```

### Response Body

```json
{
    "uuid": "91f70385-9c1e-4af6-af2d-c536434ff439",
    "fullName": "James",
    "role": "manager",
    "isMfaEnabled": false,
    "isActive": true
}
```

Update Status
-------------

```http
PUT /v1/users/<user-uuid>/status HTTP/1.1
```

### Request Body

```json
{
    "isActive": true
}
```

### Response Body

```json
{
    "uuid": "a9240b75-dac8-4e57-a1b7-c1278ddee7bf",
    "fullName": "James",
    "role": "manager",
    "isMfaEnabled": false,
    "isActive": true
}
```

Delete User
-----------

```http
DELETE /v1/users/<user-uuid> HTTP/1.1
```
