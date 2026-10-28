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

# Setup
# -----

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exitWithMessageOnError "Could not resolve deployment script directory"
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

nodeVersionMatches () {
  local actual_version
  actual_version="$("$1" --version 2>/dev/null)" || return 1
  [[ "$actual_version" == "v$2" ]]
}

selectNodeVersion () {
  local version_file="$SCRIPT_DIR/.nvmrc"
  if [[ ! -r "$version_file" ]]; then
    echo "Missing Node version file: $version_file" >&2
    exit 1
  fi

  local version
  version="$(tr -d '[:space:]' < "$version_file")"
  version="${version#v}"
  if [[ ! "$version" =~ ^24\.[0-9]+\.[0-9]+$ ]]; then
    echo "Expected an exact Node 24 version in .nvmrc, got: $version" >&2
    exit 1
  fi

  if nodeVersionMatches node "$version"; then
    echo "Using existing Node v$version at $(command -v node)"
    return
  fi

  if [[ "$(uname -s)" != "Linux" ]]; then
    echo "Automatic Node installation is supported only on Linux Kudu hosts" >&2
    exit 1
  fi

  local arch
  case "$(uname -m)" in
    x86_64|amd64) arch=x64 ;;
    aarch64|arm64) arch=arm64 ;;
    *) echo "Unsupported Node installation architecture: $(uname -m)" >&2; exit 1 ;;
  esac

  local node_name="node-v$version-linux-$arch"
  local cache_root="${HOME:?HOME must be set}/data/pos-backend-node"
  local node_dir="$cache_root/$node_name"

  if [[ ! -e "$node_dir" ]]; then
    (
      local tool
      for tool in curl tar sha256sum; do
        command -v "$tool" >/dev/null 2>&1
        exitWithMessageOnError "Missing tool required to download Node: $tool"
      done

      mkdir -p "$cache_root"
      exitWithMessageOnError "Could not create Node cache: $cache_root"
      local download_dir
      download_dir="$(mktemp -d "$cache_root/.install.XXXXXX")"
      exitWithMessageOnError "Could not create temporary Node download directory"
      # This subshell owns only this mktemp directory; preserve all other cache data.
      trap 'rm -rf -- "$download_dir"' EXIT

      local archive="$node_name.tar.gz"
      local base_url="https://nodejs.org/dist/v$version"
      echo "Downloading Node v$version for Linux $arch"
      curl --fail --silent --show-error --location --proto '=https' --proto-redir '=https' --tlsv1.2 \
        "$base_url/SHASUMS256.txt" -o "$download_dir/SHASUMS256.txt"
      exitWithMessageOnError "Failed to download Node checksums"
      curl --fail --silent --show-error --location --proto '=https' --proto-redir '=https' --tlsv1.2 \
        "$base_url/$archive" -o "$download_dir/$archive"
      exitWithMessageOnError "Failed to download Node archive"

      local checksum
      checksum="$(awk -v file="$archive" '$2 == file { print $1 }' "$download_dir/SHASUMS256.txt")"
      if [[ ! "$checksum" =~ ^[0-9a-f]{64}$ ]]; then
        echo "Missing or invalid checksum for $archive" >&2
        exit 1
      fi
      (cd "$download_dir" && printf '%s  %s\n' "$checksum" "$archive" | sha256sum --check --status)
      exitWithMessageOnError "Node archive checksum verification failed"

      tar -xzf "$download_dir/$archive" -C "$download_dir" --no-same-owner
      exitWithMessageOnError "Failed to extract Node archive"
      if ! nodeVersionMatches "$download_dir/$node_name/bin/node" "$version"; then
        echo "Downloaded Node does not match required version v$version" >&2
        exit 1
      fi
      mv "$download_dir/$node_name" "$node_dir"
      exitWithMessageOnError "Failed to cache downloaded Node"
    )
    exitWithMessageOnError "Failed to install required Node v$version"
  fi

  if ! nodeVersionMatches "$node_dir/bin/node" "$version"; then
    echo "Cached Node is invalid; expected v$version in $node_dir" >&2
    exit 1
  fi
  export PATH="$node_dir/bin:$PATH"
  hash -r
  echo "Using Node $(node --version) at $(command -v node)"
}

##################################################################################################################################
# Deployment
# ----------

echo Handling node.js deployment.

# Select and verify Node before changing deployed files or running Yarn.
selectNodeVersion

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

# 2. Install npm packages
if [ -e "$DEPLOYMENT_TARGET/package.json" ]; then
  cd "$DEPLOYMENT_TARGET"
  echo "Running yarn install"
  yarn install
  exitWithMessageOnError "yarn failed"
  cd - > /dev/null
fi

##################################################################################################################################
echo "Finished successfully."
