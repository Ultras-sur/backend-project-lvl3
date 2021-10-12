#!/usr/bin/env node
import { Command } from 'commander/esm.mjs';
import axios from 'axios';
import { saveUrl } from '../src/index.js';

const program = new Command();

program
  .description('Page loader utility')
  .arguments('<url>')
  .version('0.0.1')
  .option('-o, --output [dir]', "output dir (default: '/__loaded_pages__')")
  .action((url) => {
    const options = program.opts();
    saveUrl(url, options.output, axios);
  });

program.parse(process.argv);
