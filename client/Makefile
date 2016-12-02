all: build

deps:
	npm install

build: deps
	grunt build
	@echo "Build success! Go to '../' and run 'make start' to start the orbit-electron app."
	@echo "Built: 'bin/'"

clean:
	rm -rf node_modules/
