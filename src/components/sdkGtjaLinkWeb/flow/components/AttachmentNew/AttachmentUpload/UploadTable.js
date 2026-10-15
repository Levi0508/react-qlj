import React, { useEffect, useState } from 'react';
import { Input, Button, Select, Upload, message, Modal, Icon, Popconfirm, InputNumber, Radio, Checkbox, Table } from 'antd';
const { Option } = Select;
const { confirm } = Modal;

import utils from '../../../../utils/utils';
import FileNameContent from './FileNameContent';
import './styles.less';

const UploadTable = props => {
  const {
    dispatch,
    uploadFileList,
    attachmentTypeList,
    attachmentExtButton = [],
    printCount, // 打印份数
    isStamp,  // 是否盖章
    sendType  // 邮寄/打印
  } = props;


  const handleClickInput = (value, type, record) => {
    record[type] = value;
    let { id, fileTypeCode, fileTypeDesc, fileTypeName, printCount, isStamp, sendType, fileName, fileDesc } = record;
    let file = Object.assign({}, { id, fileTypeCode, fileTypeDesc, fileTypeName, printCount, isStamp, sendType, fileName, fileDesc });
    dispatch({
      type: 'updateAttachment',
      payload: file,
    });
  };
  // 删除已上传的文件
  const handleDelete = (record) => {
    if (record.id) {
      // 如果有id  说明和piid绑定
      dispatch({
        type: 'deleteFormAttachment',
        payload: {
          id: record.id,
        },
      });
    }
  };
  //11-3start
  const columns = [
    {
      title: '附件名称',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 240,
      ellipsis: true, //防止名称过长
      render: (text, record) => (<FileNameContent {...record} />)
    },
    {
      title: '附件描述',
      dataIndex: 'fileDesc',
      key: 'fileDesc',
      width: 220,
      render: (text, record) => (
        <Input
          onChange={value => record.fileDesc = value}
          onBlur={e => { if (e.target.value === "") handleClickInput(null, 'fileDesc', record); else handleClickInput(e.target.value, 'fileDesc', record) }}
          defaultValue={record.fileDesc}
          style={{ width: 'calc(100% - 20px)', textOverflow: 'ellipsis' }}
          placeholder="请输入附件描述"
        />
      )
    },
    {
      title: '附件类型',
      dataIndex: 'fileTypeName',
      key: 'fileTypeName',
      align: 'center',
      width: 130,
      render: (text, record) => (
        <div>
          <Select
            defaultValue={record.fileTypeCode}
            dropdownMatchSelectWidth={false}
            onChange={value => handleClickInput(value, 'fileTypeCode', record)}
            style={{ width: 'calc(100%)' }}
          >
            {attachmentTypeList.map(item => (
              <Option key={item.id} value={item.fileTypeCode}>
                {item.fileTypeDesc}
              </Option>
            ))}
          </Select>
        </div>
      )
    },
    {
      title: '操作',
      dataIndex: 'options',
      align: 'center',
      key: 'x',
      width: 80,
      render: (text, record) => (
        <Popconfirm title="将要删除这条记录，是否继续?" onConfirm={() => handleDelete(record)}>
          <a style={{ color: 'red' }}>删除</a>
        </Popconfirm>
      )
    }
  ];
  if (attachmentExtButton.length > 0) {
    columns.splice(columns.length-1, 0, {
      title: '附加信息',
      dataIndex: '',
      align: 'center',
      width: attachmentExtButton.length * 140,
      render: (text, record) => (
        attachmentExtButton.length > 0 ?
          (<div>


            <div style={attachmentExtButton.includes('printCount') ? { display: 'inline-block',marginRight:'7px' } : { display: 'none' }}>
              <span>用印份数：</span>
              <InputNumber
                onChange={value => { record.printCount = value }}
                onBlur={e => { if (e.target.value === "") handleClickInput(null, 'printCount', record); else handleClickInput(parseInt(e.target.value), 'printCount', record) }}
                defaultValue={printCount}
                min={0}
                style={{ width: '50px' }}
              />
            </div>

            {/* <div style={attachmentExtButton.includes('sendType') ? { display: 'inline-block' } : { display: 'none' }}>
              <Radio.Group onChange={(e) => { handleClickInput(e.target.value, 'sendType', record) }} defaultValue={sendType}>
                <Radio value={0}>邮寄</Radio>
                <Radio value={1}>打印</Radio>
              </Radio.Group>
            </div> */}

            
            <div style={attachmentExtButton.includes('isStamp') ? { display: 'inline-block' } : { display: 'none' }}>
              <Radio.Group onChange={(e) => { handleClickInput(e.target.value, 'isStamp', record) }} defaultValue={isStamp}>
                <Radio value={0}>未盖章</Radio>
                <Radio value={1}>已盖章</Radio>
              </Radio.Group>
            </div>

            {/* <div style={attachmentExtButton.includes('isStamp') ? { display: 'inline-block' } : { display: 'none' }}>
              <Checkbox
                defaultChecked={isStamp > 0 ? true : false} onChange={e => { handleClickInput(e.target.checked ? 1 : 0, 'isStamp', record) }}>已盖章</Checkbox>
            </div> */}
          </div >) :
          <></>
      )
    })
  }



  return (
    <>
      {
        uploadFileList.length >= 1 ?
          <Table
            showHeader={true}
            pagination={false}
            bordered
            columns={columns}
            dataSource={uploadFileList}
            className={utils.getClassName('attachment_view', props)}
          /> : <></>
      }
    </>
  );
};

export default UploadTable;
