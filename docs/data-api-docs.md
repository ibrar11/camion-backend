Data REST API
=============

The data api is used to fetch the estimated counts of items in many relations across camion.

Get Counts
----------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
GET /v1/data/counts HTTP/1.1
```

### Response Body
```json
{
    "banners": 0,
    "categories": 1,
    "orders": 1,
    "products": 9,
    "stories": 1
}
```
