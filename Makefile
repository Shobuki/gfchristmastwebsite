SHELL := /bin/bash

IMAGE_NAME ?= natalgf
IMAGE_TAG ?= latest
IMAGE := $(IMAGE_NAME):$(IMAGE_TAG)

SSH_HOST ?= 82.153.226.199
SSH_USER ?= root
SSH_PORT ?= 22
DEPLOY_PATH ?= /root/natalgf
SSH_KEY ?= C:/Users/Alfredo/.ssh/pribadi

REPO_URL ?= $(shell git config --get remote.origin.url)
REPO_BRANCH ?= main
ENV_FILE ?= .env.local
ENV_REMOTE ?= $(DEPLOY_PATH)/.env.local
USE_REMOTE_ENV ?= 1

SEND_ENV_STEP = if [ -f $(ENV_FILE) ]; then scp $(SCP_OPTS) $(ENV_FILE) $(SSH_USER)@$(SSH_HOST):$(ENV_REMOTE); else echo "Missing $(ENV_FILE), skipping upload."; fi
ifeq ($(USE_REMOTE_ENV),1)
SEND_ENV_STEP = ssh $(SSH_OPTS) $(SSH_USER)@$(SSH_HOST) "test -f $(ENV_REMOTE) || (echo 'Missing $(ENV_REMOTE) on VPS' && exit 1)"
endif
SSH_OPTS := -p $(SSH_PORT)
SCP_OPTS := -P $(SSH_PORT)
ifneq ($(SSH_KEY),)
SSH_OPTS += -i $(SSH_KEY)
SCP_OPTS += -i $(SSH_KEY)
endif

.PHONY: docker-build docker-run docker-send-ssh docker-push-ssh docker-pull-ssh deploy deploy-dev send-deploy

docker-build:
	docker build -t $(IMAGE) .

docker-run:
	docker run --rm -p 3000:3000 --env-file .env.local $(IMAGE)

docker-send-ssh:
	@test -n "$(SSH_USER)" || (echo "Set SSH_USER for remote load" && exit 1)
	docker save $(IMAGE) | ssh $(SSH_OPTS) $(SSH_USER)@$(SSH_HOST) "docker load"

docker-push-ssh: docker-build docker-send-ssh

docker-pull-ssh:
	@test -n "$(SSH_USER)" || (echo "Set SSH_USER for remote load" && exit 1)
	ssh $(SSH_OPTS) $(SSH_USER)@$(SSH_HOST) "docker images $(IMAGE) --format '{{.Repository}}:{{.Tag}} {{.ID}}'"

deploy: docker-push-ssh
	@test -n "$(SSH_USER)" || (echo "Set SSH_USER for remote load" && exit 1)
	ssh $(SSH_OPTS) $(SSH_USER)@$(SSH_HOST) "cd $(DEPLOY_PATH) && docker compose up -d"

deploy-dev:
	@test -n "$(SSH_USER)" || (echo "Set SSH_USER for remote load" && exit 1)
	docker save $(IMAGE) | ssh $(SSH_OPTS) $(SSH_USER)@$(SSH_HOST) "docker load"
	ssh $(SSH_OPTS) $(SSH_USER)@$(SSH_HOST) "cat > $(DEPLOY_PATH)/docker-compose.dev.yml" < docker-compose.dev.yml
	ssh $(SSH_OPTS) $(SSH_USER)@$(SSH_HOST) "cd $(DEPLOY_PATH) && docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d"

send-deploy:
	@test -n "$(SSH_USER)" || (echo "Set SSH_USER for remote load" && exit 1)
	@test -n "$(REPO_URL)" || (echo "Set REPO_URL for remote clone" && exit 1)
	ssh $(SSH_OPTS) $(SSH_USER)@$(SSH_HOST) "set -e; if [ -d $(DEPLOY_PATH)/.git ]; then cd $(DEPLOY_PATH) && git fetch origin $(REPO_BRANCH) && git checkout $(REPO_BRANCH) && git pull --ff-only origin $(REPO_BRANCH); elif [ -d $(DEPLOY_PATH) ]; then rm -rf $(DEPLOY_PATH).bak; mv $(DEPLOY_PATH) $(DEPLOY_PATH).bak; git clone --depth 1 --branch $(REPO_BRANCH) $(REPO_URL) $(DEPLOY_PATH); else git clone --depth 1 --branch $(REPO_BRANCH) $(REPO_URL) $(DEPLOY_PATH); fi"
	$(SEND_ENV_STEP)
	ssh $(SSH_OPTS) $(SSH_USER)@$(SSH_HOST) "cd $(DEPLOY_PATH) && docker compose up -d --build"
migrate:
	@test -n "$(SSH_USER)" || (echo "Set SSH_USER for remote load" && exit 1)
	ssh $(SSH_OPTS) $(SSH_USER)@$(SSH_HOST) "cd $(DEPLOY_PATH) && docker compose exec -T web npm run migrate"















