# Command Prompt For Prisma

## Migrate Database

npx prisma migrate dev --schema=prisma/timesheet/schema.prisma --name init_timesheet

## Pull Database

npx prisma db pull --schema=prisma/schema.prisma

## Push Database from Model

npx prisma migrate dev --schema=prisma/timesheet/schema.prisma --name init_timesheet
