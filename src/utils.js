import axios from "axios";
import fs from "fs/promises";
import _ from "lodash";

const fileNameBuilder = (url) => {
  const myUrl = new URL(url);
  const urlWhithoutProtocol = url.replace(`${myUrl.protocol}//`, "");
  return urlWhithoutProtocol.replace(/[^a-z0-9]/gi, "-");
};

const saveUrl = (url, client = axios) => {
  try {
    const fileName = fileNameBuilder(url);
    const req = client
      .get(url)
      .then((res) =>
        fs.writeFile(`${fileName}.html`, res.data, (error) =>
          console.log(error)
        )
      );
  } catch (e) {
    console.log(`Что то пошло не так : ${e}`);
  }
};
