import fsp from 'fs/promises';
import fs from 'fs';
import Listr from 'listr';

const saveData = (filepath, data) =>
  fsp.writeFile(filepath, data, (error) => console.error(error.message));

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
  fsp
    .readdir(path)
    // .then((files) => files.forEach((file) => console.log(`${path}/${file}`)));
    .then((files) => console.log(files));

export { saveData, fileIsExists, seeFiles };
