#!/bin/bash
# Start Flux server with Supabase configuration

# Load environment variables from .flux/.env.local
if [ -f "../../.flux/.env.local" ]; then
  export $(cat ../../.flux/.env.local | xargs)
fi

# Start server
PORT=3001 bun run start
