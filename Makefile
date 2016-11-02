all: deps

deps:
	npm install
	@echo "Done! Go to '../' and run 'make start' to start the orbit-electron app."

build: deps
	npm run build
	@echo "Build success!"
	@echo "Built: 'bin/'"

start:
	npm start

clean:
	rm -rf node_modules/

.PHONY: start
