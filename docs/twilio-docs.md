Camion Twilio Verify Integration
=================================

Overview
--------

Camion uses **Twilio Verify** with a Branded Sender ID to deliver OTP codes to customers when they log in using their phone number. Twilio generates and manages the OTP — the app only triggers a send and delegates verification to Twilio's API.

The integration is toggled via an environment variable so it can be disabled during local development — the OTP check falls back to `MAGIC_OTP` instead.

Environment Variables
---------------------

Add the following to your `.env` file (see `.env.example` for a template):

| Variable | Description |
|---|---|
| `TWILIO_SMS_ENABLED` | Set to `true` to enable Twilio Verify. Any other value disables it. |
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID (starts with `AC`). |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token. |
| `TWILIO_VERIFY_SERVICE_SID` | The SID of your Twilio Verify Service (starts with `VA`). |

### Local / Development

```env
TWILIO_SMS_ENABLED=false
ENABLE_MAGIC_OTP=Yes
MAGIC_OTP=123456
```

With SMS disabled the service skips the Twilio API call. Combined with `ENABLE_MAGIC_OTP=Yes`, every login attempt always accepts the same OTP (`123456`), making it easy to test without a real phone.

### Production

```env
TWILIO_SMS_ENABLED=true
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=VAd95fef5e213fafefff5c2f77bf8ddc39
```

How it Works
------------

1. The customer calls `POST /v1/auth/customer/login/phone-number` with their phone number.
2. The server creates a `LoginRequest` record to track the session.
3. `TwilioService.sendVerification()` is called — Twilio sends an OTP under your Branded Sender ID.
   - If `TWILIO_SMS_ENABLED=true` — the OTP is delivered via Twilio Verify.
   - If `TWILIO_SMS_ENABLED=false` — the call is skipped (OTP is not sent).
4. The customer submits the OTP via `POST /v1/auth/customer/verify/phone-number`.
5. `TwilioService.checkVerification()` validates the code with Twilio.
   - If `TWILIO_SMS_ENABLED=false` and `ENABLE_MAGIC_OTP=Yes` — the code is compared against `MAGIC_OTP` locally.

Service Reference
-----------------

**File:** `src/common/twilio.service.ts`

```ts
sendVerification(to: string): Promise<void>
```
Triggers a Twilio Verify OTP send to `to`. No-ops when `TWILIO_SMS_ENABLED` is not `"true"`.

```ts
checkVerification(to: string, code: string): Promise<boolean>
```
Validates `code` against the active Twilio Verify session for `to`. Returns `true` if approved. In dev mode falls back to `MAGIC_OTP` comparison.

Getting Twilio Credentials
--------------------------

1. Sign up or log in at [twilio.com/console](https://www.twilio.com/console).
2. Copy your **Account SID** and **Auth Token** from the dashboard.
3. Go to **Verify → Services** and create a new service with your brand name (e.g. "Camion").
4. Copy the **Service SID** (starts with `VA`) and set it as `TWILIO_VERIFY_SERVICE_SID`.
5. Enable **Branded Caller ID** in the Verify service settings.
6. Paste all values into your `.env` file and set `TWILIO_SMS_ENABLED=true`.
