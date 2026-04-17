
### Generate a Migration

When you change an entity or want to add a new table/column, run:

```bash
npm run migration:generate src/migrations/YOUR_MIGRATION_NAME
```

### Run Migrations

To apply migrations to your database:

```bash
npm run migration:run
```

### Revert Last Migration

To roll back the last applied migration:

```bash
npm run migration:revert
```
