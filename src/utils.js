import fs from 'fs/promises';

const saveData = (fileName, data) => {
  fs.writeFile(`${fileName}.html`, data, (error) => console.log(error));
};

export { saveData };
