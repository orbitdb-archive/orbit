all: build

deps:
	npm install

build: deps
	npm run build:app
	@echo "Build success! Go to '../' and run 'make start' to start the orbit-electron app."
	@echo "Built: 'bin/'"

start: build
	npm run start

clean:
	rm -rf node_modules/
