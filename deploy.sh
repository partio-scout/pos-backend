#!/bin/bash

# ----------------------
# KUDU Deployment Script
# Version: 1.0.17
# ----------------------

# Helpers
# -------

exitWithMessageOnError () {
  if [ ! $? -eq 0 ]; then
    echo "An error has occurred during web site deployment."
    echo $1
    exit 1
  fi
}

# Prerequisites
# -------------

# Verify node.js installed
hash node 2>/dev/null
exitWithMessageOnError "Missing node.js executable, please install node.js, if already installed make sure it can be reached from current environment."

# Setup
# -----

SCRIPT_DIR="${BASH_SOURCE[0]%\\*}"
SCRIPT_DIR="${SCRIPT_DIR%/*}"
ARTIFACTS=$SCRIPT_DIR/../artifacts
KUDU_SYNC_CMD=${KUDU_SYNC_CMD//\"}

if [[ ! -n "$DEPLOYMENT_SOURCE" ]]; then
  DEPLOYMENT_SOURCE=$SCRIPT_DIR
fi

if [[ ! -n "$NEXT_MANIFEST_PATH" ]]; then
  NEXT_MANIFEST_PATH=$ARTIFACTS/manifest

  if [[ ! -n "$PREVIOUS_MANIFEST_PATH" ]]; then
    PREVIOUS_MANIFEST_PATH=$NEXT_MANIFEST_PATH
  fi
fi

if [[ ! -n "$DEPLOYMENT_TARGET" ]]; then
  DEPLOYMENT_TARGET=$ARTIFACTS/wwwroot
else
  KUDU_SERVICE=true
fi

# Node Helpers
# ------------

selectNodeVersion () {
  # This is ugly, and will break installs for any other node version:
  echo "Adding the path to node bin directory to beginning of PATH"
  PATH=/usr/local/bin/node/:$PATH
}

##################################################################################################################################
# Deployment
# ----------

echo Handling node.js deployment.

# 1. RSync files
if [[ "$IN_PLACE_DEPLOYMENT" -ne "1" ]]; then
  echo "Syncing files with rsync..."

  rsync -av --delete \
    --exclude=".git" \
    --exclude=".hg" \
    --exclude=".deployment" \
    --exclude="deploy.sh" \
    "$DEPLOYMENT_SOURCE"/ "$DEPLOYMENT_TARGET"/
fi

# 2. Select node version
selectNodeVersion

# 3. Install npm packages
if [ -e "$DEPLOYMENT_TARGET/package.json" ]; then
  cd "$DEPLOYMENT_TARGET"
  echo "Running yarn install"
  yarn install
  exitWithMessageOnError "yarn failed"
  cd - > /dev/null
fi

##################################################################################################################################
echo "Finished successfully."
