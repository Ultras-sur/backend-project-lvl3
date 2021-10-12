import path from 'path';

const pageNameBuilder = (url) => {
  const myUrl = new URL(url);
  const pageName = url
    .replace(`${myUrl.protocol}//`, '')
    .replace(/\/$/, '')
    .replace(/[^a-z0-9]/gi, '-');
  return pageName;
};

const fileNameBuilder = (fileUrl) => {
  const myUrl = new URL(fileUrl);
  const fileName = fileUrl
    .replace(`${myUrl.protocol}//`, '')
    .replace(/\.\w+$/, '')
    .replace(/[^a-z0-9]/gi, '-');
  const format = path.extname(fileUrl);
  return `${fileName}${format}`;
};

export { pageNameBuilder, fileNameBuilder };
