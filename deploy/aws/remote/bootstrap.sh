#!/usr/bin/env bash
set -euo pipefail

sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
sudo apt-get install -y docker.io docker-compose-v2
sudo usermod -aG docker "$USER"

# Free-tier micro instances are tight on RAM — enable swap
if [[ ! -f /swapfile ]]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

docker --version
docker compose version
echo "Bootstrap done. Log out and back in if this is the first Docker install."
