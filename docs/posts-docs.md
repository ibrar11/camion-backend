# Posts REST & GraphQL API

==========================

This document includes the documentation for the Posts (CMS Pages) management module. Posts represent CMS-managed pages such as Privacy Policy, Refund Policy, and similar static content pages.

---

## Procedure to Manage Posts

Follow the following steps to manage posts:

1. Create a post.
2. Retrieve posts.
3. Update post details when required.
4. Delete posts when no longer needed.

---

# Posts REST API

---

## Create a Post

> [!IMPORTANT]
> Requires authenticated user (SuperAdmin, Admin, or Manager)

```http
POST /v1/posts HTTP/1.1
```

---

### Request Body

```json
{
    "slug": "privacy-policy",
    "title": "Privacy Policy",
    "brief": "Short summary of the page",
    "content": "Full content of the page",
    "enabled": true
}
```

---

### Response Body

```json
{
    "uuid": "post-uuid",
    "slug": "privacy-policy",
    "title": "Privacy Policy",
    "brief": "Short summary of the page",
    "content": "Full content of the page",
    "enabled": true,
    "createdBy": {
        "uuid": "user-uuid",
        "fullName": "Admin Name"
    }
}
```

---

### Notes

* `uuid` is generated automatically
* `enabled` defaults to `true` if not provided
* `createdBy` is automatically assigned from the authenticated user

---

## Retrieve Posts

```http
GET /v1/posts HTTP/1.1
```

---

### Response Body

```json
[
    {
        "uuid": "post-uuid",
        "slug": "privacy-policy",
        "title": "Privacy Policy",
        "brief": "Short summary",
        "content": "Full content",
        "enabled": true,
        "createdBy": {
            "uuid": "user-uuid",
            "fullName": "Admin Name"
        }
    }
]
```

---

### Behavior

* Returns all posts
* Includes `createdBy` information
* Sorted by `createdAt` in descending order (latest first)

---

## Retrieve Post

```http
GET /v1/posts/<post-slug> HTTP/1.1
```

---

### Response Body

```json
{
    "uuid": "post-uuid",
    "slug": "privacy-policy",
    "title": "Privacy Policy",
    "brief": "Short summary",
    "content": "Full content",
    "enabled": true,
    "createdBy": {
        "uuid": "user-uuid",
        "fullName": "Admin Name"
    }
}
```

---

### Errors

| Error         | Description    |
| ------------- | -------------- |
| 404 Not Found | Post not found |

---

## Update Post

> [!IMPORTANT]
> Requires authenticated user (SuperAdmin, Admin, or Manager)

```http
PUT /v1/posts/<post-uuid> HTTP/1.1
```

---

### Request Body

```json
{
    "slug": "updated-slug",
    "title": "Updated Title",
    "brief": "Updated summary",
    "content": "Updated content",
    "enabled": true
}
```

---

### Response Body

```json
{
    "uuid": "post-uuid",
    "slug": "updated-slug",
    "title": "Updated Title",
    "brief": "Updated summary",
    "content": "Updated content",
    "enabled": true,
    "createdBy": {
        "uuid": "user-uuid",
        "fullName": "Admin Name"
    }
}
```

---

### Behavior

* Updates provided fields
* Existing fields remain unchanged if not provided
* Post must exist

---

## Delete Post

> [!IMPORTANT]
> Requires authenticated user (SuperAdmin or Admin)

```http
DELETE /v1/posts/<post-uuid> HTTP/1.1
```

---

### Response Body

```json
{
    "message": "Post deleted successfully"
}
```

---

### Behavior

* Deletes the post permanently
* Operation is idempotent (no error if post does not exist)

---

# Posts GraphQL API

---

## Get All Posts

```graphql
query {
    getPosts {
        uuid
        slug
        title
        brief
        content
        enabled
        images
        createdBy {
            uuid
            fullName
        }
    }
}
```

---

### Behavior

* Returns all posts
* Includes `createdBy` information
* Sorted by `createdAt` in descending order (latest first)
* Requires a valid Bearer token

---

## Get Single Post

```graphql
query {
    getPost(slug: "privacy-policy") {
        uuid
        slug
        title
        brief
        content
        enabled
        images
        createdBy {
            uuid
            fullName
        }
    }
}
```

---

### Errors

| Error         | Description    |
| ------------- | -------------- |
| 404 Not Found | Post not found |

---

# Security Notes

* Only authenticated users can:

  * create posts (SuperAdmin, Admin, Manager)
  * update posts (SuperAdmin, Admin, Manager)
  * delete posts (SuperAdmin, Admin)

* Read endpoints (REST GET and GraphQL queries) require a valid Bearer token
* `createdBy` is derived from authentication context and cannot be set by the client

---

# Summary

* Posts are CMS-managed pages (e.g. Privacy Policy, Refund Policy)
* `slug` is used as the public identifier for read endpoints; UUID is used for admin mutations (update/delete)
* Includes full CRUD via REST and read queries via GraphQL
* Tracks which admin created the page via `createdBy`
