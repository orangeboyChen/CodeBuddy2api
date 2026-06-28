#!/bin/sh
set -e

# This script runs as root to prepare the environment before handing off to the application user.

# The main user for the application, should match the one in the Dockerfile.
APP_USER="appuser"

# Ensure local writable directories are owned by the application user.
# Skip chown on CIFS/SMB mounts; ownership is enforced by the Samba server and
# changing it from the client can conflict with "force user" on the share.
prepare_writable_dir() {
    dir="$1"
    mkdir -p "$dir"

    fs_type="$(stat -f -c %T "$dir" 2>/dev/null || echo unknown)"
    case "$fs_type" in
        cifs|smb2|smb3)
            echo "Skipping ownership change for network filesystem ${fs_type}: ${dir}"
            ;;
        *)
            echo "Ensuring ownership for ${dir}..."
            chown -R ${APP_USER}:${APP_USER} "$dir"
            ;;
    esac
}

prepare_writable_dir /app/config
prepare_writable_dir /app/.codebuddy_creds

# Hand over control to the 'appuser' and execute the CMD from the Dockerfile.
# 'gosu' is a lightweight tool that does this without the weirdness of 'su' or 'sudo'.
# 'exec' is important because it replaces this script process with the main application,
# ensuring that signals (like CTRL+C) are correctly received by the application.
echo "Executing command as user ${APP_USER}: $@"
exec gosu ${APP_USER} "$@"
