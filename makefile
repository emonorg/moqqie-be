migrate:
	$(MAKE) build;
	pnpm run typeorm migration:run --dataSource config/typeorm.ts;

prod-migrate:
	pnpm run migration:run;

generate-migration:
	$(MAKE) build;
	@if [ -z "$(name)" ]; then \
		echo "You must specify a MIGRATION_NAME"; \
	else \
		pnpm run typeorm migration:generate  src/migrations/$(name) --dataSource config/typeorm.ts; \
	fi
	$(MAKE) build;

build:
	pnpm build

dev:
	pnpm start:dev
