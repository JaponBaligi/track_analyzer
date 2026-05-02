# Contributing

## Basics

- Open issues for bugs or focused feature ideas when it helps discussion.
- Pull requests are welcome; keep changes scoped and described clearly.
- Do not commit secrets. Use `backend/config/.env.example`, `web_panel/.env.example`, and `isrc-company/config/.env.example` as templates only.

## Local checks

- Backend: follow [README.md](README.md) — install `requirements.txt`, configure `.env`, run `uvicorn` from `backend/`.
- Frontend: `cd web_panel && npm install && npm run build` (catches TypeScript/build errors).
- Optional `isrc-company/` tooling is documented in [isrc-company/README.md](isrc-company/README.md).

## Security

Report vulnerabilities privately per [SECURITY.md](SECURITY.md).
