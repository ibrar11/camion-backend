Using RS256 (RSA with SHA-256) with a private/public key pair is more secure than using the default HS256 (symmetric secret) for some use cases. It uses a private key to sign and a public key to verify.

- Public key can be widely shared (e.g., multiple microservices), private key stays secret.
- More secure for distributed systems.
- Slightly slower than HS256, requires managing key files.

## Generate a Private Key

Run this in your terminal

```bash
openssl genrsa -out private.pem 2048
```

## Generate the Public Key

Run this in your terminal

```bash
openssl rsa -in private.pem -pubout -out public.pem
```

## Verify the Keys

Check your private key

```bash
openssl rsa -in private.pem -check
```

Check your public key

```bash
openssl rsa -pubin -in public.pem -text -noout
```
