Key/Value Pairs REST API
========================

The key value pairs api is used as configuration. We need it to calculate the price and discounted price on product.

Procedure to Create Your First Key/Value Pair
---------------------------------------------

Follow the following steps to create your first key value pair. Your can find the documentation of each step below.

1. Create a key value pair.

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

Create Key Value Pair
---------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
POST /v1/key-value-pairs HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
name | Yes | String | The name of the key
type | Yes | String | The type of the key, must be one of `integer`, `decimal`, `string` and `boolean`
integerValue | Yes | String | The value of integer. This is a fixed integer value
decimalValue | No | String | The value of the decimal. This can be a floating point value
stringValue | No | String | The value of the string.
booleanValue | No | String | The value of the boolean.

### Request Body

```json
{
    "name": "discount_below_1000",
    "type": "decimal",
    "integerValue": 0,
    "decimalValue": 10,
    "stringValue": "",
    "booleanValue": false
}
```

### Response Body

```json
{
	"uuid": "aa21e392-e29e-4d3f-a35a-b5049f9c6c43",
	"name": "discount_below_1000",
	"type": "decimal",
	"integerValue": 0,
	"decimalValue": "10",
	"stringValue": "",
	"booleanValue": false
}
```

Retrieve Key Value Pairs
------------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
GET /v1/key-value-pairs HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "9b19b3ad-ad63-477e-b9d6-592724007767",
        "name": "price_multiplier",
        "type": "decimal",
        "integerValue": 0,
        "decimalValue": "1.4",
        "stringValue": "",
        "booleanValue": false
    },
    {
        "uuid": "aa21e392-e29e-4d3f-a35a-b5049f9c6c43",
        "name": "discount_above_100",
        "type": "decimal",
        "integerValue": 0,
        "decimalValue": "20",
        "stringValue": "",
        "booleanValue": false
    },
    {
        "uuid": "8b603586-87c5-4b9c-813e-b40f095c5dac",
        "name": "discount_below_100",
        "type": "decimal",
        "integerValue": 0,
        "decimalValue": "9",
        "stringValue": "",
        "booleanValue": false
    }
]
```

Retrieve Key Value Pair
-----------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
GET /v1/key-value-pairs/<key-value-pair-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "8b603586-87c5-4b9c-813e-b40f095c5dac",
    "name": "discount_below_100",
    "type": "decimal",
    "integerValue": 0,
    "decimalValue": "9",
    "stringValue": "",
    "booleanValue": false
}
```

Update Key Value Pair
---------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
PUT /v1/key-value-pairs/<key-value-pair-uuid> HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
name | Yes | String | The name of the key
type | Yes | String | The type of the key, must be one of `integer`, `decimal`, `string` and `boolean`
integerValue | Yes | String | The value of integer. This is a fixed integer value
decimalValue | No | String | The value of the decimal. This can be a floating point value
stringValue | No | String | The value of the string.
booleanValue | No | String | The value of the boolean.

### Request Body

```json
{
    "name": "discount_below_100",
    "type": "decimal",
    "integerValue": 0,
    "decimalValue": 9,
    "stringValue": "",
    "booleanValue": false
}
```

### Response Body

```json
{
	"uuid": "aa21e392-e29e-4d3f-a35a-b5049f9c6c43",
	"name": "discount_below_1000",
	"type": "decimal",
	"integerValue": 0,
	"decimalValue": "9",
	"stringValue": "",
	"booleanValue": false
}
```

Delete Key Value Pair
---------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
DELETE /v1/key-value-pairs/<key-value-pair-uuid> HTTP/1.1
```
