import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import cheerio from 'cheerio';
import debug from 'debug';
import Listr from 'listr';
import urlConverter from './urlConverter.js';
import { saveData } from './utils.js';

const defaultFolder = './__loaded_pages__';
const errors = {
  ENOTFOUND: 'URL is not found',
  ENOENT: `Can't access to path or not found`,
};

const checkAccess = (dir) =>
  fsp.access(dir, fs.constants.W_OK).catch((err) => {
    throw new Error(`${errors[err.code]} ${dir}`);
  });

const pageLoader = (url) =>
  axios
    .get(url)
    .then((response) => response)
    .catch((err) => {
      // console.error(errors[err.code]);
      // throw err;
      // process.exit();
      throw new Error(errors[err.code]);
    });

const savePage = (filepath, data) =>
  /* const task = new Listr([
    {
      title: `Loading page: ${url}`,
      task: () => fsp.writeFile(filepath, data),
    },
  ]);

  task.run().catch((err) => console.error(err.message)); */
  fsp
    .writeFile(filepath, data)
    .then(() =>
      console.log(`Page was successfully downloaded into '${filepath}'`)
    );

const binaryFileLoader = (fileUrl, filePath) =>
  axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  })
    .then((response) => {
      response.data.pipe(fs.createWriteStream(filePath));
    })
    .catch((err) =>
      console.error(`Error saving image: ${err.message} (${fileUrl})`)
    );

const fileLoader = (url, filePath) =>
  axios.get(url).then((response) => saveData(filePath, response.data));

const tagTypes = {
  img: {
    attr: 'src',
    downloader: binaryFileLoader,
  },
  script: {
    attr: 'src',
    downloader: fileLoader,
  },
  link: {
    attr: 'href',
    downloader: fileLoader,
  },
};

const tagHandler = ($, tag, pageUrl, resourceFolderPath) => {
  const resources = [];

  const tagAttr = tagTypes[tag].attr;
  $(tag).each((i, pageTag) => {
    if ($(pageTag).attr(tagAttr)) {
      const pagelink = new URL($(pageTag).attr(tagAttr), pageUrl.origin);
      if (pageUrl.host === pagelink.host) {
        if (pagelink.href.match(/\.\w+$/gi) !== null) {
          const fileName = urlConverter.fileName(pagelink.href);
          const newFilePath = path.join(resourceFolderPath, fileName);
          $(pageTag).attr(tagAttr, newFilePath);
          resources.push({
            fileUrl: pagelink.href,
            load: tagTypes[tag].downloader,
            filePath: newFilePath,
          });
        } else {
          const fileName = urlConverter.pageName(pagelink.href);
          const newFilePath = path.join(resourceFolderPath, fileName);
          $(pageTag).attr(tagAttr, newFilePath);
          resources.push({
            fileUrl: pagelink.href,
            load: tagTypes[tag].downloader,
            filePath: newFilePath,
          });
        }
      }
    }
  });
  return { $, resources };
};

const searchPageResources = (pageContent, pageUrl, resourceFolderPath) => {
  let $ = cheerio.load(pageContent.data);

  const resources = Object.keys(tagTypes).reduce((acc, tag) => {
    const result = tagHandler($, tag, new URL(pageUrl), resourceFolderPath);
    $ = result.$;
    acc = [...acc, ...result.resources];
    return acc;
  }, []);

  return { $, resources };
};

/*
const downLoadResources = (data, resourceFolderPath) => {
  const { $, resources } = data;
  return fsp
    .mkdir(resourceFolderPath, { recursive: true })
    .then(() => {
      const promises = resources.map((resource) =>
        resource.load(resource.fileUrl, resource.filePath)
      );
      return Promise.all(promises).then(() => $);
    })
    .catch((err) => console.error(err.message));
  // .then(() => $);
}; */

const buildListrTasks = (arr) =>
  arr.reduce((acc, elem) => {
    acc.push({
      title: `${elem.fileUrl}`,
      task: () => elem.load(elem.fileUrl, elem.filePath),
    });
    return acc;
  }, []);

const progressHandle = (list) => {
  const tasks = new Listr(list, { concurrent: true });

  return tasks
    .run()
    .catch((err) => console.log(`${err.message} (${err.config.url})`));
};

const downLoadResourcesListr = (data, resourceFolderPath) => {
  const { $, resources } = data;

  return fsp
    .mkdir(resourceFolderPath, { recursive: true })
    .then(() => {
      const list = buildListrTasks(resources);
      return progressHandle(list).then(() => $);
    })
    .catch((err) => console.error(err.message));
};

export default (pageUrl, outputFolder = defaultFolder) => {
  const pageFilename = path.join(urlConverter.pageName(pageUrl));
  const pageFilePath = path.join(outputFolder, pageFilename);
  const resourceFolderName = urlConverter.folderName(pageUrl);
  const resourceFolderPath = path.join(outputFolder, resourceFolderName);

  return checkAccess(outputFolder)
    .then(() => pageLoader(pageUrl))
    .then((pageContent) =>
      searchPageResources(pageContent, pageUrl, resourceFolderPath)
    )
    .then((data) => downLoadResourcesListr(data, resourceFolderPath))
    .then(($) => savePage(pageFilePath, $.html()))
    .then(() => pageFilePath);
};
