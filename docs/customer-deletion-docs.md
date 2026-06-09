# Customer Deletion API

==========================

This document includes the documentation for customer account deletion workflow.

---

## Procedure for Account Deletion

Follow the following steps to delete a customer account:

1. Customer requests account deletion.
2. Account is marked for deletion (`markedForDeletionAt` set, `isActive` remains `true`).
3. During the grace period, the customer can cancel deletion by logging in or calling the cancel endpoint.
4. After the configured grace period, a scheduled job sets `deletedAt` and `isActive = false`.
5. Once permanently deactivated, only an admin can restore the account.

---

# Customer Deletion API

Customer deletion follows a **soft-delete with delay** approach to ensure safety and reversibility.

---

## Request Account Deletion

> [!IMPORTANT]
> Requires a valid customer Bearer token. The customer is identified from the token — no UUID is needed in the URL.

```http
DELETE /v1/customers/me HTTP/1.1
Authorization: Bearer <customer-token>
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
* `isActive` remains `true` — account is still accessible during the grace period
* Account is **not deleted immediately**
* Operation is **idempotent**

---

## Cancel Account Deletion

> [!IMPORTANT]
> Requires a valid customer Bearer token. The customer is identified from the token — no UUID is needed in the URL.

```http
PATCH /v1/customers/me/cancel-deletion HTTP/1.1
Authorization: Bearer <customer-token>
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
* Fully restores account to normal active state (if not yet permanently deleted)

---

### Errors

| Error            | Description             |
| ---------------- | ----------------------- |
| 404 Not Found    | Customer does not exist |
| 400 Bad Request  | Account already deleted |
| 401 Unauthorized | Unauthorized access     |

---

## Reactivation via Login (Grace Period)

If a customer logs in during the grace period (`markedForDeletionAt` set, `deletedAt` null), the pending deletion is **automatically cancelled** — no separate cancel call is needed.

This applies to all login methods:

* **Phone / Email (OTP)** — deletion is cancelled on successful OTP verification
* **Google / Facebook / Apple** — deletion is cancelled immediately on successful social auth

---

# Scheduled Deletion

A background job runs daily at midnight to finalize account deletion.

---

## Deletion Criteria

A customer account will be permanently deactivated if:

* `markedForDeletionAt` is set
* `deletedAt` is null
* Grace period has passed

---

## Deletion Action

When the scheduled job runs:

* Sets `deletedAt` to current timestamp
* Sets `isActive` to `false`

Once this runs, the account can only be restored by an admin.

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

# Admin Reactivation

After the grace period has expired (`deletedAt` set, `isActive = false`), only an admin can restore the account.

> [!IMPORTANT]
> Requires a valid admin Bearer token (`SuperAdmin` or `Admin` role).

```http
POST /v1/customers/reactivate HTTP/1.1
Authorization: Bearer <admin-token>
Content-Type: application/json

{
    "emailAddress": "customer@example.com"
}
```

---

### Response Body

Returns the restored `Customer` object.

---

### Behavior

* Looks up the customer by email address (case-insensitive)
* Clears `deletedAt` and `markedForDeletionAt`
* Sets `isActive` to `true`

---

### Errors

| Error            | Description                                    |
| ---------------- | ---------------------------------------------- |
| 404 Not Found    | No customer found with the provided email      |
| 401 Unauthorized | Unauthorized access                            |

---

# Security Notes

**Accounts in grace period** (`markedForDeletionAt` set, `isActive = true`):
* Can still authenticate normally
* Logging in automatically cancels the pending deletion

**Permanently deactivated accounts** (`deletedAt` set, `isActive = false`):
* Cannot authenticate — all login attempts are rejected
* Cannot access any API
* Can only be restored via the admin reactivation endpoint
