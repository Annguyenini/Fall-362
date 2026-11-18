#!bin/bash
# strict mode
set -euo pipefail

repo_path="${REPO_PATH:?REPO_PATH is required}"
front_end_repo_path="${FRONTEND_REPO_PATH:?FRONTEND_REPO_PATH is required}"
image_name="${IMAGE_NAME:?IMAGE_NAME is required}"
image_version="${IMAGE_VERSION:?IMAGE_VERSION is required}"

# build version
cd "$front_end_repo_path"

docker build -t "$image_name":"$image_version" .
# run container

IMAGE_NAME=$image_name IMAGE_VERSION=$image_version docker compose up --build -d
