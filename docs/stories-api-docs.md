Story API
=========

This document includes the documentation of stories module.

Procedure to Create Your First Story
------------------------------------

Follow the following steps to create your first product. Your can find the documentation of each step below.

1. Create your story.
2. Create one or more frames to the story.

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

Stories API
===========

Create a story
--------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
POST /v1/stories HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
caption.en | Yes | String | Caption of the story in English
caption.ar | Yes | String | Caption of the story in Arabic
isHighlighted | Yes | String | Determines is the story will be highlighted

### Request Body
```json
{
    "caption": {
        "en": "Upcoming Products (English)",
        "ar": "Upcoming Products (Arabic)"
    },
    "isHighlighted": true
}
```

### Response Body
```json
{
    "uuid": "5627c79d-033c-482c-bb6d-ba0241d8e206",
    "captionEn": "Upcoming Products (English)",
    "captionAr": "Upcoming Products (Arabic)",
    "isHighlighted": true,
    "viewsCount": "0"
}
```

Retrieve Stories
----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
GET /v1/stories HTTP/1.1
```

### Query Parameters
Name | Description | Default
-----|-------------|--------
filters | A JSON string containing your search term, or any advanced search parameters. | `{}`
sort | The order in which we need to sort results |
pageNumber | The current page number | 1
itemsPerPage | The number of results to retrieve in the response | 100

### Response Body
```json
[
    {
        "uuid": "6ff3643d-02fd-4757-abde-93d99daa57ee",
        "captionEn": "2025 (English)",
        "captionAr": "2025 (Arabic)",
        "isHighlighted": false,
        "viewsCount": "0",
        "frames": [
            {
                "uuid": "d0bd2ed9-81b2-44fe-84dc-9c52a794a2a3",
                "mediaType": "image",
                "mediaUrl": "https://camion.s3.us-east-1.amazonaws.com/5b74e195-ebac-4fea-a84d-a654f96ed5b5.jpg",
                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/5b74e195-ebac-4fea-a84d-a654f96ed5b5.jpg",
                "duration": "5",
                "order": "0",
                "stickers": []
            }
        ]
    }
]
```

Retrieve Story
--------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
GET /v1/stories/<story-uuid> HTTP/1.1
```

### Response Body
```json
{
    "uuid": "6ff3643d-02fd-4757-abde-93d99daa57ee",
    "captionEn": "2025 (English)",
    "captionAr": "2025 (Arabic)",
    "isHighlighted": false,
    "viewsCount": "0",
    "frames": [
        {
            "uuid": "d0bd2ed9-81b2-44fe-84dc-9c52a794a2a3",
            "mediaType": "image",
            "mediaUrl": "https://camion.s3.us-east-1.amazonaws.com/5b74e195-ebac-4fea-a84d-a654f96ed5b5.jpg",
            "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/5b74e195-ebac-4fea-a84d-a654f96ed5b5.jpg",
            "duration": "5",
            "order": "0",
            "stickers": []
        }
    ]
}
```

Update Story
------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
PUT /v1/stories/<story-uuid> HTTP/1.1
```

### Request Body
```json
{
    "caption": {
        "en": "2025 (English)",
        "ar": "2025 (Arabic)"
    },
    "isHighlighted": false
}
```

### Response Body
```json
{
    "uuid": "6ff3643d-02fd-4757-abde-93d99daa57ee",
    "captionEn": "2025 (English)",
    "captionAr": "2025 (Arabic)",
    "isHighlighted": false,
    "viewsCount": "0",
    "frames": [
        {
            "uuid": "d0bd2ed9-81b2-44fe-84dc-9c52a794a2a3",
            "mediaType": "image",
            "mediaUrl": "https://camion.s3.us-east-1.amazonaws.com/5b74e195-ebac-4fea-a84d-a654f96ed5b5.jpg",
            "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/5b74e195-ebac-4fea-a84d-a654f96ed5b5.jpg",
            "duration": "5",
            "order": "0",
            "stickers": []
        }
    ]
}
```

Delete Story
------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
DELETE /v1/stories/<story-uuid> HTTP/1.1
```

Frames API
==========

Create Story Frame
------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

You must create a frame by uploading an image or video to the following api route.

```HTTP
POST /v1/stories/<story-uuid>/frames HTTP/1.1
```

### Example
```bash
curl --location --request POST 'http://localhost:8000/v1/stories/6ff3643d-02fd-4757-abde-93d99daa57ee/frames' \
--header 'Authorization: Bearer <YOUR_ACCESS_TOKEN>' \
--form 'file=@"/C:/m_Direct_Media____YWCMXRBDU8.jpg"'
```

### Response Body
```json
{
    "uuid": "3820665b-57c2-4446-9b25-dfc15257399a",
    "story": {
        "uuid": "6ff3643d-02fd-4757-abde-93d99daa57ee",
        "captionEn": "2025 (English)",
        "captionAr": "2025 (Arabic)",
        "isHighlighted": false,
        "viewsCount": "0"
    },
    "mediaType": "image",
    "mediaUrl": "https://camion.s3.us-east-1.amazonaws.com/c87816c4-2abb-4224-9ff3-3793d615001d.jpg",
    "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/c87816c4-2abb-4224-9ff3-3793d615001d.jpg",
    "duration": "5",
    "order": "0",
    "stickers": []
}
```

Retrieve Story Frames
---------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```HTTP
GET /v1/stories/<story-uuid>/frames HTTP/1.1
```

### Query Parameters
Name | Description | Default
-----|-------------|--------
filters | A JSON string containing your search term, or any advanced search parameters. | `{}`
sort | The order in which we need to sort results |
pageNumber | The current page number | 1
itemsPerPage | The number of results to retrieve in the response | 100

### Response Body
```json
[
    {
        "uuid": "d0bd2ed9-81b2-44fe-84dc-9c52a794a2a3",
        "mediaType": "image",
        "mediaUrl": "https://camion.s3.us-east-1.amazonaws.com/5b74e195-ebac-4fea-a84d-a654f96ed5b5.jpg",
        "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/5b74e195-ebac-4fea-a84d-a654f96ed5b5.jpg",
        "duration": "5",
        "order": "0",
        "stickers": []
    },
    {
        "uuid": "3820665b-57c2-4446-9b25-dfc15257399a",
        "mediaType": "image",
        "mediaUrl": "https://camion.s3.us-east-1.amazonaws.com/c87816c4-2abb-4224-9ff3-3793d615001d.jpg",
        "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/c87816c4-2abb-4224-9ff3-3793d615001d.jpg",
        "duration": "5",
        "order": "0",
        "stickers": []
    }
]
```

Retrieve Story Frame
--------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```HTTP
GET /v1/stories/<story-uuid>/frames/<frame-uuid> HTTP/1.1
```

```json
{
    "uuid": "3820665b-57c2-4446-9b25-dfc15257399a",
    "mediaType": "image",
    "mediaUrl": "https://camion.s3.us-east-1.amazonaws.com/c87816c4-2abb-4224-9ff3-3793d615001d.jpg",
    "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/c87816c4-2abb-4224-9ff3-3793d615001d.jpg",
    "duration": "5",
    "order": "0",
    "stickers": []
}
```

Update Story Frame
------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```HTTP
PUT /v1/stories/<story-uuid>/frames/<frame-uuid> HTTP/1.1
```

### Request Body
```json
{
    "duration": 10,
    "order": 1
}
```

### Response Body
```json
{
    "uuid": "3820665b-57c2-4446-9b25-dfc15257399a",
    "mediaType": "image",
    "mediaUrl": "https://camion.s3.us-east-1.amazonaws.com/c87816c4-2abb-4224-9ff3-3793d615001d.jpg",
    "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/c87816c4-2abb-4224-9ff3-3793d615001d.jpg",
    "duration": 10,
    "order": 1,
    "stickers": []
}
```

Delete Story Frame
------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
DELETE /v1/stories/<story-uuid>/frames/<frame-uuid> HTTP/1.1
```
