#!/bin/bash
set -x  # Print commands
exec 2>&1  # Redirect stderr to stdout

echo "Starting server..."
node server.js
