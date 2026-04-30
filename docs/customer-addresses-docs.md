Customer Addresses REST API
===========================

This document includes the documentation of the customer addresses module.

Procedure to create your first customer address
-----------------------------------------------

Follow the following steps to create your first customer address. You can see the documentation of each step below.

1. Login as a customer.
2. Using your customer auth token, you can create your first customer address.

Default customer address
------------------------
We need to make sure that each customer has at least one default customer address.

Each time you create a customer address, it will make other address as NOT default. You latest customer address will be marked as default. You can later patch any address as default.

Your default customer address cannot be deleted.

Customer Addresses
==================

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your must have a Customer account to use the GraphQL APIs.

Create Customer Address
-----------------------

```http
POST /v1/customer-addresses HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
fullName | Yes | String | Name of your contact at the address
countryCode | Yes | String | The calling code of the phone number
phoneNumber | Yes | String | The phone number of your contact
streetAddress | No | String | Address line
apartment | Yes | String | The apartment in which your location is based in.
zipCode | Yes | String | The zip code of the city in which the warehouse is based in
city | Yes | String | The city in which the warehouse is based in
state | Yes | String | The state in which your location is based in.
country | Yes | String | The country in which your location is based in.

### Request Body

```json
{
    "fullName": "James",
    "countryCode": "+974",
    "phoneNumber": "12345678",
    "streetAddress": "Example Road",
    "apartment": "Unit 18",
    "zipCode": "12345",
    "city": "Example City",
    "state": "Example State",
    "country": "Example country"
}
```

### Response Body

```json
{
    "uuid": "95b1d0e0-b9d2-43e4-bc73-74be0fad5282",
    "customer": {
        "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
        "fullName": "Your Name",
        "emailAddress": "your-name@your-domain.com",
        "phoneNumber": "+974 12345678",
        "role": "customer"
    },
    "fullName": "James",
    "phoneNumber": "+974 12345678",
    "streetAddress": "Example Road",
    "apartment": "Unit 18",
    "zipCode": "12345",
    "city": "Example City",
    "state": "Example State",
    "country": "Example country",
    "isDefault": true
}
```

Get Customer Addresses
----------------------

```http
GET /v1/customer-addresses HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "55f22406-d49d-47d2-8298-0a47064eac78",
        "fullName": "James",
        "phoneNumber": "+974 12345678",
        "streetAddress": "Example Road",
        "apartment": "Unit 18",
        "zipCode": "12345",
        "city": "Example City",
        "state": "Example State",
        "country": "Example country",
        "isDefault": false
    },
    {
        "uuid": "c394f3b0-e9a1-4467-9bfc-753f57b1869b",
        "fullName": "James",
        "phoneNumber": "12345678",
        "streetAddress": "Example Road",
        "apartment": "Unit 18",
        "zipCode": "12345",
        "city": "Example City",
        "state": "Example State",
        "country": "Example country",
        "isDefault": true
    }
]
```

Get Customer Address
--------------------

```http
GET /v1/customer-addresses/<customer-address-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "c394f3b0-e9a1-4467-9bfc-753f57b1869b",
    "customer": {
        "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
        "fullName": "Your Name",
        "emailAddress": "your-name@your-domain.com",
        "phoneNumber": "+974 12345678",
        "role": "customer"
    },
    "fullName": "James",
    "phoneNumber": "+974 12345678",
    "streetAddress": "Example Road",
    "apartment": "Unit 18",
    "zipCode": "12345",
    "city": "Example City",
    "state": "Example State",
    "country": "Example country",
    "isDefault": false
}
```

Update Customer Addresses
-------------------------

```http
PUT /v1/customer-addresses/<customer-address> HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
fullName | Yes | String | Name of your contact at the address
countryCode | Yes | String | The calling code of the phone number
phoneNumber | Yes | String | The phone number of your contact
streetAddress | No | String | Address line
apartment | Yes | String | The apartment in which your location is based in.
zipCode | Yes | String | The zip code of the city in which the warehouse is based in
city | Yes | String | The city in which the warehouse is based in
state | Yes | String | The state in which your location is based in.
country | Yes | String | The country in which your location is based in.
isDefault | Yes | String | Determines if the current address is your default shipping address

### Request Body

```json
{
    "fullName": "James",
    "countryCode": "+974",
    "phoneNumber": "12345678",
    "streetAddress": "Example Road",
    "apartment": "Unit 18",
    "zipCode": "12345",
    "city": "Example City",
    "state": "Example State",
    "country": "Example country",
    "isDefault": true
}
```

### Response Body

```json
{
    "uuid": "c394f3b0-e9a1-4467-9bfc-753f57b1869b",
    "customer": {
        "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
        "fullName": "Your Name",
        "emailAddress": "your-name@your-domain.com",
        "phoneNumber": "+974 12345678",
        "role": "customer"
    },
    "fullName": "James",
    "phoneNumber": "12345678",
    "streetAddress": "Example Road",
    "apartment": "Unit 18",
    "zipCode": "12345",
    "city": "Example City",
    "state": "Example State",
    "country": "Example country",
    "isDefault": true
}
```

Patch Customer Address
----------------------

```http
PATCH /v1/customer-addresses/<customer-address-uuid> HTTP/1.1
```

### Request Body

```json
{
    "isDefault": true
}
```

### Response Body

```json
{
    "uuid": "c394f3b0-e9a1-4467-9bfc-753f57b1869b",
    "customer": {
        "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
        "fullName": "Your Name",
        "emailAddress": "your-name@your-domain.com",
        "phoneNumber": "+974 12345678",
        "role": "customer"
    },
    "fullName": "James",
    "phoneNumber": "12345678",
    "streetAddress": "Example Road",
    "apartment": "Unit 18",
    "zipCode": "12345",
    "city": "Example City",
    "state": "Example State",
    "country": "Example country",
    "isDefault": true
}
```

Delete Customer Addresses
-------------------------

```http
DELETE /v1/customer-addresses/<customer-address-uuid> HTTP/1.1
```
