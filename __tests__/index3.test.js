import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import nock from 'nock';
import { saveUrl } from '../src/index.js';

let tempFolder;
let responseData;
beforeAll(async () => {
  tempFolder = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  responseData = await fs.readFile('./__fixtures__/test.html', 'utf-8');
});
