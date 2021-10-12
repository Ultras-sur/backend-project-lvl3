import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import nock from 'nock';
import { saveUrl } from '../src/index.js';

const getFixturesPath = (filename = '') =>
  path.join(__dirname, '..', '__fixtures__', filename);

let tempFolder;
beforeAll(async () => {
  tempFolder = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('Load Page', async () => {
  const trueFilePath = path.join(tempFolder, 'ru-hexlet-io-courses.html');
  expect(saveUrl('https://ru.hexlet.io/courses', tempFolder)).toEqual(
    trueFilePath
  );
});
