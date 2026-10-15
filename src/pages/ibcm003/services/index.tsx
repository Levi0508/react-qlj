/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-10-30 10:33:55
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-11-25 17:55:02
 * @FilePath: \ibcm-flow-ui\src\pages\cmp084\services\index.tsx
 * @Description: 客户填报审核表单-接口实现
 */
import { request } from 'ice';
import store from '@/store';


export default {

  // 清单下发内容查询
  async selectProjInfo(data) {
    return await request({
      url: 'thfxq/selectProjInfo',
      method: 'GET',
      params: data
    });
  },

  // 附件下载
  async downloadInoutCommentFile(filepath) {
    try {
      if (!filepath) {
        throw new Error('文件路径不能为空');
      }

      const response = await request({
        url: 'thfxq/downloadInoutCommentFile',
        method: 'GET',
        params: { filepath },
        responseType: 'blob'
      });

      if (!response || response.size === 0) {
        throw new Error('下载的文件为空');
      }

      const fileName = filepath.substring(filepath.lastIndexOf('/') + 1) || 'download';
      const blob = new Blob([response]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      return { success: true, message: '下载完成' };
    } catch (error) {
      console.error('下载失败:', error);
      throw error;
    }
  },

  // 附件预览
  async previewInoutCommentFile(filepath) {
    const result = await request({
      url: 'thfxq/previewInoutCommentFile',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      data: (() => {
        const formData = new FormData();
        formData.append('filepath', filepath);
        return formData;
      })()
    });

    // 替换预览URL中的地址
    // 将 http://10.116.131.13:8090/ibcm_file 替换为 http://10.181.135.22:8080/ibcm_flow/ibcm_file
    if (result && result.success && result.data && result.data.previewUrl) {
      result.data.previewUrl = result.data.previewUrl.replace(
        'http://10.116.131.13:8090/ibcm_file',
        'http://10.181.135.22:8080/ibcm_flow/ibcm_file'
      );
    }
    return result;
  },
}