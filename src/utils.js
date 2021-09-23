import fs from "fs/promises";
import _ from "lodash";
import path from "path";

const defaultDir =
  "/home/ultras/Documents/backend-project-lvl3/__loaded_pages__";

const fileNameBuilder = (url) => {
  const myUrl = new URL(url);
  const urlWhithoutProtocol = url.replace(`${myUrl.protocol}//`, "");
  return urlWhithoutProtocol.replace(/[^a-z0-9]/gi, "-");
};

export const saveUrl = (url, client = axios, dir = defaultDir) => {
  const fileName = fileNameBuilder(url);
  const filePath = path.join(dir, fileName);
  try {
    const req = client
      .get(url)
      .then((res) =>
        fs.writeFile(`${filePath}.html`, res.data, (error) =>
          console.log(error)
        )
      );
  } catch (e) {
    console.log(`Can't load page: ${e}`);
  }
};
