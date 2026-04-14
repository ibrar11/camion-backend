Camion Guest Auth API
=====================

Guest Authentication
====================

Register an account as guest
----------------------------

A guest is a normal customer with a role of `Guest`, they're able to add items to their cart but will need to register their account to checkout.

### API Endpoint
```http
POST /v1/auth/guest/register HTTP/1.1
```

### Request Body
```json
{
    "deviceId": "120343",
    "token": "12349"
}
```

### Response Body
```json
{
    "token": "<your-access-token>",
    "customer": {
        "uuid": "ee1ac987-00a8-4f07-93aa-dd109816fd2c",
        "fullName": "Camion Guest",
        "emailAddress": "guest-282603@camion-app.com",
        "phoneNumber": "gst-776658",
        "role": "guest",
        "deviceId": "1203434"
    }
}
```
