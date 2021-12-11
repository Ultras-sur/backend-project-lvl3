import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import axios from 'axios';
import cheerio from 'cheerio';
import debug from 'debug';
import Listr from 'listr';
import urlConverter from './urlConverter.js';
import { saveData, fileIsExists } from './utils.js';

const defaultDir = './__loaded_pages__';

const pageTags = [
  ['img', 'src'],
  ['script', 'src'],
  ['link', 'href'],
];

const binaryFileLoader = (fileUrl, filePath) =>
  axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  })
    .then((response) => {
      response.data.pipe(fsSync.createWriteStream(filePath));
    })
    .catch((err) => console.log(`Error saving image: ${err.message}`));

const fileLoader = (url, filePath) =>
  axios.get(url).then((response) => saveData(filePath, response.data));

const binaryFileLoaderListr = (fileUrl, filePath) => {
  const tasks = new Listr([
    {
      title: `Loading ${filePath}`,
      task: () => binaryFileLoader(fileUrl, filePath),
    },
  ]);
  tasks.run();
};

const requester = (url1, pageFolder1 = defaultDir) => {
  const handler = ($, tags, url, pageFolder) => {
    const pageFileFolder = path.join(pageFolder, urlConverter.folderName(url));
    fs.mkdir(pageFileFolder, { recursive: true }).catch((err) =>
      console.log(`Error creating folder: ${err.message}`)
    );
    tags.forEach(([tag, tagAttr]) => {
      $(tag).each((i, pageTag) => {
        if ($(pageTag).attr(tagAttr)) {
          const link = new URL($(pageTag).attr(tagAttr), url).toString();
          if (urlConverter.getHost(link) === urlConverter.getHost(url)) {
            if (link.match(/\.\w+$/gi) !== null) {
              const fileName = urlConverter.fileName(link);
              const filePath = path.join(pageFileFolder, fileName);
              const newLink = path.join(urlConverter.folderName(url), fileName);
              $(pageTag).attr(tagAttr, newLink);
              if (tag === 'img') {
                binaryFileLoaderListr(link, filePath);
              } else {
                fileLoader(link, filePath);
              }
            } else {
              $(pageTag).attr(tagAttr, `${urlConverter.pageName(link)}`);
              // eslint-disable-next-line no-use-before-define
              if (
                !fileIsExists(
                  path.join(pageFileFolder, urlConverter.pageName(link))
                )
              ) {
                requester(link, pageFolder);
              }
            }
          }
        }
      });
    });
    return $;
  };
  const filePath = path.join(pageFolder1, urlConverter.pageName(url1));
  return (
    axios
      .get(url1)
      .then((response) => cheerio.load(response.data))
      .then(($) => handler($, pageTags, url1, pageFolder1))
      .then(($) => saveData(`${filePath}`, $.html()))
      // .catch((err) => console.log(err.message));
      .then(() => filePath)
  );
};

export default requester;
