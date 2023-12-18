.PHONY: build

SHELL     := /bin/bash
TAG       := $(shell date +"%Y.%m.%d")

DIST_DIR  := ../iot49.github.io/leaf

build:
	@echo build release in ./dist and copy to ${DIST_DIR}
	npm run build
	rsync -av --delete ./dist/ ${DIST_DIR}

clean:
	rm -rf ./dist