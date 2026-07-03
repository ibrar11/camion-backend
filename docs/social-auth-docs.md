Social Authentication
=====================

Customers can sign in using third-party social providers. The flow differs depending on whether the client is a mobile app or a web browser.

---

## How it works

### Mobile flow
The native app performs authentication directly with the provider's SDK, receives a credential (ID token or access token), and sends it to the API. The API verifies the credential server-side and returns a session token.

### Web flow
The browser is redirected to the provider's login page. After the user authenticates, the provider redirects back to the API callback URL. The API sets a session cookie and redirects the browser to the frontend.

### Account linking
When a social login comes in, the API resolves the customer account in this order:

1. Look up by the provider's user ID — return that account.
2. Look up by email address — link the provider ID to the existing account and return it.
3. No match — create a new customer account and return it.

This means a customer who registered by phone/email can later sign in with a social provider that shares the same email, and the accounts are merged automatically.

### Account reactivation
If the resolved account has a **pending deletion** (grace period active), logging in via any social provider automatically cancels the deletion and fully restores the account.

If the account has been **permanently deactivated** (grace period expired), the login is rejected with `401 Unauthorized`. The account can only be restored via the admin reactivation endpoint — see [customer-deletion-docs.md](./customer-deletion-docs.md).

---

## Google

### Environment variables

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Web application OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Web application client secret |
| `GOOGLE_CALLBACK_URL` | Callback URL registered in Google Cloud Console — must match exactly |
| `GOOGLE_IOS_CLIENT_ID` | iOS OAuth client ID (for mobile ID token verification) |
| `GOOGLE_ANDROID_CLIENT_ID` | Android OAuth client ID (for mobile ID token verification) |
| `FRONTEND_REDIRECT_URL` | URL the browser is redirected to after a successful web OAuth login (e.g. `https://app.dev.camiontrading.com/en`) |

**Registered callback URLs (Google Cloud Console)**

| Environment | Callback URL |
|---|---|
| Dev | `https://app.dev.camiontrading.com/auth/google/callback` |
| Production | TBD |

---

### Mobile — verify ID token

The mobile app authenticates with Google natively and sends the resulting ID token to the API.

```http
POST /v1/auth/customer/oauth/google HTTP/1.1
Content-Type: application/json
```

**Request body**
```json
{
    "idToken": "<google-id-token-from-native-sdk>",
    "guestUUID": "<optional-guest-customer-uuid>",
    "firebaseDeviceToken": "<optional-firebase-token>"
}
```

| Field | Required | Description |
|---|---|---|
| `idToken` | Yes | ID token from the native Google SDK |
| `guestUUID` | No | Guest customer UUID — if provided, guest cart is merged into the authenticated account |
| `firebaseDeviceToken` | No | Device token for push notifications |

**Response**
```json
{
    "token": "<session-token>",
    "customer": {
        "uuid": "...",
        "fullName": "...",
        "emailAddress": "..."
    }
}
```

Use the returned `token` as a `Bearer` token on subsequent requests.

---

### Web — initiate redirect

Redirect the browser to this URL to start the OAuth flow. Pass `guestUUID` as a query parameter to carry the guest cart through the redirect cycle.

```http
GET /auth/google?guestUUID=<guest-customer-uuid> HTTP/1.1
```

The `guestUUID` is encoded into the OAuth `state` parameter and echoed back by Google in the callback, so the cart is merged after authentication completes. Omit the parameter if there is no guest cart to merge.

---

### Web — OAuth callback

Google redirects back to this endpoint after the user authenticates. The API sets a `token` cookie and redirects the browser to `FRONTEND_REDIRECT_URL`.

```http
GET /auth/google/callback HTTP/1.1
```

This endpoint is called by Google — do not call it directly.

---

## Facebook

### Environment variables

| Variable | Description |
|---|---|
| `FACEBOOK_APP_ID` | Facebook application ID |
| `FACEBOOK_APP_SECRET` | Facebook application secret |
| `FACEBOOK_CALLBACK_URL` | Callback URL registered in Facebook Developer Console — must match exactly |

**Registered callback URLs (Facebook Developer Console)**

| Environment | Callback URL |
|---|---|
| Dev | `https://app.dev.camiontrading.com/auth/facebook/callback` |
| Production | TBD |

---

### Mobile — verify token (standard login + iOS Limited Login)

The mobile app authenticates with Facebook natively and sends the resulting token to the API using the same field regardless of login type. The API auto-detects the token format.

```http
POST /v1/auth/customer/oauth/facebook HTTP/1.1
Content-Type: application/json
```

**Request body**
```json
{
    "accessToken": "<token-from-facebook-sdk>",
    "guestUUID": "<optional-guest-customer-uuid>",
    "firebaseDeviceToken": "<optional-firebase-token>"
}
```

| Field | Required | Description |
|---|---|---|
| `accessToken` | Yes | Standard access token **or** iOS Limited Login OIDC JWT — send whichever the SDK returns |
| `guestUUID` | No | Guest customer UUID — if provided, guest cart is merged into the authenticated account |
| `firebaseDeviceToken` | No | Device token for push notifications |

**How the API distinguishes the two:**

- **Standard access token** — opaque string (e.g. `EAABsbCS4ZD...`). Verified via Facebook's Graph API `debug_token` endpoint.
- **iOS Limited Login ID token** — OIDC JWT with three dot-separated segments. Verified against Facebook's JWKS endpoint (`https://limited.facebook.com/.well-known/oauth/openid/jwks/`); user claims (`sub`, `name`, `email`) are extracted directly from the token with no Graph API call.

**Response**
```json
{
    "token": "<session-token>",
    "customer": {
        "uuid": "...",
        "fullName": "...",
        "emailAddress": "..."
    }
}
```

Use the returned `token` as a `Bearer` token on subsequent requests.

---

### Web — initiate redirect

Redirect the browser to this URL to start the OAuth flow. Pass `guestUUID` as a query parameter to carry the guest cart through the redirect cycle.

```http
GET /auth/facebook?guestUUID=<guest-customer-uuid> HTTP/1.1
```

The `guestUUID` is encoded into the OAuth `state` parameter and echoed back by Facebook in the callback, so the cart is merged after authentication completes. Omit the parameter if there is no guest cart to merge.

---

### Web — OAuth callback

Facebook redirects back to this endpoint after the user authenticates. The API sets a `token` cookie and redirects the browser to `FRONTEND_REDIRECT_URL`.

```http
GET /auth/facebook/callback HTTP/1.1
```

This endpoint is called by Facebook — do not call it directly.

---

## Apple

Apple Sign In is **mobile only**. Apple does not provide a web redirect flow compatible with Passport — the iOS app handles the authentication natively and sends the resulting credential to the API.

> **Important:** Apple only includes the user's email in the token on the **first login**. Subsequent logins will not contain an email. The API handles this by looking up the customer by `appleId` first, so returning users are always found regardless.

### Environment variables

| Variable | Description |
|---|---|
| `APPLE_AUDIENCE` | iOS bundle ID (e.g. `com.camiontrading.app`) |
| `APPLE_ISSUER` | Apple token issuer — always `https://appleid.apple.com` |
| `APPLE_TEAM_ID` | Apple Developer Team ID |
| `APPLE_KEY_ID` | Key ID of the Sign in with Apple private key |
| `APPLE_PRIVATE_KEY` | PEM private key from Apple Developer Console (use `\n` for newlines in `.env`) |

---

### Mobile — verify identity token

The iOS app uses the Sign in with Apple SDK and sends either an `identityToken` or an `authorizationCode` (or both) to the API. At least one is required.

```http
POST /v1/auth/customer/oauth/apple HTTP/1.1
Content-Type: application/json
```

**Request body**
```json
{
    "identityToken": "<jwt-from-apple-sdk>",
    "authorizationCode": "<code-from-apple-sdk>",
    "fullName": "John Doe",
    "guestUUID": "<optional-guest-customer-uuid>"
}
```

| Field | Required | Description |
|---|---|---|
| `identityToken` | One of these two | JWT from Apple SDK — verified directly |
| `authorizationCode` | One of these two | Exchanged server-side for an identity token using Apple's token endpoint |
| `fullName` | No | Only sent by Apple on first login; pass it along when available |
| `guestUUID` | No | Guest customer UUID — if provided, guest cart is merged into the authenticated account |

**Response**
```json
{
    "token": "<session-token>",
    "customer": {
        "uuid": "...",
        "fullName": "...",
        "emailAddress": "..."
    }
}
```

Use the returned `token` as a `Bearer` token on subsequent requests.

---

## Adding a new provider

To add another social provider:

1. **Install the Passport strategy** for the provider and its types.
2. **Add a strategy file** at `src/auth/strategies/<provider>.strategy.ts` — implement `validate()` to return `{ email, fullName, <provider>Id }`.
3. **Add a `<provider>Id` column** to the `Customer` entity (`nullable: true, unique: true`).
4. **Add a service method** in `CustomerAuthService` for mobile verification, and a `findOrCreate<Provider>Customer` private method following the same pattern as `findOrCreateGoogleCustomer`. Call `mergeGuestCart(result.customer, guestUUID)` after the `findOrCreate` call in both mobile and web entry points.
5. **Add endpoints** to `SocialAuthController` for the web flow (`GET /auth/<provider>` + `GET /auth/<provider>/callback`) and to `CustomerAuthController` for the mobile flow (`POST /v1/auth/customer/oauth/<provider>`).
6. **Register the strategy** in `AuthModule` providers.
7. **Add env vars** to `.env` and `.env.example`.
