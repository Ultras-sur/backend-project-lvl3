#!/usr/bin/env node
import { Command } from 'commander/esm.mjs';
import pageLoader from '../src/index.js';

const program = new Command();

program
  .description('Page loader utility')
  .arguments('<url>')
  .version('0.0.1')
  .option('-o, --output [dir]', 'output dir path', process.cwd())
  .action((url) => {
    const options = program.opts();
    pageLoader(url, options.output)
      .then((filePath) =>
        console.log(`Page was successfully downloaded into '${filePath}'`)
      )
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  });

program.parse(process.argv);
