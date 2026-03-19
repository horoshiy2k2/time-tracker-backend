# Migration recovery: `20260319110000_add_coin_boost_items_and_effects`

If you previously ran `npm start` and got `P3009` for this migration, your DB contains a failed migration record.

## Why this happens
Prisma blocks all new migrations while a failed migration exists in `_prisma_migrations`.

## One-time recovery (safe for local/dev)
Run these commands in this order:

```bash
npm run db:resolve:boost-migration-failed
npm run db:migrate
```

After that, start the app normally:

```bash
npm start
```

## If you still see an error
1. Ensure you are using the same `DATABASE_URL` where the failure occurred.
2. Check migration status:

```bash
npx prisma migrate status
```

3. Re-run:

```bash
npm run db:resolve:boost-migration-failed
npm run db:migrate
```
