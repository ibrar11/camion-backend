Exchange Rate REST API
======================

The exchange rate api is used to convert prices from the base cost of the product to the final price and discounted prices a customer will have to pay.

Procedure to Create Your First Product
--------------------------------------

Follow the following steps to create your first exchange rate. Your can find the documentation of each step below.

1. Create an exchange rate.

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

Create Exchange Rate
--------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
POST /v1/exchange-rates HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
srcCurrencyCode | Yes | String | The source currency, this will be usd for 1688
targetCurrencyCode | Yes | String | The target currency, this will be qar for Qatar
factor | Yes | String | The value of target currency, eg, 1 usd = 3.65 qar. The factor will be 3.65

### Request Body

```json
{
    "srcCurrencyCode": "usd",
    "targetCurrencyCode": "qar",
    "factor": 3.75
}
```

### Response Body

```json
{
	"uuid": "befc9c19-451b-4902-8509-ece5b94e3666",
	"srcCurrencyCode": "usd",
	"targetCurrencyCode": "qar",
	"factor": "3.75"
}
```

Get Exchange Rates
------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
GET /v1/exchange-rates HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "befc9c19-451b-4902-8509-ece5b94e3666",
        "srcCurrencyCode": "usd",
        "targetCurrencyCode": "qar",
        "factor": "3.75"
    }
]
```

Get Exchange Rate
-----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
GET /v1/exchange-rates/<exchange-rate-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "befc9c19-451b-4902-8509-ece5b94e3666",
    "srcCurrencyCode": "usd",
    "targetCurrencyCode": "qar",
    "factor": "3.75"
}
```

Update Exchange Rate
--------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
PUT /v1/exchange-rates/<exchange-rate-uuid> HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
srcCurrencyCode | Yes | String | The source currency, this will be usd for 1688
targetCurrencyCode | Yes | String | The target currency, this will be qar for Qatar
factor | Yes | String | The value of target currency, eg, 1 usd = 3.65 qar. The factor will be 3.65

### Request Body

```json
{
    "srcCurrencyCode": "usd",
    "targetCurrencyCode": "qar",
    "factor": 3.65
}
```

### Response Body

```json
{
    "uuid": "befc9c19-451b-4902-8509-ece5b94e3666",
    "srcCurrencyCode": "usd",
    "targetCurrencyCode": "qar",
    "factor": "3.65"
}
```

Delete Exchange Rate
--------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
DELETE /v1/exchange-rates/<exchange-rate-uuid> HTTP/1.1
```
