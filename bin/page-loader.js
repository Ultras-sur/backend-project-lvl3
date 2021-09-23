#!/usr/bin/env node
import { Command } from "commander/esm.mjs";
import { saveUrl } from "../src/utils.js";
import axios from "axios";

const program = new Command();

program
  .description("Page loader utility")
  .arguments("<url>")
  .version("0.0.1")
  .option(
    "-o, --output [dir]",
    "output dir (default: '/home/ultras/Documents/backend-project-lvl3/__loaded_pages__')"
  )
  .action((url) => {
    const options = program.opts();
    saveUrl(url, axios, options.output);
  });

program.parse(process.argv);
