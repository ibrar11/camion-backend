Camion SendGrid Email Integration
==================================

Overview
--------

Camion uses SendGrid to deliver transactional emails via dynamic templates. All variable substitution is handled server-side by SendGrid using Handlebars syntax — there are no local template files. The integration is toggled via an environment variable so it can be disabled during local development, where send attempts are logged to the console instead.

Environment Variables
---------------------

Add the following to your `.env` file (see `.env.example` for a template):

| Variable | Description |
|---|---|
| `EMAIL_ENABLED` | Set to `true` to enable email delivery. Any other value disables it. |
| `EMAIL_FROM` | Sender address shown to recipients. Must be a verified sender in SendGrid. |
| `SENDGRID_API_KEY` | Your SendGrid API key (starts with `SG.`). |
| `SENDGRID_TEMPLATE_OTP` | Dynamic template ID for OTP / verification emails. |
| `SENDGRID_TEMPLATE_ORDER_CONFIRMED` | Dynamic template ID for order confirmed emails. |
| `SENDGRID_TEMPLATE_ORDER_SHIPPED` | Dynamic template ID for order shipped emails. |
| `SENDGRID_TEMPLATE_ORDER_PROCESSING` | Dynamic template ID for order processing emails. |
| `SENDGRID_TEMPLATE_ORDER_DELIVERED` | Dynamic template ID for order delivered emails. |
| `SENDGRID_TEMPLATE_ORDER_CANCELLED` | Dynamic template ID for order cancelled emails. |

### Local / Development

```env
EMAIL_ENABLED=false
```

With email disabled the service logs the recipient address and template ID to the console at `DEBUG` level. No requests are made to SendGrid.

### Production

```env
EMAIL_ENABLED=true
EMAIL_FROM=no-reply@yourdomain.com
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_OTP=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_ORDER_CONFIRMED=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_ORDER_SHIPPED=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_ORDER_PROCESSING=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_ORDER_DELIVERED=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_ORDER_CANCELLED=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

How it Works
------------

1. A service (e.g. auth, orders) calls the relevant typed method on `EmailService`.
2. `EmailService` looks up the configured SendGrid template ID for that email type.
3. If `EMAIL_ENABLED=true`, a request is made to the SendGrid API with the template ID and the dynamic data payload.
4. SendGrid substitutes `{{variable}}` placeholders in the template with the provided values and delivers the email.

If a template ID env var is empty or missing at runtime, the service logs a warning and skips silently rather than throwing.

Service Reference
-----------------

**File:** `src/email/email.service.ts`

Each method accepts a strictly typed data object matching the `{{variable}}` placeholders defined in the corresponding SendGrid template.

```ts
sendOtpEmail(to: string, data: { otp: string }): Promise<void>

sendOrderConfirmedEmail(to: string, data: { customerName: string; orderId: string; orderTotal: string }): Promise<void>

sendOrderShippedEmail(to: string, data: { customerName: string; orderId: string; trackingNumber?: string }): Promise<void>

sendOrderProcessingEmail(to: string, data: { customerName: string; orderId: string }): Promise<void>

sendOrderDeliveredEmail(to: string, data: { customerName: string; orderId: string }): Promise<void>

sendOrderCancelledEmail(to: string, data: { customerName: string; orderId: string; reason?: string }): Promise<void>
```

**Usage example:**

```ts
// Sending an OTP email from the auth service
await this.emailService.sendOtpEmail(user.email, {
    otp: generatedOtp,
    expiresInMinutes: 10,
});

// Sending an order confirmation from the orders service
await this.emailService.sendOrderConfirmedEmail(customer.email, {
    customerName: customer.name,
    orderId: order.id,
    orderTotal: order.totalFormatted,
});
```

Creating and Configuring Templates in SendGrid
----------------------------------------------

1. Log in to [app.sendgrid.com](https://app.sendgrid.com).
2. Go to **Email API → Dynamic Templates → Create a Dynamic Template**.
3. Name the template (e.g. `Camion — OTP`) and click **Add Version**.
4. Choose the **Design Editor** or **Code Editor** and build your email.
5. Use `{{variableName}}` (Handlebars syntax) for any value you want substituted at send time. Variable names must match exactly the fields in the corresponding interface above.
6. Save and note the **Template ID** (starts with `d-`).
7. Paste the template ID into the corresponding env var in your `.env`.

### Template variables reference

| Template env var | Available variables |
|---|---|
| `SENDGRID_TEMPLATE_OTP` | `{{otp}}` |
| `SENDGRID_TEMPLATE_ORDER_CONFIRMED` | `{{customerName}}`, `{{orderId}}`, `{{orderTotal}}` |
| `SENDGRID_TEMPLATE_ORDER_SHIPPED` | `{{customerName}}`, `{{orderId}}`, `{{trackingNumber}}` |
| `SENDGRID_TEMPLATE_ORDER_PROCESSING` | `{{customerName}}`, `{{orderId}}` |
| `SENDGRID_TEMPLATE_ORDER_DELIVERED` | `{{customerName}}`, `{{orderId}}` |
| `SENDGRID_TEMPLATE_ORDER_CANCELLED` | `{{customerName}}`, `{{orderId}}`, `{{reason}}` |

Getting a SendGrid API Key
--------------------------

1. Sign up or log in at [app.sendgrid.com](https://app.sendgrid.com).
2. Go to **Settings → API Keys → Create API Key**.
3. Grant **Restricted Access** with **Mail Send** set to **Full Access**.
4. Copy the key immediately — it is only shown once.
5. Paste it into `SENDGRID_API_KEY` in your `.env`.

Sender Verification
-------------------

The address set in `EMAIL_FROM` must be verified in SendGrid before emails can be sent, otherwise the API will reject the request.

- **Single Sender Verification** (simple, suitable for development/staging): Go to **Settings → Sender Authentication → Verify a Single Sender** and follow the steps.
- **Domain Authentication** (recommended for production): Go to **Settings → Sender Authentication → Authenticate Your Domain** and add the DNS records provided by SendGrid to your domain registrar.
