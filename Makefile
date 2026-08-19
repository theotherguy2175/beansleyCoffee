IMAGE := git.casteel.pw/beansleycoffee:latest
PLATFORM := linux/amd64

.PHONY: build push

## Build the image for linux/amd64 and load it into local `docker images`.
build:
	docker buildx build --platform $(PLATFORM) -t $(IMAGE) --load .

## Build for linux/amd64 and push straight to the registry (requires
## `docker login git.casteel.pw` first).
push:
	docker buildx build --platform $(PLATFORM) -t $(IMAGE) --push .
