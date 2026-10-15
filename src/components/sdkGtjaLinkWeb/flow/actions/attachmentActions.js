import * as flowServices from '../../services/flow/flow';
import { message } from 'antd';

import fileUtils from '../components/AttachmentNew/utils';


const attachmentActions = {
  /**
   * 校验附件域
   * 如成功则返回true，失败则返回错误信息字符串
   */
  async checkAttachment({ payload }, { getState, setState, dispatch }) {
    const { uploadFileList, attachmentPer, attachmentList } = getState();
    const { fileTypeCode } = attachmentPer;
    // 提交前的数据验证  判断所有的附件是否是都上传成功了
    const verifyFileList = uploadFileList => uploadFileList.every(item => item.status === 'done');
    // 是否必须上传
    const mustUpload = () => (attachmentPer.notnull === '1' ? true : false);
    // 必须上传的类型
    const mustTypeUpload = () => {
      const nowFlagForm = uploadFileList.map(item => item.fileTypeCode);
      const nowFlagList =
        attachmentList.length >= 1 ? attachmentList.map(item => item.fileTypeCode) : [];
      const nowFlag = nowFlagList.concat(nowFlagForm);
      const mustFlag = fileTypeCode ? fileTypeCode.split(',') : [];
      if (!mustFlag) return true;
      return mustFlag.every(item => nowFlag.includes(item));
    };

    if (!verifyFileList(uploadFileList)) {
      return '有附件上传失败，请删除后重新上传';
    }

    // if (mustUpload() && !mustTypeUpload()) {
    //   return `上传的文件中必须包含类型为${fileTypeCode}的文件`;
    // }
    return true;
  },
  /**
   * 附件删除--列表区
   */
  async deleteAttachment({ payload }, { getState, setState, dispatch }) {
    const { piid, tiid } = getState();
    const { id } = payload;
    const result = await flowServices.deleteAttachmentFile({ piid, tiid, id });
    if (result.Data) {
      await dispatch({
        type: `fetchAttachmentList`,
      });
      message.success('删除成功!');
    } else {
      message.error(result.ErrMsg);
    }
    return result;
  },

  /**
   * 附件删除--上传区
   */
  async deleteFormAttachment({ payload }, { getState, setState, dispatch }) {
    const { piid, tiid } = getState();
    const { id } = payload;
    let { uploadFileList, attachmentList } = getState();
    const result = await flowServices.deleteAttachmentFile({ piid, tiid, id });
    if (result.Data) {
      uploadFileList = uploadFileList.filter(f => f.id !== id);
      attachmentList = attachmentList.filter(f => f.id !== id);
      setState({
        uploadFileList,
        attachmentList,
        fileTotal: attachmentList.length
      });
      message.success('删除成功!');
    } else {
      message.error(result.ErrMsg);
    }
  },
  /**
   * 附件信息修改
   */
  async updateAttachment({ payload }, { getState, setState, dispatch }) {
    const { piid, tiid } = getState();
    const file = payload;
    const result = await flowServices.updateAttachment({ piid, tiid, file });
    if (result.Data) {
      // 需要修改列表
      message.success('修改成功!');
    } else {
      message.error(result.ErrMsg);
    }
  },

  /*
   * 保存附件信息
   */
  async saveAttachment({ payload }, { getState, setState, dispatch }) {
    let { piid, tiid, attachmentTypeList } = getState();
    const { file, uid } = payload;
    if (!piid) {
      let draft = await dispatch('draft')
      if (draft) {
        piid = getState().piid
        tiid = getState().tiid
      }
    }
    let result = await flowServices.saveAttachment({
      piid,
      tiid,
      file,
    });
    let { uploadFileList } = getState()
    if (result.Data) {
      const { id } = result.Data;
      const tempList = uploadFileList.map(item => {
        if (item.uid === uid) item.id = id
        if (file.fileTypeCode) item.fileTypeCode = file.fileTypeCode;
        return item;
      });
      message.success('附件保存成功!');
      await dispatch({
        type: 'saveAttachmentFileList',
        payload: tempList,
      });
    } else {
      // 删除保存失败的附件
      message.error(result.ErrMsg);
      await dispatch({
        type: 'deleteAttachmentFileList',
        payload: uid,
      });
    }
    return result;
  },

  /**
   * 执行下载文件
   */
  downloadFile: ({ payload }, { getState, setState, dispatch }) => {
    const { filePath, fileName } = payload || {};
    const downloadUrl = getState('downloadUrl');
    fileUtils.download(`${downloadUrl || '/attach'}${filePath}`, fileName);
  },

  /**
   * 删除上传/保存失败的附件
   */
  async deleteAttachmentFileList({ payload }, { getState, setState, dispatch }) {
    const deleteAttachmentUid = payload;
    let uploadFileList = getState('uploadFileList') || [];
    return setState({
      uploadFileList: uploadFileList.filter(item => item.uid !== deleteAttachmentUid),
    });
  },
};

export default attachmentActions;
