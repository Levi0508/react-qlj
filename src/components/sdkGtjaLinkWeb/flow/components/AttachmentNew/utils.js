/**
 * 为附件相关功能提供工具和基本属性支持
 */
const utils = {
  /**
   *流程附件类型-附件域
   */
  attachFileDomain: 'flowFileDomain_attach',

  /**
   *流程附件类型-表单域
   */
  formFileDomain: 'flowFileDomain_form',

  /**
   * 获取单个文件的下载地址
   */
  getSingleFileDownloadUrl: file => `/api/ib/flow/file/download?id=${file.id}`,

  /**
   * 获取批量打包下载地址
   */
  getBatchFileDownloadUrl: (piid, fileDomain = utils.attachFileDomain, ids) =>
    `/api/ib/flow/file/batchDownload?piid=${piid}&fileDomain=${fileDomain}&ids=${ids}`,

  /**
   * 默认文件类型列表
   */
  initFileTypeId: 'flowFileType_normal',

  /**
   * 上传附件时单个文件最大大小限制 MB
   */
  allowFileMaxSize: 50,

  download: (downloadUrl, fileName, xhr) => {
    if(!xhr) xhr = new XMLHttpRequest();
    // GET请求,请求路径url,async(是否异步)

    xhr.open('GET', downloadUrl, true);
    // 设置请求头参数的方式,如果没有可忽略此行代码
    // xhr.setRequestHeader('Authorization', `Bearer ${jwtInterceptor.getToken()}`);
    // 设置响应类型为 blob
    xhr.responseType = 'blob';
    // 关键部分
    // eslint-disable-next-line func-names
    xhr.onload = function(e) {
      // 如果请求执行成功
      if (this.status === 200) {
        const blob = this.response;
        const a = document.createElement('a');

        // blob.type = "application/octet-stream";
        // 创键临时url对象
        const url = URL.createObjectURL(blob);

        a.href = url;
        a.download = fileName;
        a.click();
        // 释放之前创建的URL对象
        window.URL.revokeObjectURL(url);
      }
    };
    // 发送请求
    xhr.send();
  },
  // 格式化字符串类型日期
  formatDate: strTime => {
    if (!strTime) return '';
    const date = new Date(strTime);
    const injectZero = date => date > 9 ? date : `0${date}`;
    return `${date.getFullYear()}-${injectZero(date.getMonth() +
      1)}-${injectZero(date.getDate())} ${injectZero(date.getHours())}:${injectZero(date.getMinutes())}:${injectZero(date.getSeconds())}`;
  },
  getSumSize: bytes => {
    if (bytes === 0) return '0 B';
    const k = 1000;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    //return (bytes / Math.pow(k, i)) + ' ' + sizes[i];
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    //toPrecision(3) 后面保留两位小数，如1.00GB
  },
};

export default utils;
