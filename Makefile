.PHONY: deploy destroy synth dev

deploy:
	pnpm --filter infra run deploy

destroy:
	pnpm --filter infra run destroy

synth:
	pnpm --filter infra run synth

dev:
	pnpm --filter frontend run dev
