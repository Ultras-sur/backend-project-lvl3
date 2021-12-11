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
const trueCssFile = 'ru-hexlet-io-assets-application.css';
const trueFoldername = 'ru-hexlet-io-courses_files';
const trueJsFile = 'ru-hexlet-io-packs-js-runtime.js';

let tempFolder,
  testData,
  testData2,
  testData3,
  testData4,
  checkPage,
  checkImage,
  checkCss,
  checkJs;

beforeAll(async () => {
  f('START');
  tempFolder = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  f(`Folder for loading files "${tempFolder}" is created`);
  testData = await fsp.readFile('./__fixtures__/test.html', 'utf-8');
  testData2 = await fsp.readFile('./__fixtures__/assets/application.css');
  testData3 = await fsp.readFile('./__fixtures__/assets/nodejs.png');
  testData4 = await fsp.readFile('./__fixtures__/assets/runtime.js', 'utf-8');
  f('END');
});

beforeEach(async () => {
  g('START');
  nock(baseURL).get('/courses').reply(200, testData);
  nock(baseURL).get('/assets/application.css').reply(200, testData2);
  nock(baseURL).get('/assets/professions/nodejs.png').reply(200, testData3);
  nock(baseURL).get('/packs/js/runtime.js').reply(200, testData4);
  // nock(baseURL).get('/courses').reply(404, 'No page');
  g('END');
});

test('beforeFilePath', async () => {
  h('START');
  const testFilePath = path.join(tempFolder, truePageName);
  await saveUrl(`${baseURL}/courses`, tempFolder)
    /* .then(async () => {
      await seeFiles(tempFolder);
      await seeFiles(path.join(tempFolder, trueFoldername));
    }) */
    .then(async () => {
      checkImage = await fileIsExists(
        path.join(tempFolder, trueFoldername, trueImageName)
      );
      checkCss = await fileIsExists(
        path.join(tempFolder, trueFoldername, trueCssFile)
      );
      checkJs = await fileIsExists(
        path.join(tempFolder, trueFoldername, trueJsFile)
      );
      checkPage = await fileIsExists(path.join(tempFolder, truePageName));
    })
    .then(async () => {
      await expect(checkPage).toBe(true);
      await expect(checkImage).toBe(true);
      await expect(checkCss).toBe(true);
      await expect(checkJs).toBe(true);
    });
  h('END');
});

/* test('monkey', async () => {
  h('START');
  const truePageName = 'ru-hexlet-io-courses.html';
  const trueImageName = 'ru-hexlet-io-assets-professions-nodejs.png';
  const trueCssFile = 'ru-hexlet-io-assets-application.css';
  const trueFoldername = 'ru-hexlet-io-courses_files';
  const trueJsFile = 'ru-hexlet-io-packs-js-runtime.js';

  // await seeFiles(`${folder}/${trueFoldername}`);
  expect(checkPage).toBe(true);
  expect(checkImage).toBe(true);
  expect(checkCss).toBe(true);
  expect(checkJs).toBe(true);
  h('END');
});*/
