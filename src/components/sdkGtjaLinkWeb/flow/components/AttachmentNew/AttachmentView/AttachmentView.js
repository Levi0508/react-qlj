import React, { useState, useEffect } from 'react';
import { Alert, Button, Icon, Popconfirm, message, InputNumber, Radio, Checkbox, Input, Select } from 'antd';
const { Option } = Select;
import utils from '../../../../utils/utils';
import './styles.less';
import { GroupTable } from './GroupTable';

import fileUtils from '../utils';
import { Base64 } from 'js-base64';


const WrapAlert = props => {
  return (
    <>
      <div className={props.className}>
        <Alert {...props} />
        {props.children}
      </div>
    </>
  );
};

const AttachmentView = props => {
  let {
    attachmentList,
    contentType,
    attachmentExtButton = [],
    systemId,
    piid,
    tiid,
  } = props;
  const {
    dispatch,
    listFilter, // 从attachmentList中筛选满足条件的附件列表
    attachmentTypeList,
    attachmentSortList
  } = props;
  if (typeof listFilter === 'function') {
    attachmentList = attachmentList.filter(listFilter) || []; // 筛选显示的附件列表
  }


  let areaGroupList = [];
  attachmentList.forEach(items => {
    if (!areaGroupList.includes(items.fileGroupDescription))
      areaGroupList.push(items.fileGroupDescription);
  });
  const formatTableList = list => {
    let tabList = [];
    const sortList = [];
    if (Array.isArray(attachmentSortList) && attachmentSortList.length > 0) {
      // 有排序配置时按照fileTypeCode的排序来对附件列表排序
      for (let i of attachmentSortList) {
        for (let j of attachmentList) {
          if (_.lowerCase(i.FILE_TYPE_CODE) === _.lowerCase(j.fileTypeCode)) {
            sortList.push(j)
          }
        }
      }
    } else {
      // 没有排序配置时直接取附件列表
      sortList.push(...attachmentList);
    }
    (list || []).forEach((item, index) => {
      let fatherTree = {
        key: item,
        group: item,
        groupName: item,
        children: [],
      };
      sortList.forEach((itemes, indexes) => {
        // 将同一个域的放入一个数组
        itemes.key = itemes.id;
        if (item === itemes.fileGroupDescription) {
          const tindex = fatherTree.children.findIndex(fc => _.lowerCase(fc.fileTypeCode) === _.lowerCase(itemes.fileTypeCode)); //运维附件类型大小写问题
          if (tindex >= 0) {
            fatherTree.children[tindex].children.push(itemes);
          } else {
            fatherTree.children.push({ key: itemes.fileTypeName, fileTypeCode: itemes.fileTypeCode, fileTypeName: itemes.fileTypeName, children: [itemes] });
          }
        }
      });
      if (fatherTree.children.length >= 1) {
        tabList.push(fatherTree);
      }
    });
    return tabList;
  };
  const showGroupAttachmentTree = attachmentList.length >= 1 ? formatTableList(areaGroupList) : [];
  // 选中的文件keys
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  // 选中的文件
  const [selectedRows, setSelectedRows] = useState([]);

  const msg = `已选择${selectedRowKeys.length}项`;
  // 附件合计大小
  const [sumSize, setSumSize] = useState(0);
  const [disFileCompareBtn, setDisFileCompareBtn] = useState(true)
  const rowSelection = {
    selectedRowKeys: selectedRowKeys,
    columnWidth: '30px',
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys([...selectedRowKeys]);
      setSelectedRows([...selectedRows]);
      if (selectedRowKeys.length === 1) {
        setDisFileCompareBtn(false)
      } else {
        setDisFileCompareBtn(true)
      }
    },
  };
  const columns = [
    {
      title: 'fileName',
      dataIndex: 'fileName',
      // width: 267,
      width: attachmentExtButton.length > 0 ? (350 / attachmentExtButton.length) : 450,
      // ellipsis: true,
      render: (text, record) => (<a onClick={() => handleDownloadFile(record.filepath, record.fileName)}>{text}</a>),
    },
    {
      title: 'fileDesc',
      dataIndex: 'fileDesc',
      width: 130,
      ellipsis: true,
      render: (text, record) => (
        <>
          {record.canDelete === 1 && (!contentType || contentType !== "print") ? (
            <Input
              onChange={value => { record.fileDesc = value }}
              onBlur={e => { if (e.target.value === "") handleClickInput(null, 'fileDesc', record); else handleClickInput(e.target.value, 'fileDesc', record) }}
              defaultValue={record.fileDesc}
              disabled={record.canDelete !== 1}
              min={0}
              style={{ width: 'calc(100%)', textOverflow: 'ellipsis' }}
              placeholder='请输入附件描述'
            />
          ) : text}
        </>
      )
    },
    {
      title: '附件类型',
      dataIndex: 'fileTypeName',
      key: 'fileTypeName',
      align: 'center',
      width: 130,
      render: (text, record) => (
        <>
          {record.canDelete === 1 && (!contentType || contentType !== "print") ? (
            <div>
              <Select
                labelInValue
                dropdownMatchSelectWidth={false}
                defaultValue={{ label: record.fileTypeName, key: record.fileTypeCode }}
                onChange={value => handleClickInput(value, 'fileTypeCode', record)}
                style={{ width: 'calc(100%)' }}
              >
                {attachmentTypeList.map(item => (
                  <Option key={item.id} value={item.fileTypeCode}>
                    {item.fileTypeDesc}
                  </Option>
                ))}
              </Select>
            </div>) : text}
        </>
      )
    },
    {
      title: 'fileSize',
      dataIndex: 'fileSize',
      align: 'center',
      // width: 121,
      width: 80,
      render: text => {
        let sizeKb = text / 1024;
        if (sizeKb < 1024) {
          return `${sizeKb.toFixed(1)}KB`;
        } else {
          return `${(sizeKb / 1024).toFixed(1)}MB`;
        }
      }
    },
    {
      title: 'createTime',
      dataIndex: 'createTime',
      align: 'center',
      // width: 230,
      width: 110,
      render: text => fileUtils.formatDate(text),
    },
    {
      title: 'createUserName',
      dataIndex: 'createUserName',
      align: 'center',
      // width: 160,
      width: 80
    },
  ];

  if ((!contentType || contentType !== "print")) {
    columns.push({
      title: '操作',
      dataIndex: '',
      align: 'center',
      // width: 100,
      width: 65,
      key: 'x',
      render: (text, record) => (
        <span>
          { record.canDelete === 1 ? (
            <Popconfirm title="将要删除这条记录，是否继续?" onConfirm={() => handleDeleteFile(record)}>
              <a style={{ color: 'red' }}>删除</a>
            </Popconfirm>
          ) : (
            (record.pdfFlag === '1' || record.fileType === 'pdf') ?
              <a style={{ color: '#0962c1' }} onClick={() => openView(record)}>预览</a>
              :
              (record.fileType === 'jpg' || record.fileType === 'jpeg' || record.fileType === 'png') ?
                <><img data-original={`/attach${record.filepath}`} style={{ display: "none" }}></img><a style={{ color: '#0962c1' }} onClick={() => openView(record)}>预览</a></>
                :
                null
          )}
        </span>
      ),
    })
  }

  if (attachmentExtButton.length > 0) {
    columns.splice(columns.length - 1, 0, {
      title: '附加信息',
      dataIndex: '',
      align: 'center',
      // width: attachmentExtButton.length * 200,
      width: attachmentExtButton.length * 145,
      render: (text, record) => (
        attachmentExtButton.length > 0 ?
          (<div>

            <div style={attachmentExtButton.includes('printCount') ? { display: 'inline-block', marginRight: '7px' } : { display: 'none' }}>
              <span>用印份数：</span>
              <InputNumber
                onChange={value => { record.printCount = value }}
                onBlur={e => { if (e.target.value === "") handleClickInput(null, 'printCount', record); else handleClickInput(parseInt(e.target.value), 'printCount', record) }}
                defaultValue={record.printCount}
                disabled={record.modifyOthers !== 1}
                min={0}
                style={{ width: '50px' }}
              />
            </div>

            {/* <div style={attachmentExtButton.includes('sendType') ? { display: 'inline-block' } : { display: 'none' }}>
              <Radio.Group disabled={record.modifyOthers !== 1} onChange={(e) => { handleClickInput(e.target.value, 'sendType', record) }} defaultValue={record.sendType}>
                <Radio value={0}>邮寄</Radio>
                <Radio value={1}>打印</Radio>
              </Radio.Group>
            </div> */}

            <div style={attachmentExtButton.includes('isStamp') ? { display: 'inline-block' } : { display: 'none' }}>
              <Radio.Group disabled={record.modifyOthers !== 1} onChange={(e) => { handleClickInput(e.target.value, 'isStamp', record) }} defaultValue={record.isStamp}>
                <Radio value={0}>未盖章</Radio>
                <Radio value={1}>已盖章</Radio>
              </Radio.Group>
            </div>

            {/* <div style={attachmentExtButton.includes('isStamp') ? { display: 'inline-block' } : { display: 'none' }}>
              <Checkbox disabled={record.modifyOthers !== 1}
                defaultChecked={record.isStamp > 0 ? true : false} onChange={e => { handleClickInput(e.target.checked ? 1 : 0, 'isStamp', record) }}>已盖章</Checkbox>
            </div> */}
          </div>) :
          <></>
      )
    })
  }

  const clearSelectedRows = () => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
  };

  const getSumBytes = attachmentList => {
    let sumSize = 0;
    if (!attachmentList.length > 0) return 0;
    attachmentList.forEach(item => {
      sumSize += item.fileSize;
    });
    return sumSize;
  };
  const handleDownloadFile = (filePath, fileName) => {
    dispatch({
      type: 'downloadFile',
      payload: {
        filePath,
        fileName
      }
    });
  };
  const handleClickInput = (value, type, record) => {
    if (typeof (value) === 'object') {
      record[type] = value.key;
      record.fileTypeName = value.label;
    } else {
      record[type] = value;
    }
    let { id, fileName, fileTypeCode, printCount, isStamp, sendType, fileDesc, fileTypeName } = record;
    let file = Object.assign({}, { id, fileName, fileTypeCode, printCount, isStamp, sendType, fileDesc, fileTypeName });
    dispatch({
      type: 'updateAttachment',
      payload: file,
    });
  };
  const handleDeleteFile = record => {
    if (record.canDelete === 1) {
      dispatch({
        type: 'deleteAttachment',
        payload: {
          id: record.id,
        },
      });
      return false;
    }
    message.warn('您没有删除这条记录的权限!');
  };
  const handleManyFile = async (fileList) => {
    if (fileList.length < 1) {
      message.warn('没有可下载的附件！');
      return false;
    }
    for (let item of fileList) {
      await new Promise(resolve =>
        setTimeout(() => { resolve(handleDownloadFile(item.filepath, item.fileName || '未命名文件')) }, 200)
      )
    }
  };
  const compareFile = (fileKeyList, fileList, type) => {
    let selectedRowKeys = fileKeyList;
    if (selectedRowKeys.length < 1) {
      message.warn('没有选中的附件！');
      return false;
    }
    for (let item of fileList) {
      if (
        item.fileType === 'xlsx' ||
        item.fileType === 'xls' ||
        item.fileType === 'ppt' ||
        item.fileType === 'rar' ||
        item.fileType === 'zip'
      ) {
        message.warn('可对比文件格式为：pdf,doc,docx,txt,jpg,jpeg,png,tif,tiff');
        return false;
      }
    }
    if (type === 'local') {
      dispatchFiles(selectedRowKeys);
    } else {
      if (selectedRowKeys.length === 2) {
        dispatchFiles(selectedRowKeys);
      } else {
        message.warn('请选择两个附件进行对比！');
        return false;
      }
    }
  }

  const dispatchFiles = (selectFileKeys) => {
    let dispatchData = {};
    let filePath = '';
    let base64File = null;
    selectFileKeys.forEach((id, index) => {
      for (let i = 0; i < attachmentList.length; i++) {
        if (attachmentList[i].id === id) {
          let fileName = attachmentList[i].fileName;
          if (selectFileKeys.length > 1) {
            dispatchData[`filePath${index + 1}`] = `/attach${attachmentList[i].filepath}`;
            dispatchData[`fileName${index + 1}`] = fileName.substring(fileName.lastIndexOf('.'), '')|| '未命名文件';
            dispatchData[`fileSource${index + 1}`] = 'attachment';
          } else {
            filePath = `流程附件-${fileName.substring(fileName.lastIndexOf('.'), '')};/attach${attachmentList[i].filepath}`;
          }
          return false;
        }
      }
    });

    if (selectFileKeys.length > 1) {
      dispatch({
        type: `submitFileCompare`,
        payload: {dispatchData} ,
      });
    } else {
      base64File = Base64.encode(filePath);
      base64File && window.open(`/manage/filecompare.html?menuId=2000083060&menuindex=32&filepath=${base64File}`);
    }
  }

  const downSelectedFiles = async (fileIdList) => {
    if (fileIdList.length < 1) {
      message.warn('没有选中的附件！');
      return false;
    }
    for (let id of fileIdList) {
      for (let i = 0; i < attachmentList.length; i++) {
        if (attachmentList[i].id === id) {
          await new Promise(resolve =>
            setTimeout(() => { resolve(handleDownloadFile(attachmentList[i].filepath, attachmentList[i].fileName || '未命名文件')) }, 200)
          )
        }
      }
    }
  };
  const openView = record => {
    const { id, fileType } = record;
    if (fileType === "jpg" || fileType === "jpeg" || fileType === "png") {

      const index = _.findIndex(document.getElementsByClassName('gtja-link-tabs_attachment')[0].querySelectorAll('img'), i => {
        return i.dataset.original === `/attach${record.filepath}`;
      });

      if (!window.Viewer) {
        var loadStyle = function (url) {
          var link = document.createElement('link');
          link.rel = "stylesheet";
          link.type = "text/css";
          link.href = url;
          var head = document.getElementsByTagName("head")[0];
          head.appendChild(link);
        };

        // css加载
        loadStyle('/thirdlib/viewerjs/viewer.min.css');


        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = '/thirdlib/viewerjs/viewer.min.js';
        script.addEventListener("load", () => {
          window["viewer"] = new Viewer(document.getElementsByClassName('gtja-link-tabs_attachment')[0], {
            url: 'data-original'
          });

          if (index >= 0) {
            window["viewer"].index = index;
          }
          window["viewer"].show();
        });
        document.head.appendChild(script);
      } else {
        if (!window["viewer"]) {
          window["viewer"] = new Viewer(document.getElementsByClassName('gtja-link-tabs_attachment')[0], {
            url: 'data-original'
          });
        }

        if (index >= 0) {
          window["viewer"].index = index;
        }
        viewer.show();
      }
    } else {
      const path = `/flowweb/pdfview?source=flowweb&systemId=${systemId}&piid=${piid}&tiid=${tiid}&id=${id}`;
      window.open(path);
    }
  }
  useEffect(() => {
    setSumSize(fileUtils.getSumSize(getSumBytes(attachmentList)));
  });
  return (
    <>
      {(!contentType || contentType !== "print")
        ?
        <div className={utils.getClassName('title', props)}>

          {<span style={{ marginRight: '15px' }}>附件</span>}
          {attachmentList.length > 0 && (
            <span style={{ marginRight: '15px' }}>共{attachmentList.length}个文件</span>
          )}
          {attachmentList.length > 0 && <span>总计{sumSize}</span>}

          <Button
            onClick={() => handleManyFile(attachmentList)}
            style={{ float: 'right' }}
            type="primary"
          >
            <Icon type="download" theme="outlined" />
            下载全部
        </Button>
          <Button
            onClick={() => downSelectedFiles(selectedRowKeys)}
            style={{ float: 'right', marginRight: '15px' }}
          >
            下载选中文件
        </Button>
          <WrapAlert className={utils.getClassName('wrapAlert', props)} message={msg} type="info" showIcon>
            <Button
              onClick={clearSelectedRows}
              style={{ position: 'absolute', top: '0', left: '110px' }}
              type="link"
              info="true"
            >
              清空
          </Button>
          </WrapAlert>
          <Button
            disabled={disFileCompareBtn}
            onClick={() => compareFile(selectedRowKeys, selectedRows, 'local')}
            style={{ float: 'right', marginRight: '15px' }}
            type="primary"
          >
            <Icon type="diff" theme="outlined" />
            本地附件对比
        </Button>
          <Button
            disabled={!disFileCompareBtn}
            onClick={() => compareFile(selectedRowKeys, selectedRows)}
            style={{ float: 'right', marginRight: '15px' }}
            type="primary"
          >
            <Icon type="diff" theme="outlined" />
            附件对比
        </Button>

        </div>
        :
        null
      }
      {showGroupAttachmentTree.length >= 1
        ? showGroupAttachmentTree.map(item => (
          item.children.map(citem => (

            <GroupTable
              key={item.key}
              title={citem.fileTypeName}
              columns={columns}
              dataSource={citem.children}
              contentType={contentType}
              rowSelection={{
                type: 'checkbox',
                ...rowSelection,
              }}
            />

          ))
        ))
        : null
      }
    </>
  );
};

export default AttachmentView;
