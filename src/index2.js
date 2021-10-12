import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import converter from './urlConverter.js';
import { saveData } from './utils.js';

const defaultDir = './__loaded_pages__';

const pageLoader = (url, dir = defaultDir, client = axios) => {
  // const urlEngine = converter.fileName(url);
  const folderForFiles = path.join(dir, converter.folderName(url));
  try {
    client
      .get(url)
      .then((response) => cheerio.load(response.data))
      .then(($) => {
        $('img').each((i, elem) => {
          const imageLink = new URL($(elem).attr('src'), url).toString();
          const filePath = path.join(
            folderForFiles,
            converter.fileName(imageLink)
          );
          $(elem).attr('src', filePath);
          console.log(imageLink);
          fs.mkdir(folderForFiles, { recursive: true }, (err) => {
            if (err) return;
          });
          client({
            method: 'get',
            url: imageLink,
            responseType: 'stream',
          }).then((response) =>
            response.data.pipe(fsSync.createWriteStream(filePath))
          );
        });
        $('script').each((i, elem) => {
          const scriptLink = new URL($(elem).attr('href'), url).toString();
          const filePath = path.join(
            folderForFiles,
            converter.fileName(scriptLink)
          );
          if (converter.getHost(scriptLink) === converter.getHost()) {
            $(elem).attr('href', `${filePath}`);
            client
              .get(scriptLink)
              .then((response) =>
                fs.writeFile(
                  converter.fileName(scriptLink),
                  response.data,
                  (error) => console.log(error)
                )
              );
          }
        });
        $('link').each((i, elem) => {
          const pageLink = new URL($(elem).attr('href'), url).toString();
          if (converter.getHost(pageLink) === converter.getHost(url)) {
            $(elem).attr('href', `/${converter.pageName(pageLink)}`);
            pageLoader(pageLink);
          }
        });
        return $;
      })
      .then(($) => {
        const filePath = path.join(dir, converter.pageName(url));
        saveData(filePath, $.html());
      });
  } catch (err) {
    console.log(`Что то пошло не так : ${err.message}`);
  }
};
