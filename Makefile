SHELL := /bin/bash

IMAGE_NAME ?= natalgf
IMAGE_TAG ?= latest
IMAGE := $(IMAGE_NAME):$(IMAGE_TAG)

SSH_HOST ?= 82.153.226.199
SSH_USER ?= root
SSH_PORT ?= 22
DEPLOY_PATH ?= /root/natalgf
SSH_KEY ?=

SSH_OPTS := -p $(SSH_PORT)
SCP_OPTS := -P $(SSH_PORT)
ifneq ($(SSH_KEY),)
SSH_OPTS += -i $(SSH_KEY)
SCP_OPTS += -i $(SSH_KEY)
endif

.PHONY: docker-build docker-run docker-send-ssh docker-push-ssh docker-pull-ssh deploy deploy-dev

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

migrate:
	@test -n "$(SSH_USER)" || (echo "Set SSH_USER for remote load" && exit 1)
	ssh $(SSH_OPTS) $(SSH_USER)@$(SSH_HOST) "cd $(DEPLOY_PATH) && docker compose exec -T web npm run migrate"
