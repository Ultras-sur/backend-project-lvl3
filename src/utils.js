import fsp from 'fs/promises';
import fs from 'fs';

const saveData = (filepath, data) =>
  fsp.writeFile(filepath, data, (err) => {
    throw new Error(err.message);
  });

const fileIsExists = (path) =>
  new Promise((resolve, reject) => {
    fs.access(path, fs.constants.R_OK, (err) => {
      if (!err) {
        return resolve(true);
      }
      if (err.code === 'ENOENT') {
        console.error(`ERROR: File not found ${path}`);
        return resolve(false);
      }
      return reject(err.message);
    });
  });

const seeFiles = async (path) =>
  fsp.readdir(path).then((files) => console.log(files));

export { saveData, fileIsExists, seeFiles };
