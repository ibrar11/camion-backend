# Posts REST API

==========================

This document includes the documentation for Posts management module.

---

## Procedure to Manage Posts

Follow the following steps to manage posts:

1. Create a post.
2. Retrieve posts.
3. Update post details when required.
4. Delete posts when no longer needed.

---

# Posts API

Posts represent content created by users.

---

## Create a Post

> [!IMPORTANT]
> Requires authenticated user

```http
POST /v1/posts HTTP/1.1
```

---

### Request Body

```json
{
    "slug": "my-first-post",
    "title": "My First Post",
    "brief": "Short summary of the post",
    "content": "Full content of the post",
    "enabled": true
}
```

---

### Response Body

```json
{
    "uuid": "post-uuid",
    "slug": "my-first-post",
    "title": "My First Post",
    "brief": "Short summary of the post",
    "content": "Full content of the post",
    "enabled": true,
    "author": {
        "uuid": "user-uuid",
        "name": "Author Name"
    }
}
```

---

### Notes

* `uuid` is generated automatically
* `enabled` defaults to `true` if not provided
* Author is automatically assigned from authenticated user

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
        "slug": "my-first-post",
        "title": "My First Post",
        "brief": "Short summary",
        "content": "Full content",
        "enabled": true,
        "author": {
            "uuid": "user-uuid",
            "name": "Author Name"
        }
    }
]
```

---

### Behavior

* Returns all posts
* Includes author information
* Sorted by `createdAt` in descending order (latest first)

---

## Retrieve Post

```http
GET /v1/posts/<post-uuid> HTTP/1.1
```

---

### Response Body

```json
{
    "uuid": "post-uuid",
    "slug": "my-first-post",
    "title": "My First Post",
    "brief": "Short summary",
    "content": "Full content",
    "enabled": true,
    "author": {
        "uuid": "user-uuid",
        "name": "Author Name"
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
> Requires authenticated user

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
    "author": {
        "uuid": "user-uuid",
        "name": "Author Name"
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
> Requires authenticated user

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

# Security Notes

* Only authenticated users can:

  * create posts
  * update posts
  * delete posts

* Author is derived from authentication context

---

# Summary

* Posts are created and managed by authenticated users
* UUID is used as public identifier
* Includes full CRUD functionality
* Supports author relationship and ordering
