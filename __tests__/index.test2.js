import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import nock from 'nock';
import pageLoader from '../src/index.js';
import { read } from 'fs';



const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);
const getFixturesPath = (fileName) =>
  path.join(__dirName, '..', '__fixtures__', fileName);
const readFile = (filePath) => fsp.readFile(filePath, 'utf-8');

const baseURL = new URL('https://ru.hexlet.io/courses');
const resourcesDirName = 'ru-hexlet-io-courses_files';
let tempFolder;
const localFolder = path.join(__dirName, '..', '__loaded_pages__');
console.log(localFolder)
nock.disableNetConnect();
const scope = nock(baseURL.origin).persist();
const scopeError = nock('http://www.tim234.org/').persist();

const resourcesPaths = [
  ['/assets/professions/nodejs.png', path.join(resourcesDirName, 'ru-hexlet-io-assets-professions-nodejs.png')],
  ['/courses', path.join(resourcesDirName,'ru-hexlet-io-courses.html')],
  ['/assets/application.css', path.join(resourcesDirName, 'ru-hexlet-io-assets-application.css')],
  ['/packs/js/runtime.js', path.join(resourcesDirName, 'ru-hexlet-io-packs-js-runtime.js')]
];

beforeAll(() => {
    resourcesPaths.forEach(([pathURL, filePath]) => 
        scope.get(pathURL).replyWithFile(200, getFixturesPath(filePath)));
})

beforeEach(async() => {
    tempFolder = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-2'));
       // tempFolder = localFolder;
});
describe('Test: Normal bihavior without errors', () => {
    test('Do request and get positive response', async () => {
        await pageLoader(baseURL.href, tempFolder);
        expect(scope.isDone()).toBe(true);
    })
    test('Download and midify file', async () => {
        await pageLoader(baseURL.href, tempFolder);
        const expectedPath = getFixturesPath('ru-hexlet-io-courses.html')
        const expectedFile = await readFile(expectedPath);
        const savedFile = await readFile(path.join(tempFolder, 'ru-hexlet-io-courses.html'));
        expect(savedFile).toBe(expectedFile);
    })
});

test.each(resourcesPaths)('Download resources', async (pathURL, filePath) => {
    await pageLoader(baseURL.href, tempFolder);
    const expectedPath = getFixturesPath(filePath);
    const savedPath = path.join(tempFolder, filePath);
    const expectedContent = await readFile(expectedPath);
    const savedContent = await readFile(savedPath);
    expect(savedContent).toBe(expectedContent);
})

beforeEach(() => {
    scopeError.get('/').reply(404);
    scopeError.get('/anyResourse').reply(404);       
});

test.each(
    [['URL is not found', 'http://www.tim234.org/'], 
    ['Request failed with status code 404', 'http://www.tim234.org/anyResourse']])('Expect server response errors', ([assertion, url]) => {
        expect(async () => {
           await pageLoader(url, tempFolder)
        }).rejects.toThrowError(assertion)
});

test.each(
    [["Can't access to path or not found", './1234'],
    ['not a directory', './1234.js']])('Expect file system errors', ([assertion, errorPath]) => {
        expect(async () => {
            await pageLoader(baseURL.href, errorPath);
        }).rejects.toThrowError(assertion);
});