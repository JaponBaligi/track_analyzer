# Security

## Reporting

If you believe you found a security vulnerability, please **do not** open a public GitHub issue. Contact the repository maintainers privately with reproduction steps and impact.

## Recommendations for deployers

- Keep `backend/config/.env` and `isrc-company/config/.env` out of version control; use the `*.example` files as templates.
- Use strong `JWT_SECRET` and unique `USER*_PASSWORD` values (48 characters for panel login).
- For internet-facing deployments, set `ENVIRONMENT=prod` and a non-wildcard `ALLOWED_ORIGINS`.
- Rotate Spotify and third-party API credentials if they were ever committed or leaked.

## Scope

This project interacts with Spotify’s documented Web API and may include optional tooling that calls other Spotify endpoints. Operators are responsible for complying with Spotify’s terms of service and applicable law.
