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
	@echo "  make db-migrate   - Run database migrations"
	@echo "  make db-create    - Create a new migration (usage: make db-create name=description)"
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

db-migrate:
	cd .dev && docker-compose run --rm flyway migrate

db-create:
	@if [ -z "$(name)" ]; then \
		echo "Usage: make db-create name=description"; \
		exit 1; \
	fi
	@version=$$(ls db/migrations/V*.sql 2>/dev/null | wc -l | tr -d ' '); \
	version=$$((version + 1)); \
	filename="db/migrations/V$${version}__$(name).sql"; \
	echo "-- Migration: $(name)" > $$filename; \
	echo "-- Created: $$(date)" >> $$filename; \
	echo "" >> $$filename; \
	echo "Created: $$filename"

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

mobile:
	npm run dev --workspace=apps/mobile
