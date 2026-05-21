#!/bin/bash
export DATABASE_URL="postgresql://postgres.vdbrdgheycebtgxavpst:sayankarmakar159%40gmail.com@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
export DIRECT_URL="postgresql://postgres.vdbrdgheycebtgxavpst:sayankarmakar159%40gmail.com@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
export NODE_OPTIONS="--max-old-space-size=8192"
# Use current directory instead of hardcoded path
exec npx next dev -p 3000