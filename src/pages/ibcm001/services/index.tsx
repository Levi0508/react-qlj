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
  async selectDict(data) {
    return await request({
      url: 'thfxq/selectDict',
      method: 'GET',
      params: data
    });
  },
  async selectKey(data) {
    return await request({
      url: 'thfxq/selectKey',
      method: 'GET',
      params: data
    });
  },
  // 获取客户基本信息
  async selectBasicInfo(data) {
    return await request({
      url: 'thfxq/selectBasicInfo',
      method: 'GET',
      params: data
    });
  },
  // 获取关联人信息
  async selectRelatedInfo(data) {
    return await request({
      url: 'thfxq/selectRelatedInfo',
      method: 'GET',
      params: data

    });
  },
  // 查询附件列表
  async selectFileList(data) {
    return await request({
      url: 'thfxq/selectFileList',
      method: 'GET',
      params: data

    });
  },
  // 查询反馈结果
  async selectFeedBack(data) {
    return await request({
      url: 'thfxq/selectFeedBack',
      method: 'GET',
      params: data
    });
  },
  // 查询反馈结果问题描述
  async selectFeedBackDesc(data) {
    return await request({
      url: 'thfxq/selectFeedBackDesc',
      method: 'GET',
      params: data
    });
  },
  // 查询审核总批次
  async selectBatchTotal(data) {
    return await request({
      url: 'thfxq/selectBatchTotal',
      method: 'GET',
      params: data
    });
  },

  // 查询审核详情
  async selectApprDetails(data) {
    return await request({
      url: 'thfxq/selectApprDetails',
      method: 'GET',
      params: data
    });
  },

  // 统一的附件预览接口
  async previewFile(params) {
    const result = await request({
      url: 'thfxq/previewFile',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      data: (() => {
        const formData = new FormData();

        // 根据传入的参数添加相应字段
        if (params.file) {
          formData.append('file', params.file);
        }
        if (params.id) {
          formData.append('id', params.id);
        }
        if (params.clientId) {
          formData.append('clientId', params.clientId);
        }
        if (params.fileTypeNo) {
          formData.append('fileTypeNo', params.fileTypeNo);
        }
        if (params.objectId) {
          formData.append('objectId', params.objectId);
        }
        if (params.fileName) {
          formData.append('fileName', params.fileName);
        }
        if (params.extension) {
          formData.append('extension', params.extension);
        }

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

  // 查询省
  async selectProvince(data) {
    return await request({
      url: 'thfxq/selectProvince',
      method: 'GET',
      params: data
    });
  },
  // 查询市
  async selectCity(data) {
    return await request({
      url: 'thfxq/selectCity',
      method: 'GET',
      params: data
    });
  },
  // 查询区县
  async selectDistrict(data) {
    return await request({
      url: 'thfxq/selectDistrict',
      method: 'GET',
      params: data
    });
  },


  // 下载文件
  async downloadFile(fileName, id) {
    try {
      if (!id) {
        throw new Error('文件ID不能为空');
      }
      if (!fileName) {
        throw new Error('文件名不能为空');
      }

      const response = await request({
        url: 'thfxq/downloadFile',
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
  },

  async sdkFlowApi(sendData) {
    const userInfo = store.getModelState('user');
    return await request({
      url: '/flowCommon/flowApi',
      method: 'post',
      headers: {
        // Authorization: "bearer " + getToken(),
        'x-flow-systemId': 'IBCM',
        'x-userId': userInfo.userId,
        'x-userName': userInfo.displayName
      },

      transformRequest: [function (data) {
        let formData = new FormData();
        formData.append("data", JSON.stringify(sendData));
        return formData;
      }],
    });
  },

  // SDK接口：子表批量保存数据
  async saveChild(tableNO, data, otherParams) {
    const param = {
      'piid': otherParams.piid,// 为什么gljy036要用sysIds.sysPiid
      'tiid': otherParams.tiid,
      'groupFlag': `FLOW_DOC_IBCM_ZBYBHZ_PART${tableNO}`,// 子表名称
      'formList': data
    };
    const sendData = {
      'Param': param,
      'Type': 'FLOW_MAINFORM_U0008',
    };
    return await this.sdkFlowApi(sendData);
  },

  // SDK接口：子表批量删除数据
  async deleteChildData(tableNO, data, otherParams) {
    const param = {
      'piid': otherParams.piid,
      'tiid': otherParams.tiid,
      'groupFlag': `FLOW_DOC_IBCM_ZBYBHZ_PART${tableNO}`,// 子表名称
      'guids': data
    };
    const sendData = {
      'Param': param,
      'Type': 'FLOW_MAINFORM_D0004',
    };
    return await this.sdkFlowApi(sendData);
  },

  // 保存客户基本信息（参考 xwl 中的 update_client 接口）
  async updateClient(data) {
    return await request({
      url: 'thfxq/updateClient',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data
    });
  },

  // 保存关联人信息（根据关联类型保存）
  async saveRelatedInfo(data) {
    return await request({
      url: 'thfxq/saveRelatedInfo',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data
    });
  },

  // 删除关联人信息
  async deleteRelatedInfo(relatedId) {
    return await request({
      url: 'thfxq/deleteRelatedInfo',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: { relatedId }
    });
  },

  // 查询关联主体（参考 xwl 中的 select_organ_entity 接口）
  async selectOrganEntity(data) {
    return await request({
      url: 'thfxq/selectOrganEntity',
      method: 'GET',
      params: data
    });
  },

  // 保存关联主体（参考 xwl 中的 save_organ_entity 接口）
  async saveOrganEntity(data) {
    return await request({
      url: 'thfxq/saveOrganEntity',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data
    });
  },

  // 更新关联主体（参考 xwl 中的 update_organ_entity 接口）
  async updateOrganEntity(data) {
    return await request({
      url: 'thfxq/updateOrganEntity',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data
    });
  },

  // 删除关联主体（参考 xwl 中的 delete_organ_entity 接口）
  async deleteOrganEntity(data) {
    return await request({
      url: 'thfxq/deleteOrganEntity',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data
    });
  },

  // 上传文件（参考 xwl 中的 upload_file 接口）
  async uploadFile(fileData) {
    const formData = new FormData();

    // 添加文件对象
    if (fileData.file) {
      formData.append('file', fileData.file);
    }

    // 添加所有必需参数
    if (fileData.clientId) {
      formData.append('clientId', fileData.clientId);
    }
    if (fileData.fileTypeNo) {
      formData.append('fileTypeNo', fileData.fileTypeNo);
    }
    // id由后端sysguid自动生成，不传递
    if (fileData.name) {
      formData.append('name', fileData.name);
    }
    if (fileData.fileSize) {
      formData.append('fileSize', fileData.fileSize.toString());
    }
    if (fileData.extension) {
      formData.append('extension', fileData.extension);
    }
    if (fileData.createBy) {
      formData.append('createBy', fileData.createBy);
    }
    if (fileData.createTime) {
      formData.append('createTime', fileData.createTime);
    }
    if (fileData.objectId) {
      formData.append('objectId', fileData.objectId);
    }

    return await request({
      url: 'thfxq/uploadFile',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      data: formData
    });
  },

  // 移动文件到其他目录
  async updateFileDir(data) {
    // 构建URL编码的参数
    const params = new URLSearchParams();
    if (data.id) {
      params.append('id', data.id);
    }
    if (data.fileTypeNo) {
      params.append('fileTypeNo', data.fileTypeNo);
    }

    return await request({
      url: 'thfxq/updateFileDir',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: params.toString()
    });
  },

  async deleteFile(data) {
    // 构建URL编码的参数
    const params = new URLSearchParams();
    if (data.filePkId) {
      params.append('filePkId', data.filePkId);
    } else if (data.id) {
      // 兼容旧的id参数名
      params.append('filePkId', data.id);
    }
    // 添加其他可能的参数
    if (data.clientId) {
      params.append('clientId', data.clientId);
    }
    if (data.fileTypeNo) {
      params.append('fileTypeNo', data.fileTypeNo);
    }
    if (data.objectId) {
      params.append('objectId', data.objectId);
    }

    return await request({
      url: 'thfxq/deleteFile',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: params.toString()
    });
  },

  // 保存审核列表
  async saveApprList(data) {
    return await request({
      url: 'thfxq/saveApprList',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data
    });
  },

  // 批量保存审核详情
  async saveApprDetails(data) {
    return await request({
      url: 'thfxq/saveApprDetails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data
    });
  },

  // 查询错误类型选项
  async selectErrType(organFlag?: string) {
    return await request({
      url: 'thfxq/selectErrType',
      method: 'GET',
      params: { organFlag }
    });
  },

  // 更新客户状态
  async updateClientStatus(data) {
    return await request({
      url: 'thfxq/updateClientStatus',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data
    });
  }
}