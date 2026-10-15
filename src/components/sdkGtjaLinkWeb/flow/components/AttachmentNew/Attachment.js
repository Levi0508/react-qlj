import React, { useState, useEffect } from 'react'
import { Card, Alert } from 'antd'
import styles from './style.less'
import { withFlowContext } from '../../LinkFlowContext';

import AttachmentUpload from './AttachmentUpload'
import AttachmentView from './AttachmentView'

const AttachmentNew = props => {

  const { personType, attachmentPer, dispatch, flowProps, contentType } = props;
  let { attachmentList } = props;
  // const { viewFileGroupCode } = props.attachmentPer;

  // 获取附件域权限配置
  // const getAttachmentPer = () => {
  //   dispatch({
  //     type: `fetchAttachmentPer`,
  //   });
  // }
  // //  获取附件列表信息
  // const getAttachmentList = () => {
  //   dispatch({
  //     type: `fetchAttachmentList`,
  //   });
  // }

  // const getAttachmentTypeList = () => {
  //   dispatch({
  //     type: `fetchAttachmentTypeList`,
  //   });
  // };
  // const showPerList = viewFileGroupCode ? viewFileGroupCode.split(',') : [];
  // // 当前环节显示的附件域
  // const showAttachmentList =
  //   showPerList.length >= 1
  //     ? attachmentList.filter(item => showPerList.includes(item.fileGroupFlag))
  //     : [];
  // 0 起草 1待办 contentType:print为打印模式

  const isUpload = (!contentType || contentType !== "print") && (personType === '0' || personType === '1') ? true : false;
  const isPluggable = (attachmentPer && attachmentPer.pluggable == '1') ? true : false;

  // compoentDidMount
  // useEffect(()=>{
  //   getAttachmentPer();
  //   getAttachmentTypeList();
  // }, [])
  return (
    <>
      <div style={props.style} className={styles.attachment_new}>
        {
         !attachmentList.length>=1 && <div style={{margin:'15px 0',textAlign:'center'}}>
             <Alert message="暂无附件" type="info" />
          </div>
        }
        {/* !isBeforeDraft && attachmentPer.pluggable === '1'  &&  */}
        {
          (isUpload && isPluggable) ? <Card bodyStyle={{ padding: '10px 15px 0' }}>
            <AttachmentUpload {...props} extraUploadProps={flowProps.extraUploadProps} />
          </Card> : null
        }
        {
          attachmentList.length >= 1 && <Card bodyStyle={{ padding: '10px 15px' }} style={isUpload && isPluggable ? { marginTop: '15px' } : null}>
            <AttachmentView {...props} />
          </Card>
        }
      </div>

    </>
  )
}

export default withFlowContext(AttachmentNew,
  ['flowVer',
    'flowProps',
    'uploadUrl',
    'attachmentPer',
    'attachmentList',
    'tiid',
    'piid',
    'flowCode',
    'fileTypeWhiteList',
    'uploadFileList',
    'personType',
    'systemId',
    'attachmentTypeList',
    'contentType',
    'attachmentExtButton',
    'attachmentSortList'
  ])
