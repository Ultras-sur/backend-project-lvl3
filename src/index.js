import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import cheerio from 'cheerio';
import Listr from 'listr';
import debug from 'debug';
import urlNameService from './urlNameService.js';

const log = 'page-loader';
const pageLoaderLog = debug(log);
const defaultFolder = './__loaded_pages__';
const errors = {
  ENOTFOUND: 'URL is not found',
  ENOENT: `Can't access to path or not found`,
};

const saveData = (filepath, data) =>
  fsp.writeFile(filepath, data, (err) => {
    throw new Error(err.message);
  });

const checkAccess = (dir) => {
  pageLoaderLog(`Check directory: ${dir}`);
  return fsp.access(dir).catch((err) => {
    throw new Error(
      `${errors[err.code] ? errors[err.code] : `${err.message}`} : ${dir}`
    );
  });
};

const pageLoader = (url) => {
  pageLoaderLog(`Loading data: ${url}`);
  return axios
    .get(url)
    .then((response) => response)
    .catch((err) => {
      throw new Error(
        `${errors[err.code] ? errors[err.code] : `${err.message}`} : ${url}`
      );
    });
};

const savePage = (filepath, data) => {
  pageLoaderLog(`Download page to ${filepath}`);
  return fsp.writeFile(filepath, data);
};

const binaryFileLoader = (fileUrl, filePath) =>
  axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  })
    .then((response) => {
      response.data.pipe(fs.createWriteStream(filePath));
    })
    .catch((err) => {
      throw new Error(`Error saving image: ${err.message} (${fileUrl})`);
    });

// eslint-disable-next-line spaced-comment
/*const fileLoader = (url, filePath) =>
  axios.get(url)
  .then((response) => saveData(filePath, response.data));*/

  const fileLoader = (resourceUrl, filePath) =>
  axios({
    method: 'get',
    url: resourceUrl,
    responseType: 'arraybuffer',
  })
  .then((response) => saveData(filePath, response.data));

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
        pageLoaderLog(`Found resource: ${pagelink}`);
        if (pagelink.href.match(/\.\w+$/gi) !== null) {
          const fileName = urlNameService.createFileName(pagelink.href);
          const midifiedPathURL = path.join(
            urlNameService.createFolderName(
              `${pageUrl.origin}${pageUrl.pathname}`
            ),
            fileName
          );
          const newFilePath = path.join(resourceFolderPath, fileName);
          $(pageTag).attr(tagAttr, midifiedPathURL);
          resources.push({
            fileUrl: pagelink.href,
            load: tagTypes[tag].downloader,
            filePath: newFilePath,
          });
        } else {
          const fileName = urlNameService.createPageName(pagelink.href);
          const midifiedPathURL = path.join(
            urlNameService.createFolderName(
              `${pageUrl.origin}${pageUrl.pathname}`
            ),
            fileName
          );
          const newFilePath = path.join(resourceFolderPath, fileName);
          $(pageTag).attr(tagAttr, midifiedPathURL);
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
  pageLoaderLog(`Searching resources`);
  const resources = Object.keys(tagTypes).reduce((acc, tag) => {
    const result = tagHandler($, tag, new URL(pageUrl), resourceFolderPath);
    $ = result.$;
    acc = [...acc, ...result.resources];
    return acc;
  }, []);

  return { $, resources };
};

// download resources whithout Listr
// eslint-disable-next-line no-unused-vars
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
};

const buildListrTasks = (arr) => {
  pageLoaderLog(`Create Listr tasks`);
  return arr.reduce((acc, elem) => {
    acc.push({
      title: `${elem.fileUrl}`,
      task: () => elem.load(elem.fileUrl, elem.filePath).catch(),
    });
    return acc;
  }, []);
};

const progressHandle = (list) => {
  pageLoaderLog(`Download resources`);
  const tasks = new Listr(list, { concurrent: true });
  return tasks.run().catch((err) => console.log(err.message));
};

const downLoadResourcesListr = (data, resourceFolderPath) => {
  const { $, resources } = data;
  return fsp.mkdir(resourceFolderPath, { recursive: true }).then(() => {
    const list = buildListrTasks(resources);
    return progressHandle(list).then(() => $);
  });
};

export default (pageUrl, outputFolder = defaultFolder) => {
  const pageFilename = urlNameService.createPageName(pageUrl);
  const resourceFolderName = urlNameService.createFolderName(pageUrl);
  const pageFilePath = path.join(outputFolder, pageFilename);
  const resourceFolderPath = path.join(outputFolder, resourceFolderName);
  pageLoaderLog(`Starting load page`, pageUrl);
  return checkAccess(outputFolder)
    .then(() => pageLoader(pageUrl))
    .then((pageContent) =>
      searchPageResources(pageContent, pageUrl, resourceFolderPath)
    )
    .then((data) => downLoadResourcesListr(data, resourceFolderPath))
    .then((data) => savePage(pageFilePath, data.html()))
    .then(() => pageFilePath);
};
