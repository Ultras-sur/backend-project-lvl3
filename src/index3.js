import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import axios from 'axios';
import cheerio from 'cheerio';
import debug from 'debug';
import urlConverter from './urlConverter.js';
import { saveData, fileIsExists } from './utils.js';

const a = debug('page-loader: tagHandler');
const b = debug('page-loader: client');
// require('axios-debug-log/enable');

const defaultDir = './__loaded_pages__';

const pageTags = [
  ['img', 'src'],
  ['script', 'src'],
  ['link', 'href'],
];

const pageLoader = (url, dir = defaultDir, client = axios) => {
  const folderForFiles = path.join(dir, urlConverter.folderName(url));
  const pageName = urlConverter.pageName(url);
  const pageFilePath = path.join(dir, pageName);
  fs.mkdir(folderForFiles, { recursive: true }).catch((err) =>
    console.log(err.message)
  );
  const tagHandler = ($, [tag, tagAttr]) => {
    $(tag).each((i, elem) => {
      if ($(elem).attr(tagAttr)) {
        const link = new URL($(elem).attr(tagAttr), url).toString();
        if (urlConverter.getHost(link) === urlConverter.getHost(url)) {
          a(`Loading link "${link}"`);
          if (link.match(/\.\w+$/gi) !== null) {
            const fileName = urlConverter.fileName(link);
            const filePath = path.join(folderForFiles, fileName);
            const newLink = path.join(urlConverter.folderName(url), fileName);
            $(elem).attr(tagAttr, newLink);
            if (tag === 'img') {
              client({
                method: 'get',
                url: link,
                responseType: 'stream',
              })
                .then((response) => {
                  response.data.pipe(fsSync.createWriteStream(filePath));
                })
                .finally(() => a(`Save image ${fileName}`))
                .catch((err) => console.log(err.message));
            } else {
              client.get(link).then((response) => {
                a(`Save file ${fileName}`);
                saveData(filePath, response.data);
              });
            }
          } else {
            $(elem).attr(tagAttr, urlConverter.pageName(link));
            pageLoader(link, dir);
            a(`Go to next page ${link}`);
          }
        }
      }
    });
    a(`Save file ${pageName}`);
    saveData(pageFilePath, $.html());
  };
  b(`Client loading URL "${url}"`);

  const req = (reqUrl) => {
    b(`Trying request ${url}`);
    return client
      .get(reqUrl)
      .then((response) => cheerio.load(response.data))
      .then(($) => {
        pageTags.forEach((tag) => {
          b(`Client get tags [ ${tag} ]`);
          tagHandler($, tag);
        });
      });
    /* .then(($) => saveData(pageFilePath, $.html()))
      .catch((err) => console.log(`Error: ${err.message}`)); */
  };

  fileIsExists(pageFilePath).then((result) =>
    result === false ? req(url) : b(`Page ${url} is already processed.`)
  );
};

export default pageLoader;
