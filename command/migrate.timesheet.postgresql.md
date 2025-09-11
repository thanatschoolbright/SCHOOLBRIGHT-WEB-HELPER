# Prisma Cheatsheet for Localhost Development

## Migrate Database (Apply migrations and update database)

```bash
npx prisma migrate dev --schema=prisma/timesheet/schema.prisma --name <migration_name>
```

Replace `<migration_name>` with a descriptive name for your migration.

---

## Pull Database (Introspect existing database schema)

```bash
npx prisma db pull --schema=prisma/timesheet/schema.prisma
```

This updates your Prisma schema to match the current state of the database.

---

## Push Database (Push Prisma schema changes to the database without migrations)

```bash
npx prisma db push --schema=prisma/timesheet/schema.prisma
```

Use this to sync your database schema with your Prisma schema without creating migration files.

---

## Generate Prisma Client

```bash
npx prisma generate --schema=prisma/timesheet/schema.prisma
```

Generates the Prisma Client based on your schema, so you can use it in your application.

## Generate Prisma Studio

npx prisma studio --schema=prisma/timesheet/schema.prisma

brew services restart postgresql