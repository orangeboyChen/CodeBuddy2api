#!/bin/sh
set -e

# This script runs as root to prepare the environment before handing off to the application user.

# The main user for the application, should match the one in the Dockerfile.
APP_USER="appuser"

# Ensure the mounted directories are owned by the application user.
# This is crucial because Docker may auto-create the host directory as 'root',
# which would prevent the non-root application user from writing files into it.
# We apply this to all potential volume mount points.
echo "Ensuring ownership of mounted directories..."
chown -R ${APP_USER}:${APP_USER} /app/config
chown -R ${APP_USER}:${APP_USER} /app/.codebuddy_creds
echo "Ownership fixed."

# Hand over control to the 'appuser' and execute the CMD from the Dockerfile.
# 'gosu' is a lightweight tool that does this without the weirdness of 'su' or 'sudo'.
# 'exec' is important because it replaces this script process with the main application,
# ensuring that signals (like CTRL+C) are correctly received by the application.
echo "Executing command as user ${APP_USER}: $@"
exec gosu ${APP_USER} "$@"