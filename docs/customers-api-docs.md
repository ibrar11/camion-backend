Customers REST API
==================

The customers api is used to manipulate the customers data.

Create Customer
---------------

### Request Body

```json
{
    "fullName": "James",
    "emailAddress": "your-password@outlook.ram",
    "countryCode": "+92",
    "phoneNumber": "03048111234",
    "password": "your-password"
}
```

### Response Body

```json
{
    "uuid": "947cbe22-eaad-4753-9ff5-ec570ca539d3",
    "fullName": "James",
    "emailAddress": "your-password@outlook.ram",
    "phoneNumber": "+92 304 8111234",
    "role": "customer",
    "unreadNotificationCount": 0
}
```

Retrieve Customers
------------------

```http
GET /v1/customers HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "947cbe22-eaad-4753-9ff5-ec570ca539d3",
        "fullName": "James",
        "emailAddress": "your-password@outlook.ram",
        "phoneNumber": "+92 304 8112109",
        "role": "customer",
        "unreadNotificationCount": 0
    }
]
```

Retrieve Customers (By Name)
----------------------------

```http
GET /v1/customers?filters={"fullName":"Camion"} HTTP/1.1
```

### Response Body

```json
[
	{
        "uuid": "4aa1e784-565d-4bf8-a44f-e9638dd2a7af",
        "fullName": "Camion Guest",
        "emailAddress": "guest-742290@camion-app.com",
        "phoneNumber": "gst-45815",
        "role": "guest",
        "unreadNotificationCount": 0
    }
]
```

Retrieve Customers (By Email Address)
-------------------------------------

```http
GET /v1/customers?filters={"emailAddress":"guest-742290@camion-app.com"} HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "4aa1e784-565d-4bf8-a44f-e9638dd2a7af",
        "fullName": "Camion Guest",
        "emailAddress": "guest-742290@camion-app.com",
        "phoneNumber": "gst-45815",
        "role": "guest",
        "unreadNotificationCount": 0
    }
]
```

Retrieve Customers (By Phone Number)
------------------------------------

```http
GET /v1/customers?filters={"phoneNumber":"gst-45815"} HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "4aa1e784-565d-4bf8-a44f-e9638dd2a7af",
        "fullName": "Camion Guest",
        "emailAddress": "guest-742290@camion-app.com",
        "phoneNumber": "gst-45815",
        "role": "guest",
        "unreadNotificationCount": 0
    }
]
```

Retrieve Customer
-----------------

```http
GET /v1/customers/<customer-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "4aa1e784-565d-4bf8-a44f-e9638dd2a7af",
    "fullName": "Camion Guest",
    "emailAddress": "guest-742290@camion-app.com",
    "phoneNumber": "gst-45815",
    "role": "guest",
    "unreadNotificationCount": 0
}
```

Update Customer
---------------

```http
PUT /v1/customers/<customer-uuid> HTTP/1.1
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
    "uuid": "4aa1e784-565d-4bf8-a44f-e9638dd2a7af",
    "fullName": "James",
    "emailAddress": "guest-742290@camion-app.com",
    "phoneNumber": "gst-45815",
    "role": "guest",
    "unreadNotificationCount": 0
}
```

Update Email Address
--------------------

```http
PUT /v1/customers/<customer-uuid>/email-address HTTP/1.1
```

### Request Body

```json
{
    "emailAddress": "your-password@outlook.raw"
}
```

### Response Body

```json
{
    "uuid": "4aa1e784-565d-4bf8-a44f-e9638dd2a7af",
    "fullName": "James",
    "emailAddress": "your-password@outlook.raw",
    "phoneNumber": "gst-45815",
    "role": "guest",
    "unreadNotificationCount": 0
}
```

Update Password
---------------

```http
PUT /v1/customers/960b5366-8263-41cf-8ceb-2c0398e59a34/password HTTP/1.1
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
    "uuid": "4aa1e784-565d-4bf8-a44f-e9638dd2a7af",
    "fullName": "James",
    "emailAddress": "your-password@outlook.raw",
    "phoneNumber": "gst-45815",
    "role": "guest",
    "unreadNotificationCount": 0
}
```

Delete Customer
---------------

```http
DELETE /v1/customers/<customer-uuid> HTTP/1.1
```
