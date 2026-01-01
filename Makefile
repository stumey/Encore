.PHONY: help dev dev-up dev-down dev-logs dev-reset db-migrate db-create install build test lint clean

# Default target
help:
	@echo "Encore - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install      - Install all dependencies"
	@echo "  make dev          - Start all services (docker + apps)"
	@echo "  make dev-up       - Start local infrastructure (postgres, localstack, etc.)"
	@echo "  make dev-down     - Stop local infrastructure"
	@echo "  make dev-logs     - View infrastructure logs"
	@echo "  make dev-reset    - Reset local infrastructure (removes all data)"
	@echo ""
	@echo "Database:"
	@echo "  make db-push      - Sync Prisma schema to database (quick dev)"
	@echo "  make db-migrate   - Create and apply Prisma migrations"
	@echo "  make db-deploy    - Apply migrations (production)"
	@echo ""
	@echo "Build & Test:"
	@echo "  make build        - Build all apps"
	@echo "  make test         - Run all tests"
	@echo "  make lint         - Run linting"
	@echo "  make clean        - Clean build artifacts"
	@echo ""
	@echo "Apps:"
	@echo "  make web          - Start web app only"
	@echo "  make api          - Start API only"
	@echo "  make api-local    - Start API with LocalStack S3"
	@echo "  make mobile       - Start mobile app only"

# ==================== Development ====================

install:
	npm install

dev: dev-up
	npm run dev

dev-up:
	cd .dev && docker-compose up -d
	@echo ""
	@echo "Services started:"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - Adminer:    http://localhost:8080"
	@echo "  - LocalStack: http://localhost:4566"

dev-down:
	cd .dev && docker-compose down

dev-logs:
	cd .dev && docker-compose logs -f

dev-reset:
	cd .dev && docker-compose down -v
	cd .dev && docker-compose up -d

# ==================== Database ====================

db-push:
	cd apps/api && npx prisma db push

db-migrate:
	cd apps/api && npx prisma migrate dev

db-deploy:
	cd apps/api && npx prisma migrate deploy

# ==================== Build & Test ====================

build:
	npm run build

test:
	npm run test

lint:
	npm run lint

clean:
	npm run clean
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf packages/*/node_modules

# ==================== Individual Apps ====================

web:
	npm run dev --workspace=apps/web

api:
	npm run dev --workspace=apps/api

api-local:
	npm run dev:local --workspace=apps/api

mobile:
	npm run dev --workspace=apps/mobile
