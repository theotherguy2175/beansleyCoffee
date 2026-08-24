REPO := git.casteel.pw/ccasteel/beansleycoffee
VERSION := v$(shell date -u +%Y-%m-%d-%H-%M)
PLATFORM := linux/amd64

.PHONY: build push

## Build the image for linux/amd64 and load it into local `docker images`.
build:
	docker buildx build --platform $(PLATFORM) --build-arg VERSION=$(VERSION) -t $(REPO):latest -t $(REPO):$(VERSION) --load .

## Build for linux/amd64 and push straight to the registry (requires
## `docker login git.casteel.pw` first). Pushes both `latest` (what
## argocd-image-updater tracks) and the dated version tag (what the admin
## footer shows, and what the cleanup step in build-and-push.yml prunes).
push:
	docker buildx build --platform $(PLATFORM) --build-arg VERSION=$(VERSION) -t $(REPO):latest -t $(REPO):$(VERSION) --push .
