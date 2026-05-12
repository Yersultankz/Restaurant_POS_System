#!/usr/bin/env sh
set -eu

docker compose -f docker/docker-compose.yml up --build -d
