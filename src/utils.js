import fs from 'fs/promises';

const saveData = (filepath, data) => {
  fs.writeFile(filepath, data, (error) => console.log(error));
};

export default saveData;
