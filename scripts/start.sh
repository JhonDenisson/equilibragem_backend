#!/bin/sh

echo "🚀 Starting Equilibragem Backend..."

# Run database migrations
echo "📦 Running database migrations..."
bun run db:migrate

# Start the application
echo "🦊 Starting Elysia server..."
bun run src/index.ts