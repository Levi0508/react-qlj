/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git
 * @Date: 2025-10-30 10:33:55
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-11-25 17:55:02
 * @FilePath: \ibcm-flow-ui\src\pages\cmp084\services\index.tsx
 * @Description: 客户填报审核表单-接口实现
 */
import { request } from 'ice';


export default {

  // 清单下发内容查询
  async selectContent(data) {
    return await request({
      url: 'thfxq/selectContent',
      method: 'GET',
      params: data
    });
  },

  // 是否完成清单自查状态查询
  async selectSelfCheck(data) {
    return await request({
      url: 'thfxq/selectSelfCheck',
      method: 'GET',
      params: data
    });
  },

  // 清单自查附件查询
  async selectSelfCheckFile(data) {
    return await request({
      url: 'thfxq/selectSelfCheckFile',
      method: 'GET',
      params: data
    });
  },

  async downloadSelfCheckFile(fileName, id) {
    try {
      if (!id) {
        throw new Error('文件ID不能为空');
      }
      if (!fileName) {
        throw new Error('文件名不能为空');
      }

      const response = await request({
        url: 'thfxq/downloadSelfCheckFile',
        method: 'GET',
        params: { id },
        responseType: 'blob'
      });

      // 检查响应是否有效
      if (!response || response.size === 0) {
        throw new Error('下载的文件为空');
      }

      // 创建blob和下载链接，直接使用传入的文件名
      const blob = new Blob([response]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();

      // 清理资源
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      return { success: true, message: '下载完成' };

    } catch (error) {
      console.error('下载失败:', error);
      throw error;
    }
  }
}