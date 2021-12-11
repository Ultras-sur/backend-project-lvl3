import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import cheerio from 'cheerio';
import converter from './urlConverter.js';
import { saveData } from './utils.js';

const defaultDir = './__loaded_pages__';

// eslint-disable-next-line import/prefer-default-export
const saveUrl = (url, dir = defaultDir, client = axios) => {
  const fileName = converter.fileName(url);
  const filePath = path.join(dir, fileName);
  try {
    client
      .get(url)
      .then((response) =>
        fs.writeFile(`${filePath}.html`, response.data, (e) =>
          console.log(`Can't write file: ${e}`)
        )
      );
  } catch (e) {
    console.log(`Can't load page: ${e}`);
  }
  console.log(`${filePath}.html`);
  return `${filePath}.html`;
};

export default saveUrl;
