import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import converter from './urlConverter.js';
import saveData from './utils.js';

const defaultDir = './__loaded_pages__';

const pageLoader = (url, dir = defaultDir, client = axios) => {
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
          const newLink = path.join(
            converter.folderName(url),
            converter.fileName(imageLink)
          );
          $(elem).attr('src', newLink);
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
          if ($(elem).attr('src')) {
            const scriptLink = new URL($(elem).attr('src'), url).toString();
            const filePath = path.join(
              folderForFiles,
              converter.fileName(scriptLink)
            );
            const newLink = path.join(
              converter.folderName(url),
              converter.fileName(scriptLink)
            );

            if (converter.getHost(scriptLink) === converter.getHost(url)) {
              $(elem).attr('src', newLink);
              client
                .get(scriptLink)
                .then((response) => saveData(filePath, response.data));
            }
          }
        });
        $('link').each((i, elem) => {
          const link = new URL($(elem).attr('href'), url).toString();
          console.log(link);
          if (converter.getHost(link) === converter.getHost(url)) {
            console.log(link, link.match(/\.\w+$/gi) !== null);
            if (link.match(/\.\w+$/gi) !== null) {
              const filepath = path.join(
                folderForFiles,
                converter.fileName(link)
              );
              const newLink = path.join(
                converter.folderName(url),
                converter.fileName(link)
              );
              $(elem).attr('href', newLink);
              client
                .get(link)
                .then((response) => saveData(filepath, response.data));
            } else {
              $(elem).attr('href', `${converter.pageName(link)}.html`);
              pageLoader(link);
            }
          }
        });
        return $;
      })
      .then(($) => {
        const filePath = path.join(dir, converter.pageName(url));
        saveData(`${filePath}.html`, $.html());
      });
  } catch (err) {
    console.log(`Что то пошло не так : ${err.message}`);
  }
};

export default pageLoader;
