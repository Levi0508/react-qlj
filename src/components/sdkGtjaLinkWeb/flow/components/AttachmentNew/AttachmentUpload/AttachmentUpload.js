import React, { useEffect, useState } from 'react';
import { Upload, message, Icon, Modal, Button } from 'antd';
import UploadTable from './UploadTable'

const { Dragger } = Upload;

const AttachmentUpload = props => {
  const {
    systemId,
    fileTypeWhiteList,
    flowCode,
    dispatch,
    uploadUrl,
    uploadFileList,
    attachmentPer,
    attachmentTypeList,
    extraUploadProps,
    attachmentExtButton,
  } = props;
  let defaultTypeCode = null;
  if (attachmentTypeList.length > 0) {
    for (let i in attachmentTypeList) {
      if (attachmentTypeList[i].isDefault === '1') {
        defaultTypeCode = attachmentTypeList[i].fileTypeCode;
        
      }
    }
  }
  const defaultField = {
    progressStatus: 'active',
    inputStatus: 'edit',
    buttonStatus: 'ok',
    fileTypeCode: attachmentTypeList.length > 0 ? defaultTypeCode == null ? attachmentTypeList[0].fileTypeCode : defaultTypeCode : '', //文件类型编码

    flowCode: flowCode,
  };
  const defaultBaseField = {
    businessCode: '', // 文件编码，可选
    fileName: '', // 文件名称，必填
    fileType: '', // 文件类型，必填
    storeType: 'arch', // 存储类型，必填  arch表示归档
    fileSize: '', // 文件大小，必填
    filepath: '', // 存贮路径，必填
    searchKey: '', //关联值，可选
    fileGroupFlag: attachmentPer.useFileGroupCode, // 附件域编码，必填
    fileGroupDescription: attachmentPer.useFileGroupName, // 附件域名称，必填
  };
  const msgText = ['空文件', '文件过大', '正常', '不支持上传此类型文件'];
  // 验证上传的文件类型
  const verifyFileType = filename => {
    if (!fileTypeWhiteList) {
      return false;
    }
    const index = filename.lastIndexOf('.');
    const filetype = filename.substring(index + 1, filename.length).toLowerCase();
    return fileTypeWhiteList.indexOf(filetype) !== -1;
  };
  /**
   * 验证上传文件大小
   * code： 0--表示空文件  1--表示文件过大    2：表示正常 3-表示文件类型不支持
   */
  const verifyFileSize = fileSize => {
    if (fileSize === 0) {
      return 0;
    }
    if (fileSize >= 1024 * 1024 * 30) {
      return 1;
    }
    return 2;
  };

  // 上传文件change事件的处理
  const handleUploadStatusChange = (uid, param) => {
    // 根据uid判断当前发生变化的是哪一个文件
    // 防止发生上传多个文件时  文件属性显示错误问题
    uploadFileList.forEach((item, index) => {
      // 如果uid相同  获取index  根据下标修改
      if (item.uid === uid) {
        uploadFileList[index] = { ...uploadFileList[index], ...param };
      }
    });
  };
  // 保存附件基本信息--将上传的附件保存在redux中，批量提交保存
  const saveFileList = fileList => {
    dispatch({
      type: 'saveAttachmentFileList',
      payload: fileList,
    });
  };

  // 添加一条附件信息
  const pushFileItem = fileItem => {
    dispatch({
      type: 'pushAttachmentFileItem',
      payload: { fileItem },
    });
  };
  const [uploadDis, setUploadDis] = useState(false)
  const uploadProps = {
    name: 'file',
    action: uploadUrl || '/api/eoafilegw/fileUpload',
    showUploadList: false,
    data: {
      type: 'FLOW_ATTACH_UPLOAD_U0001',
      storeType: 'arch', // arch--表示归档
      systemCode: systemId,
      flowCode: flowCode,
    },
    disabled: uploadDis,
    multiple: true,
    /**
     * 文件上传前
     * 对文件类型和文件大小进行校验
     * 校验通过后 根据file生成初始化的fileItem存入uploadFileList
     */
    beforeUpload(file, fileList) {
      setUploadDis(true)
      if (fileList.length > 1) {
        if (file['name'] === fileList[fileList.length - 1]['name']) {
          message.warn(`上传失败：暂不支持多文件上传，请选择一个文件后重试`);
          setUploadDis(false)
        }
        return false
      }

      // 多文件上传通过验证的文件
      let tempListVerify = [];
      // 多文件上传未通过验证的文件
      let tempListUnVerify = [];
      const { uid } = file;
      // 通过fileList判断时否为多文件上传
      // 优化fileList只执行一次
      if (fileList.length && fileList[fileList.length - 1].uid === file.uid) {
        // 循环遍历上传的多个文件  进行检查
        fileList.forEach(item => {
          let fileItem = { ...defaultField, uid, ...defaultBaseField };
          if (!verifyFileType(item.name)) {
            tempListUnVerify.push({
              ...fileItem,
              errorMsg: '不支持上传此类型文件',
              errorCode: 3,
              fileSize: item.size,
              uid: item.uid,
              fileName: item.name,
            });
            return false;
          }
          if (verifyFileSize(item.size) !== 2) {
            tempListUnVerify.push({
              ...fileItem,
              errorMsg: '',
              errorCode: verifyFileSize(item.size),
              fileSize: item.size,
              uid: item.uid,
              fileName: item.name,
            });
            return false;
          }
          tempListVerify.push({
            ...fileItem,
            fileSize: item.size,
            uid: item.uid,
            fileName: item.name,
          });
        });
        // 通过校验的文件
        if (tempListVerify.length) {
          saveFileList([...uploadFileList, ...tempListVerify]);
        }
        // 未通过校验返回提示信息
        if (tempListUnVerify.length) {
          let messageFileName = [];
          tempListUnVerify.forEach(items => {
            messageFileName.push(`${items.fileName}(${msgText[items.errorCode]})`);
          });
          message.warn(`上传失败：${messageFileName.join('、')}`);
          // setUploadDis(false)
        }
      }

      // 取消上传 校验失败的文件
      if (verifyFileSize(file.size) !== 2 || !verifyFileType(file.name)) {
        setUploadDis(false)
        return false;
      }
    },
    async onChange(info) {
      const { status, uid } = info.file;
      const { file } = info;
      // 当上传文件状态发生改变时  同步改变uploadFileList中对应部分
      handleUploadStatusChange(uid, { ...file });
      // 上传失败--改变progressStatus（进度条状态） 用来更新进度条UI
      if (status === 'error') {
        const error = info.file.response.error || '上传失败';
        const progressStatus = 'exception';
        handleUploadStatusChange(uid, { progressStatus });
        message.error(`${error}`);
        // 上传失败删除文件
        dispatch({
          type: 'deleteAttachmentFileList',
          payload: uid,
        })
        setUploadDis(false)
      }
      // 上传成功--改变progressStatus（进度条状态） 用来更新进度条UI
      if (status === 'done') {
        let progressStatus;
        let nowStatus = 'done';
        if (typeof extraUploadProps.beforeHandleSuccessResult == 'function') {
          info.file.response = extraUploadProps.beforeHandleSuccessResult(info.file.response);
        }
        const { Data, ErrMsg } = info.file.response;
        let DataMsg = Data ? Data[0] : {};
        if (Data) {
          progressStatus = 'success';
          // 将附件与流程绑定


          let res = await dispatch({
            type: 'saveAttachment',
            payload: {
              file: {
                businessCode: '',
                searchKey: '',
                fileName: DataMsg.FileName, // 文件名称，必填
                fileType: DataMsg.fileType, // 文件类型，必填
                storeType: 'arch', // 存储类型，必填  arch表示归档
                fileSize: DataMsg.fileSize, // 文件大小，必填
                filepath: DataMsg.filePath, // 存贮路径，必填
                fileGroupFlag: attachmentPer.useFileGroupCode, // 附件域编码，必填
                fileGroupDescription: attachmentPer.useFileGroupName, // 附件域名称，必填
                fileTypeCode: attachmentTypeList.length > 0 ? defaultTypeCode == null ? attachmentTypeList[0].fileTypeCode : defaultTypeCode : ''
              },
              uid: file.uid,
            },
          });
          if (!res.success) {
            setUploadDis(false)
            return false
          }
          DataMsg.FileName=res.Data.fileName;
        }
        if (!Data) {
          message.error(`${ErrMsg}`);
          progressStatus = 'exception';
          nowStatus = 'error';
          dispatch({
            type: 'deleteAttachmentFileList',
            payload: uid,
          })
          setUploadDis(false)
          return false
        }

        // if (!Data && State === 403) {
        //   // 会话不存在跳转登录
        // }
        handleUploadStatusChange(uid, {
          ...file,
          ...DataMsg,
          ErrMsg,
          progressStatus,
          status: nowStatus,
           fileName: DataMsg.FileName,
        });
        setUploadDis(false)
      }
      // 上传成功后再保存，防止进度条状态没有更新完成
      saveFileList([...uploadFileList])
    },
    ...extraUploadProps,  // 注入外部传入的属性
  };

  return (
    <>
      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <Icon type="inbox" theme="outlined" />
        </p>
        <p className="ant-upload-text">点击或将文件拖拽到这里上传</p>
        <p className="ant-upload-hint">{`支持拓展名:${fileTypeWhiteList}`}</p>
        <p className="ant-upload-hint">{`支持上传文件大小:30MB以内`}</p>
      </Dragger>
      <div style={{ marginTop: '12px' }}>
        <UploadTable
          dispatch={dispatch}
          saveFileList={saveFileList}
          handleUploadStatusChange={handleUploadStatusChange}
          uploadFileList={uploadFileList}
          verifyFileType={verifyFileType}
          attachmentTypeList={attachmentTypeList}
          attachmentExtButton={attachmentExtButton}
          fileTypeCode={attachmentTypeList.length > 0 ? defaultTypeCode == null ? attachmentTypeList[0].fileTypeCode : defaultTypeCode : null}
        />
      </div>
    </>
  );
};

export default AttachmentUpload;
