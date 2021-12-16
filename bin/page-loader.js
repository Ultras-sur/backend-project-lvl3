#!/usr/bin/env node
import { Command } from 'commander/esm.mjs';
import saveUrl from '../src/index5.js';

const program = new Command();

program
  .description('Page loader utility')
  .arguments('<url>')
  .version('0.0.1')
  .option('-o, --output [dir]', "output dir (default: '/__loaded_pages__')")
  .action((url) => {
    const options = program.opts();
    saveUrl(url, options.output).catch((err) => console.error(err));
  });

program.parse(process.argv);
