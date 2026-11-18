#!/bin/sh
# Runs on Liara before `npm run start`, with the app's environment variables.
set -e
npx prisma migrate deploy
# Idempotent: creates or re-activates the admin from SEED_ADMIN_PHONE.
npm run db:seed
