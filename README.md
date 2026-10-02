# Fewchore Asset Disposal

Internal auction and asset-disposal platform for Fewchore employees.

## Application surfaces

- `/employee/dashboard` and `/employee/auctions` are the employee workspace. Every authenticated employee can use them, including staff with administrative duties.
- `/operations` is the protected operational workspace for `AUCTION_ADMIN`, `FINANCE`, `FACILITIES`, `COMPLIANCE`, and `SUPER_ADMIN` roles.

This separation means operational access never prevents an administrator from participating in eligible employee auctions.

## Local setup

1. Copy `.env.example` to `.env` and fill in the actual values.
2. Add a unique `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` to `.env`.
3. Install dependencies with `npm install`.
4. Run `npm run db:migrate -- --name initial_schema`.
5. Run `npm run db:seed` to create the super-admin, categories, and default system settings.
6. Start the application with `npm run dev`.

The first seeded account is marked as a verified `SUPER_ADMIN` and can open both workspaces.

## Production / Dokploy

Dokploy can deploy this repository directly from the included multi-stage `Dockerfile`.

- Set every variable from `.env.example` in Dokploy; do not upload `.env`.
- Run the Docker `migrator` target against the production database before each app deployment (`docker build --target migrator -t fewchore-migrator .` then run it with `DATABASE_URL` configured). This target contains Prisma and the committed migrations; the app container remains lean and non-root.
- Run `npm run db:seed` once after migration, with production super-admin credentials configured in Dokploy.
- Configure Dokploy's scheduler to `POST /api/cron` with the `x-cron-secret` header set to `CRON_SECRET`.
- Point DigitalOcean Spaces CORS at the production application origin to permit the signed browser uploads.

`GET /api/health` is available for the Dokploy health check.
