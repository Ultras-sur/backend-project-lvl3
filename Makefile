install:
	npm install

publish:
	npm publish --dry--run	

lint:
	npx eslint .

push: 
	git push -u origin main

format:
	npm run format

test-easy: 
	npx -n '--experimental-vm-modules --no-warnings' jest 

test-coverage:	
	npm test -- --coverage --coverageProvider=v8 --forceExit

test: 
	DEBUG=page-loader* npm test

.PHONY: test