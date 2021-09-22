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

test: 
	npx -n '--experimental-vm-modules --no-warnings' jest 	