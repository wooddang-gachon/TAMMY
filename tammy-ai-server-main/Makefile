.PHONY: help run build test lint docs docker deploy

# Cloud Run 배포 설정 — 환경에 맞게 덮어쓰세요.
# gcloud의 활성 프로젝트를 따라가면 다른 프로젝트로 배포될 수 있어 명시합니다.
PROJECT_ID ?= tammy-ai-server
REGION     ?= asia-northeast3
SERVICE    ?= tammy-ai-server
IMAGE      ?= $(REGION)-docker.pkg.dev/$(PROJECT_ID)/$(SERVICE)/$(SERVICE)

help:
	@grep -E '^[a-z-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

run: ## 로컬 실행 (.env 필요)
	GIN_MODE=debug go run ./cmd/server

build: ## 바이너리 빌드
	CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/server ./cmd/server

test: ## 테스트 실행
	go test ./... -race

lint: ## 포맷 및 정적 분석
	gofmt -l .
	go vet ./...

docs: ## Swagger 문서 재생성 (핸들러 주석 변경 후 실행)
	swag init -g cmd/server/main.go --parseInternal --parseDependency -o docs

docker: ## 컨테이너 이미지 빌드
	docker build -t $(IMAGE):latest .

deploy: ## Cloud Run 배포
	gcloud run deploy $(SERVICE) \
		--source . \
		--region $(REGION) \
		--project $(PROJECT_ID) \
		--allow-unauthenticated \
		--set-secrets GEMINI_API_KEY=gemini-api-key:latest,INTERNAL_API_KEY=tammy-internal-api-key:latest \
		--memory 512Mi \
		--timeout 300 \
		--concurrency 40
