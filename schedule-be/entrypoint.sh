#!/bin/sh
set -e

echo "⏳  Running database migrations..."
node -e "
const { AppDataSource } = require('./dist/database/data-source');
AppDataSource.initialize()
  .then(() => AppDataSource.runMigrations())
  .then(() => {
    console.log('✅  Migrations completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌  Migration failed:', err);
    process.exit(1);
  });
"

# Only seed when explicitly requested (first deploy / reset).
# Set RUN_SEED=true in the environment to trigger this.
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱  Running database seeders..."
  node dist/database/seeds/seed.js
  echo "✅  Seeding completed"
fi

echo "🚀  Starting application..."
exec node dist/main
