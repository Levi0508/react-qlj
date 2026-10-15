import React, { useEffect, useState } from 'react';
import { Row, Col, Input, Button, Select, Upload, message, Modal, Icon, Popconfirm, InputNumber, Radio, Checkbox } from 'antd';

import utils from '../../../../utils/utils';
import FileNameContent from './FileNameContent';
import './styles.less';

const { Option } = Select;
const { confirm } = Modal;

const UploadItem = props => {
  const {
    id,
    dispatch,
    fileName,
    index,
    buttonStatus,
    uploadFileList,
    saveFileList,
    fileTypeCode,
    attachmentTypeList,
    attachmentExtButton=[],
    printCount, // 打印份数
    isStamp,  // 是否盖章
    sendType  // 邮寄/打印
  } = props;
  const [defaultValue, setDefaultValue] = useState(null);
  const handleChange = (value, type) => {
    uploadFileList[index][type] = value;
    saveFileList([...uploadFileList]);
  };
  const handleClickInput = (value, type) => {
    // 如果是确定  保存输入的值并切换按钮的status
    // uploadFileList[index].buttonStatus = buttonStatus === 'ok' ? 'update' : 'ok'
    uploadFileList[index][type] = value;
    saveFileList([...uploadFileList]);
    let { id, fileName, fileTypeCode, printCount, isStamp, sendType } = uploadFileList[index];
    if (!id) {
      message.warn('附件上传失败或未保存成功,无法修改!');
      return;
    }
    let file = Object.assign({}, { id, fileName, fileTypeCode, printCount, isStamp, sendType });
    dispatch({
      type: 'updateAttachment',
      payload: file,
    });
  };
  // 删除已上传的文件
  const handleDelete = () => {
    if (id) {
      // 如果有id  说明和piid绑定
      dispatch({
        type: 'deleteFormAttachment',
        payload: {
          id,
        },
      });
    }
  };
  const optionType = attachmentTypeList.map(item => (
    <Option key={item.id} value={item.fileTypeCode}>
      {item.fileTypeDesc}
    </Option>
  ));
  useEffect(() => {
    if (fileTypeCode) {
      setDefaultValue(fileTypeCode);
    } else {
      attachmentTypeList.length > 0 ? setDefaultValue(attachmentTypeList[0].fileTypeCode) : null;
    }
  }, [uploadFileList, fileTypeCode, attachmentTypeList]);
  return (
    <>
      <Row gutter={[16, 24]}>
        <Col span={attachmentExtButton.length > 0 ? 5 : 8}>
          <FileNameContent {...props} />
        </Col>
        <Col span={attachmentExtButton.length > 0 ? 5 : 8}>
          {/* 附件描述 */}
          <span style={{ paddingRight: '20px' }}>附件描述:</span>
          {buttonStatus === 'update' ? (
            <span className={utils.getClassName('description_text', props)}>{fileName}</span>
          ) : (
            <Input
              onChange={e => handleChange(e.target.value, 'fileName')}
              onBlur={e => handleClickInput(e.target.value, 'fileName')}
              value={fileName}
              style={{ width: 'calc(100% - 90px)' }}
              placeholder="请输入附件描述"
            />
          )}
        </Col>
        <Col span={4}>
          <span style={{ paddingRight: '20px' }}>类型:</span>
          {/* 附件类型 */}
          <Select
            defaultValue={defaultValue}
            key={defaultValue}
            onChange={value => handleClickInput(value, 'fileTypeCode')}
            style={{ width: 'calc(100% - 55px)' }}
          >
            {optionType}
          </Select>
        </Col>
        <Col span={attachmentExtButton.length > 0 ? 8 : 0} style={attachmentExtButton.length > 0 ? {} : { display: 'none' }}>
          <div style={attachmentExtButton.includes('printCount') ? { display: 'inline-block', marginRight: '7px' } : { display: 'none' }}>
            <span>拟印份数：</span>
            <InputNumber
              onChange={value => handleChange(value, 'printCount')}
              onBlur={e => {if(e.target.value === "") handleClickInput(null, 'printCount'); else handleClickInput(parseInt(e.target.value), 'printCount')}}
              value={printCount}
              min={0}
              style={{ width: '50px' }}
            />
          </div>

          <div style={attachmentExtButton.includes('sendType') ? { display: 'inline-block' } : { display: 'none' }}>
            <Radio.Group onChange={(e) => { handleClickInput(e.target.value, 'sendType') }} value={sendType}>
              <Radio value={0}>邮寄</Radio>
              <Radio value={1}>打印</Radio>
            </Radio.Group>
          </div>
          <Checkbox style={attachmentExtButton.includes('isStamp') ?  { display: 'inline-block' } : { display: 'none' }}
            onChange={(e) => handleClickInput(e.target.checked ? 1 : 0, 'isStamp')} >是否已盖章</Checkbox>
        </Col>
        <Col span={2}>
          {/* 操作按钮 */}
          <Popconfirm title="将要删除这条记录，是否继续?" onConfirm={handleDelete}>
            <Button type="link" info="true">
              删除
            </Button>
          </Popconfirm>
        </Col>
      </Row>
    </>
  );
};

export default UploadItem;
