#!/usr/bin/env sh

echo "Fetching prices..."
deno run --allow-read --allow-write --allow-net scrape.ts

echo "Updating readme..."
deno run --allow-read --allow-write update_readme.ts

echo "Done."
