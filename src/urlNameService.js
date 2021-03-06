/* eslint-disable class-methods-use-this */
import path from 'path';

class URLNameService {
  pathNameBuilder(url) {
    const myUrl = new URL(url);
    const pageName = url
      .replace(`${myUrl.protocol}//`, '')
      .replace(/\/$/, '')
      .replace(/[^a-z0-9]/gi, '-');
    return pageName;
  }

  createFileName(fileUrl) {
    const myUrl = new URL(fileUrl);
    const fileName = fileUrl
      .replace(`${myUrl.protocol}//`, '')
      .replace(/\.\w+$/, '')
      .replace(/[^a-z0-9]/gi, '-');
    const format = path.extname(fileUrl);
    return `${fileName}${format}`;
  }

  createFolderName(url) {
    return `${this.pathNameBuilder(url)}_files`;
  }

  createPageName(url) {
    return `${this.pathNameBuilder(url)}.html`;
  }
}

export default new URLNameService();
