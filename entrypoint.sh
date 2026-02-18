#!/bin/sh
set -e

cd /app/mytube

# --- 1. npm ci (skip if package-lock.json unchanged) ---
LOCK_HASH=$(md5sum package-lock.json | cut -d' ' -f1)
OLD_HASH=""
[ -f .deps-hash ] && OLD_HASH=$(cat .deps-hash)

if [ "$LOCK_HASH" != "$OLD_HASH" ]; then
    echo "📦 package-lock.json changed → npm ci..."
    npm ci
    echo "$LOCK_HASH" > .deps-hash
else
    echo "✅ deps unchanged → skip npm ci"
fi

# --- 2. next build (skip if commit unchanged) ---
CURRENT_COMMIT=""
[ -f .current-commit ] && CURRENT_COMMIT=$(cat .current-commit)
OLD_BUILD=""
[ -f .build-hash ] && OLD_BUILD=$(cat .build-hash)

if [ "$CURRENT_COMMIT" != "$OLD_BUILD" ] || [ ! -d .next/standalone ]; then
    echo "🔨 source changed → npm run build..."
    npm run build
    [ -n "$CURRENT_COMMIT" ] && echo "$CURRENT_COMMIT" > .build-hash
else
    echo "✅ build unchanged → skip build"
fi

# --- 3. static/public symlinks for standalone ---
if [ -d .next/standalone ]; then
    ln -sfn /app/mytube/.next/static .next/standalone/.next/static
    ln -sfn /app/mytube/public .next/standalone/public
fi

# --- 4. start server ---
echo "🚀 starting server on port ${PORT:-3434}..."
exec node .next/standalone/server.js
