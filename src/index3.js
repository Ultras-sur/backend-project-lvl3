import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import urlConverter from './urlConverter.js';
import saveData from './utils.js';

const defaultDir = './__loaded_pages__';

const pageTags = [
  ['img', 'src'],
  ['script', 'src'],
  ['link', 'href'],
];

const pageLoader = (url, dir = defaultDir, client = axios) => {
  const folderForFiles = path.join(dir, urlConverter.folderName(url));
  fs.mkdir(folderForFiles, { recursive: true }, (err) => {
    if (err) return;
  });
  const tagHandler = ($, [tag, tagAttr]) => {
    $(tag).each((i, elem) => {
      if ($(elem).attr(tagAttr)) {
        const link = new URL($(elem).attr(tagAttr), url).toString();
        console.log(link);
        if (urlConverter.getHost(link) === urlConverter.getHost(url)) {
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
              }).then((response) =>
                response.data.pipe(fsSync.createWriteStream(filePath))
              );
            } else {
              client
                .get(link)
                .then((response) => saveData(filePath, response.data));
            }
          } else {
            $(elem).attr(tagAttr, `${urlConverter.pageName(link)}.html`);
            pageLoader(link, dir);
          }
        }
      }
    });
  };

  client
    .get(url)
    .then((response) => cheerio.load(response.data))
    .then(($) => {
      pageTags.forEach((tag) => {
        tagHandler($, tag);
      });
      return $;
    })
    .then(($) => {
      const filePath = path.join(dir, urlConverter.pageName(url));
      saveData(`${filePath}.html`, $.html());
    })
    .catch((err) => console.log(`Error: ${err.message}`));
};

export default pageLoader;
