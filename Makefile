.PHONY: help install dev build start test lint format docker-up docker-down prisma-generate prisma-migrate

build:
	docker compose --env-file dotenv_files/.env build --no-cache

upd:
	docker compose --env-file dotenv_files/.env up -d

up:
	docker compose --env-file dotenv_files/.env up

down:
	docker compose down

bash:
	docker exec -it order-processing-api sh

kafka:
	docker exec -it kafka bash

run:
	npm run start:dev
