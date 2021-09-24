import nock from 'nock';
import { saveUrl } from '../src/utils.js';

test('Load Page', async () => {
  const trueFilePath =
    '/home/ultras/Documents/backend-project-lvl3/__loaded_pages__/ru-hexlet-io-courses';
  expect(saveUrl('https://ru.hexlet.io/courses')).toEqual(trueFilePath);
});
