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
| `FRONTEND_REDIRECT_URL` | URL the browser is redirected to after a successful web OAuth login |

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
    "idToken": "<google-id-token-from-native-sdk>"
}
```

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

Redirect the browser to this URL to start the OAuth flow.

```http
GET /auth/google HTTP/1.1
```

The browser is redirected to Google's consent screen. No request body required.

---

### Web — OAuth callback

Google redirects back to this endpoint after the user authenticates. The API sets a `token` cookie and redirects the browser to `FRONTEND_REDIRECT_URL`.

```http
GET /auth/google/callback HTTP/1.1
```

This endpoint is called by Google — do not call it directly.

---

## Adding a new provider

To add another social provider:

1. **Install the Passport strategy** for the provider and its types.
2. **Add a strategy file** at `src/auth/strategies/<provider>.strategy.ts` — implement `validate()` to return `{ email, fullName, <provider>Id }`.
3. **Add a `<provider>Id` column** to the `Customer` entity (`nullable: true, unique: true`).
4. **Add a service method** in `CustomerAuthService` for mobile verification, and a `findOrCreate<Provider>Customer` private method following the same pattern as `findOrCreateGoogleCustomer`.
5. **Add endpoints** to `SocialAuthController` for the web flow (`GET /auth/<provider>` + `GET /auth/<provider>/callback`) and to `CustomerAuthController` for the mobile flow (`POST /v1/auth/customer/oauth/<provider>`).
6. **Register the strategy** in `AuthModule` providers.
7. **Add env vars** to `.env` and `.env.example`.
