import React, { Component } from 'react';
import { Form, Table, message } from 'antd';

import Modal from '../../../components/DraggableModal';
import utils from '../../../utils/utils';
import '../../styles.less';
import { withFlowContext } from '../../LinkFlowContext';
import _ from 'lodash';

class FileCompareModal extends Component {
  state = { selectedRowKeys: [] };

  handleOk = () => {
    const { dispatch, attachmentList } = this.props;

    const { selectedRowKeys } = this.state;

    if (selectedRowKeys.length < 1) {
      message.warn('没有选中的附件！');
      return false;
    } else if (selectedRowKeys.length === 2) {
      const dispatchData = {};
      selectedRowKeys.forEach((id, index) => {
        for (let i = 0; i < attachmentList.length; i++) {
          if (attachmentList[i].id === id) {
            dispatchData[`filePath${index + 1}`] = `/attach${attachmentList[i].filepath}`;
            let fileName = attachmentList[i].fileName;
            dispatchData[`fileName${index + 1}`] =
              fileName.substring(fileName.lastIndexOf('.'), '') || '未命名文件';
            return false;
          }
        }
      });
      dispatch({
        type: `submitFileCompare`,
        payload: { dispatchData },
      });
    } else {
      message.warn('请选择两个附件进行对比！');
      return false;
    }
  };

  handleCancel = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'toggleFileCompareModal',
      payload: false,
    });
  };

  render() {
    const { fileCompareModalVisible, loadings, attachmentList } = this.props;

    const { selectedRowKeys } = this.state;
    const render = text => <span style={{ color: 'inherit' }}>{text}</span>;
    const columns = [
      {
        title: '附件名称',
        dataIndex: 'fileName',
        width: '55%',
        key: 'fileName',
        align: 'center',
        render,
      },
      {
        title: '附件类型',
        dataIndex: 'fileTypeName',
        width: '35%',
        key: 'fileTypeName',
        align: 'center',
        render,
      },
    ];
    const rightData = [];
    const rowSelection = {
      selectedRowKeys: selectedRowKeys,
      onChange: (selectedRowKeys, selectedRows) => {
        if (selectedRowKeys.length <= 2) {
          this.setState({
            selectedRowKeys: [...selectedRowKeys],
          });
        }
      },
      getCheckboxProps: record => ({
        disabled:
          record.fileType === 'xlsx' ||
          record.fileType === 'xls' ||
          record.fileType === 'ppt' ||
          record.fileType === 'rar' ||
          record.fileType === 'zip',
      }),
    };

    return (
      <Modal
        title="文件对比（请选择两个文件进行比较）"
        width={800}
        visible={fileCompareModalVisible}
        confirmLoading={loadings['submitFileCompare']}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
        centered
        className={utils.getClassName('modal', this.props)}
        bodyStyle={{ padding: '10px ' }}
      >
        <div style={{fontSize:'16px',opacity:.5}}>注: 可上传文件格式为：pdf,doc,docx,txt,jpg,jpeg,png,tif,tiff</div>
        <Table
          size="small"
          columns={columns}
          bordered={true}
          dataSource={attachmentList}
          rowSelection={{
            type: 'checkbox',
            ...rowSelection,
          }}
        />
      </Modal>
    );
  }
}

export default Form.create()(
  withFlowContext(FileCompareModal, [
    'fileCompareModalVisible',
    'piid',
    'tiid',
    'instFlowTodoPersonList',
    'loadings',
    'todoTitle',
    'attachmentList',
    'uploadFileList',
  ]),
);
