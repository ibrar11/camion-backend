# Customer Deletion API

==========================

This document includes the documentation for customer account deletion workflow.

---

## Procedure for Account Deletion

Follow the following steps to delete a customer account:

1. Customer requests account deletion.
2. Account is marked for deletion (not deleted immediately).
3. Customer retains limited access to cancel deletion.
4. After a configured number of days, a scheduled job deactivates the account.

---

# Customer Deletion API

Customer deletion follows a **soft-delete with delay** approach to ensure safety and reversibility.

---

## Request Account Deletion

> [!IMPORTANT]
> Requires authenticated customer

```http
DELETE /v1/customers/me HTTP/1.1
```

---

### Response Body

```json
{
    "message": "Account marked for deletion"
}
```

---

### Behavior

* Sets `markedForDeletionAt` to current timestamp
* Account is **not deleted immediately**
* Operation is **idempotent**
* Customer can still authenticate to allow cancellation of deletion request

---

## Cancel Account Deletion

> [!IMPORTANT]
> Requires authenticated customer

```http
PATCH /v1/customers/me/cancel-deletion HTTP/1.1
```

---

### Response Body

```json
{
    "message": "Account deletion cancelled"
}
```

---

### Behavior

* Clears `markedForDeletionAt`
* Fully restores account access (if not deleted)

---

### Errors

| Error            | Description             |
| ---------------- | ----------------------- |
| 404 Not Found    | Customer does not exist |
| 400 Bad Request  | Account already deleted |
| 401 Unauthorized | Unauthorized access     |

---

# Scheduled Deletion

A background job runs periodically to finalize account deletion.

---

## Deletion Criteria

A customer account will be deleted if:

* `markedForDeletionAt` is set
* `deletedAt` is null
* Grace period has passed

---

## Deletion Action

When the scheduled job runs:

* Sets `deletedAt` to current timestamp
* Sets `isActive` to `false`

---

## Configuration

```env
ACCOUNT_DELETION_GRACE_DAYS=14
```

---

### Notes

* Default grace period is 14 days
* Value is configurable via environment variable

---

# Security Notes

* Accounts marked for deletion:

  * Can still authenticate for cancel deletion

* Deleted accounts:

  * Cannot authenticate
  * Cannot access any API


