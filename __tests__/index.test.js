import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import os from 'os';
import nock from 'nock';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import saveUrl from '../src/index5.js';
import debug from 'debug';
import { fileIsExists, seeFiles } from '../src/utils.js';
import cheerio from 'cheerio';

const checkAccess = (dir) => fsp.access(dir, fs.constants.R_OK);

axios.defaults.adapter = httpAdapter;
const f = debug('testIndex: BeforeAll');
const g = debug('testIndex: BeforeEach');
const h = debug('testIndex: TEST');
const a = debug('testIndex: TEST');

const baseURL = 'https://ru.hexlet.io';
const folder = './__fixtures__/test';
const truePageName = 'ru-hexlet-io-courses.html';
const trueImageName = 'ru-hexlet-io-assets-professions-nodejs.png';
const trueCssFileName = 'ru-hexlet-io-assets-application.css';
const trueFolderName = 'ru-hexlet-io-courses_files';
const trueJsFileName = 'ru-hexlet-io-packs-js-runtime.js';
const trueLinkToPageName = 'ru-hexlet-io-courses2.html';
const pageTags = [
  ['img', 'src'],
  ['script', 'src'],
  ['link', 'href'],
];

let tempFolder, testData, testData2, testData3, testData4, testData5, testLinks;

beforeAll(async () => {
  f('START');
  tempFolder = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  f(`Folder for loading files "${tempFolder}" is created`);
  testData = await fsp.readFile('./__fixtures__/test.html', 'utf-8');
  testData2 = await fsp.readFile('./__fixtures__/application.css');
  testData3 = await fsp.readFile('./__fixtures__/nodejs.png');
  testData4 = await fsp.readFile('./__fixtures__/runtime.js', 'utf-8');
  testData5 = await fsp.readFile('./__fixtures__/courses.html', 'utf-8');
  nock(baseURL).get('/courses').reply(200, testData);
  nock(baseURL).get('/assets/application.css').reply(200, testData2);
  nock(baseURL).get('/assets/professions/nodejs.png').reply(200, testData3);
  nock(baseURL).get('/packs/js/runtime.js').reply(200, testData4);
  nock(baseURL).get('/courses2').reply(200, testData5);
  await saveUrl(`${baseURL}/courses`, `${tempFolder}`)
    .then(async () => {
      const testPage = await fsp.readFile(path.join(tempFolder, truePageName));
      return testPage;
    })
    .then((testPage) => {
      return (testLinks = pageTags.reduce((acc, [tag, tagAttr]) => {
        const $ = cheerio.load(testPage);
        $(tag).each((i, pageTag) => {
          acc.push($(pageTag).attr(tagAttr));
        });
        return acc;
      }, []));
    });
  // .then(console.log);
  f('END');
});

test('Check downloaded files and names', async () => {
  h('START');

  const checkImage = await fileIsExists(
    path.join(`${tempFolder}`, trueFolderName, trueImageName)
  );
  const checkCss = await fileIsExists(
    path.join(`${tempFolder}`, trueFolderName, trueCssFileName)
  );
  const checkJs = await fileIsExists(
    path.join(`${tempFolder}`, trueFolderName, trueJsFileName)
  );
  const checkPage = await fileIsExists(
    path.join(`${tempFolder}`, truePageName)
  );
  const checkLinkToPage = await fileIsExists(
    path.join(`${tempFolder}`, trueFolderName, trueLinkToPageName)
  );

  await expect(checkPage).toBe(true);
  await expect(checkImage).toBe(true);
  await expect(checkCss).toBe(true);
  await expect(checkJs).toBe(true);
  await expect(checkLinkToPage).toBe(true);

  h('END');
});

test('Check changed links', () => {
  expect(testLinks).toContain(
    `${path.join(tempFolder, trueFolderName, trueLinkToPageName)}`
  );
  expect(testLinks).toContain(
    `${path.join(tempFolder, trueFolderName, trueImageName)}`
  );
  expect(testLinks).toContain(
    `${path.join(tempFolder, trueFolderName, trueCssFileName)}`
  );
  expect(testLinks).toContain(
    `${path.join(tempFolder, trueFolderName, trueJsFileName)}`
  );
});
