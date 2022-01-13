import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import os from 'os';
import nock from 'nock';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import saveUrl from '../src/index5.js';
import debug from 'debug';
import { expect } from '@jest/globals';

axios.defaults.adapter = httpAdapter;
const f = debug('testIndex: BeforeAll');
const g = debug('testIndex: BeforeEach');
const h = debug('testIndex: TEST');
const a = debug('testIndex: TEST');

const baseURL = 'https://ru.hexlet.io';

let tempFolder, testData, testData2, testData3, testData4, testData5;

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
  nock(baseURL).get('/assets/application.css').reply(404);
  nock(baseURL).get('/assets/professions/nodejs.png').reply(200, testData3);
  nock(baseURL).get('/packs/js/runtime.js').reply(200, testData4);
  nock(baseURL).get('/courses2').reply(200, testData5);

  f('END');
});

test('Check errors', async () => {
  const falseFolder = './1234';
  const falseUrl = 'http://www.tim453.org';
  const falseFileUrl = `${baseURL}/assets/application.css`;

  expect(async () => {
    await saveUrl(`${baseURL}/courses`, falseFolder);
  }).rejects.toThrowError('./1234');

  expect(async () => {
    await saveUrl(falseUrl, tempFolder);
  }).rejects.toThrowError(falseUrl);

  expect(async () => {
    await saveUrl(`${baseURL}/courses`, tempFolder);
  }).rejects.toThrowError();
});

//
