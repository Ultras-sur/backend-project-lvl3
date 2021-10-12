import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

const saveData = (fileName, data) => {
  fs.writeFile(`${fileName}.html`, data, (error) => console.log(error));
};

const defaultDir = './__loaded_pages__';

const fileNameBuilder = (url) => {
  const myUrl = new URL(url);
  const urlWhithoutProtocol = url.replace(`${myUrl.protocol}//`, '');
  return urlWhithoutProtocol.replace(/[^a-z0-9]/gi, '-');
};

// eslint-disable-next-line import/prefer-default-export
export const saveUrl = (url, dir = defaultDir, client = axios) => {
  const fileName = fileNameBuilder(url);
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
