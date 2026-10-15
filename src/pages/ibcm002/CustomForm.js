import React, { useState, useEffect } from 'react';
import Form from '@/components/IbFlowForm';
import { Input, Tooltip, Row, Col, DatePicker, Select, Table, Tag, Button, message, Radio, Checkbox, InputNumber, Tabs, Anchor, Card, Modal } from 'antd';
import { request } from 'ice';

import store from '@/store';
import moment from 'moment';

import request002 from './services'
import flowServices from '../../../src/components/sdkGtjaLinkWeb/services/flow';
import styles from './CustomForm.module.less';

const { Item } = Form;

@Form.create()
class CustomForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      curNode: props.curNode || {},
      piid: '',
      tiid: '',
      loading: false,
      content: '',
      contentLoading: false,
      title: '',
      projId: '',
      selfCheckStatus: '0',
      selfCheckLoading: false,
      busiDate: '',
      fileList: [],
      fileListLoading: false,
    }
  }

  componentDidMount() {
    this._startFallbackPolling();
  }

  _startFallbackPolling = () => {
    let attempts = 0;
    const maxAttempts = 60;

    const tryLoad = async () => {
      if (this._dataLoaded || attempts >= maxAttempts) return;
      attempts++;

      const dispatcher = window.flowDispatcher;
      if (!dispatcher) {
        setTimeout(tryLoad, 500);
        return;
      }

      const state = dispatcher.getState();
      const { piid, tiid, curNode, groupFlag } = state;

      if (!piid) {
        setTimeout(tryLoad, 500);
        return;
      }

      try {
        const params = { piid, tiid };
        if (groupFlag) {
          params.groupFlag = groupFlag;
        }
        const result = await flowServices.submitFlowForm('FLOW_MAINFORM_Q0001', params);

        if (result && result.success && result.Data && result.Data[0]) {
          const formData = result.Data[0];
          const SYS_GUID = formData.SYS_GUID;
          const { form } = this.props;
          if (form) {
            form.setFieldsValue(formData);
          }
          if (SYS_GUID) {
            dispatcher.setState({ SYS_GUID });
          }
          await this.handleGetFormData(formData, SYS_GUID, curNode, tiid);
        } else {
          await this.handleGetFormData({ SYS_PIID: piid }, null, curNode, tiid);
        }
      } catch (e) {
        console.error('[CustomForm] fallback load error', e);
      }
    };

    setTimeout(tryLoad, 300);
  }

  handleGetFormData = async (formData, SYS_GUID, curNode, tiid) => {
    const piid = formData.SYS_PIID;
    const { TITLE, PROJID, BUSIDATE, CHECK_BATCH_ID, CONTENT, STAFF_ID, DEPTMANANAME } = formData;
    this.setState({
      curNode,
      checkBatchId: CHECK_BATCH_ID || '',
      tiid,
      piid,
      title: TITLE || '', // 保存标题
      projId: PROJID || '', // 保存项目编号
      content: CONTENT || '', // 保存富文本内容
      busiDate: BUSIDATE || '', // 业务日期
      staffId: STAFF_ID || '',//项目负责人工号
      deptmananame: DEPTMANANAME || '',//项目负责人姓名
    });
    console.log("TITLE", TITLE);
    console.log("PROJID", PROJID);
    console.log("BUSIDATE", BUSIDATE);
    console.log("CHECK_BATCH_ID", CHECK_BATCH_ID);
    console.log("CONTENT", CONTENT);
    // 获取富文本内容
    this.fetchContent(piid);
    // 获取清单自查状态
    this.fetchSelfCheckStatus(piid, PROJID, CHECK_BATCH_ID);
    // 获取清单自查附件列表
    this.fetchSelfCheckFile(CHECK_BATCH_ID);
  }

  handleGetChildFormData = async (formData, SYS_GUID, curNode) => {
    // 实现逻辑
  }

  // 获取清单自查状态
  fetchSelfCheckStatus = async (piid, projId, checkBatchId) => {
    if (!piid || !projId) {
      console.warn('piid或projId参数为空，无法获取清单自查状态');
      return;
    }
    this.setState({ selfCheckLoading: true });
    try {
      const result = await request002.selectSelfCheck({ piid, projId, checkBatchId });
      if (result && result.success && result.data !== undefined) {
        let dataArray = result.data;
        // 如果 data 是字符串，尝试解析为 JSON 数组
        if (typeof dataArray === 'string') {
          try {
            dataArray = JSON.parse(dataArray);
          } catch (e) {
            console.warn('selectSelfCheck接口返回的data字符串无法解析为JSON:', e);
            dataArray = [];
          }
        }
        // 如果返回的数组为空，选中"否"；否则选中"是"
        const status = Array.isArray(dataArray) && dataArray.length > 0 ? '1' : '0';
        console.log('清单自查状态判断:', { data: result.data, parsedData: dataArray, status });
        this.setState({
          selfCheckStatus: status,
          selfCheckLoading: false,
        });
      } else {
        console.warn('selectSelfCheck接口返回数据格式不正确:', result);
        this.setState({
          selfCheckStatus: '0',
          selfCheckLoading: false,
        });
      }
    } catch (error) {
      console.error('获取清单自查状态失败:', error);
      this.setState({
        selfCheckStatus: '0',
        selfCheckLoading: false,
      });
    }
  }

  // 获取富文本内容
  fetchContent = async (piid) => {
    if (!piid) {
      console.warn('piid参数为空，无法获取内容');
      return;
    }
    this.setState({ contentLoading: true });
    try {
      const result = await request002.selectContent({ piid });
      if (result && result.success && result.data !== undefined) {
        let content = '';

        // 处理接口返回的数据
        const data = result.data;

        // 如果 data 是字符串，可能是被双重编码的（外层有引号包裹）
        if (typeof data === 'string') {
          // 去除外层引号（如果存在）
          let decodedContent = data;
          if ((decodedContent.startsWith('"') && decodedContent.endsWith('"')) ||
            (decodedContent.startsWith("'") && decodedContent.endsWith("'"))) {
            decodedContent = decodedContent.substring(1, decodedContent.length - 1);
          }
          // 处理转义字符
          decodedContent = decodedContent.replace(/\\"/g, '"').replace(/\\'/g, "'");
          content = decodedContent;
        }
        // 如果 data 是对象，尝试获取 content 字段
        else if (typeof data === 'object') {
          const contentData = Array.isArray(data) ? data[0] : data;
          content = contentData.content || contentData.CONTENT || '';
        }

        console.log('解析后的富文本内容:', content);

        this.setState({
          content,
          contentLoading: false,
        });
      } else {
        console.warn('selectContent接口返回数据格式不正确:', result);
        this.setState({ contentLoading: false });
      }
    } catch (error) {
      console.error('获取富文本内容失败:', error);
      message.error('获取内容失败');
      this.setState({ contentLoading: false });
    }
  }

  // 下载附件
  handleDownload = async (file) => {
    // 验证文件信息
    if (!file || !file.id) {
      message.error('文件信息不完整，无法下载');
      return;
    }

    // 显示加载状态
    const hideLoading = message.loading(`正在下载: ${file.name}.${file.extension}`, 0);

    try {
      // 构建完整文件名
      const fullFileName = file.extension
        ? `${file.name}.${file.extension}`
        : file.name;

      // 使用服务中的下载方法，传递文件名和ID
      const result = await request002.downloadSelfCheckFile(fullFileName, file.id);
      hideLoading();

      if (result && result.success) {
        message.success(`下载开始: ${fullFileName}`);
      } else {
        message.success(`下载已开始: ${fullFileName}`);
      }
    } catch (error) {
      hideLoading();
      message.error(`下载失败: ${error.message || '未知错误'}`);
    }
  };

  fetchSelfCheckFile = async (checkBatchId) => {
    if (!checkBatchId) {
      console.warn('checkBatchId参数为空，无法获取附件列表');
      return;
    }
    this.setState({ fileListLoading: true });
    try {
      const result = await request002.selectSelfCheckFile({ checkBatchId });
      if (result && result.success) {
        let dataList = result.data;
        if (typeof dataList === 'string') {
          try {
            dataList = JSON.parse(dataList);
          } catch (e) {
            console.warn('selectSelfCheckFile接口返回的data字符串无法解析为JSON:', e);
            dataList = [];
          }
        }
        if (!Array.isArray(dataList)) {
          dataList = dataList ? [dataList] : [];
        }
        this.setState({
          fileList: dataList,
          fileListLoading: false,
        });
      } else {
        console.warn('selectSelfCheckFile接口返回数据格式不正确:', result);
        this.setState({ fileListLoading: false });
      }
    } catch (error) {
      console.error('获取清单自查附件列表失败:', error);
      this.setState({ fileListLoading: false });
    }
  }

  handleBeforeSubmitForm = async (formData) => {
    const { piid, projId } = this.state;
    const busiDate = formData.BUSIDATE;
    const checkBatchId = formData.CHECK_BATCH_ID

    // 查询当前流程自查状态
    try {
      const result = await request002.selectSelfCheck({ piid, projId, checkBatchId });
      if (result && result.success && result.data !== undefined) {
        let dataArray = result.data;
        // 如果 data 是字符串，尝试解析为 JSON 数组
        if (typeof dataArray === 'string') {
          try {
            dataArray = JSON.parse(dataArray);
          } catch (e) {
            console.warn('selectSelfCheck接口返回的data字符串无法解析为JSON:', e);
            dataArray = [];
          }
        }
        // 如果返回的数组为空，自查状态为"否"
        const status = Array.isArray(dataArray) && dataArray.length > 0 ? '1' : '0';

        // 如果自查状态为"否"，阻止表单提交
        if (status === '0') {
          Modal.warning({
            title: '提示',
            content: '您尚未填写清单自查，请先点击下方链接完成清单自查，完成后刷新页面再提交表单。',
            okText: '我知道了',
          });
          // 抛出异常阻止表单提交，路径选择弹窗也不会出现
          throw new Error('尚未完成清单自查，无法提交表单');
        }
      } else {
        console.warn('selectSelfCheck接口返回数据格式不正确:', result);
        // 默认认为未完成自查，阻止提交
        Modal.warning({
          title: '提示',
          content: '无法获取清单自查状态，请先完成清单自查后再提交表单。',
          okText: '我知道了',
        });
        throw new Error('无法获取清单自查状态');
      }
    } catch (error) {
      // 如果是我们自己抛出的异常，直接重新抛出
      if (error.message && (error.message.includes('清单自查') || error.message.includes('无法获取'))) {
        throw error;
      }
      console.error('查询清单自查状态失败:', error);
      Modal.warning({
        title: '提示',
        content: '查询清单自查状态失败，请先完成清单自查后再提交表单。',
        okText: '我知道了',
      });
      throw new Error('查询清单自查状态失败');
    }

    return { ...formData };
  }

  handleAfterSubmitForm = async (SYS_GUID, otherParams) => {
    console.log(otherParams);
  }

  handleRefresh = async () => {
    const { piid, projId, checkBatchId } = this.state;
    try {
      await Promise.all([
        this.fetchSelfCheckStatus(piid, projId, checkBatchId),
        this.fetchSelfCheckFile(checkBatchId),
      ]);
      message.success('刷新成功');
    } catch (error) {
      console.warn('刷新状态失败，静默处理:', error);
    }
  }

  componentDidMount() {
    // 富文本内容将在 handleGetFormData 获取到 piid 后加载
  }

  render() {
    const { form } = this.props;
    const { loading, content, contentLoading, title, projId, piid, selfCheckStatus, selfCheckLoading, curNode, checkBatchId, busiDate, staffId, deptmananame, fileList, fileListLoading } = this.state;

    const formItemLayout = {
      labelCol: { xs: { span: 24 }, sm: { span: 8 } },
      wrapperCol: { xs: { span: 24 }, sm: { span: 16 } },
    };

    // 根据当前节点代码决定超链接URL
    // 只有在"项目负责人自查"节点（nodeCode='xmfzrzc'）时使用带piid1的URL
    // 其余节点使用带state=info的URL
    const nodeCode = curNode?.nodeCode;
    const isXmfzrzc = nodeCode === 'xmfzrzc';
    const selfCheckUrl = (isXmfzrzc && curNode?.personType === '1')
      ? `http://10.181.135.22:8080/thhg/projlistformTab?projid=${projId}&piid1=${piid}&checkBatchId=${checkBatchId}&staff_id=${staffId}&deptmananame=${deptmananame}`
      : `http://10.181.135.22:8080/thhg/projlistformTab?projid=${projId}&state=info`;

    if (loading) {
      return <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>;
    }

    return (
      <div className="FormReport">
        <Form
          form={form}
          onGetFormData={this.handleGetFormData}
          onGetChildFormData={this.handleGetChildFormData}
          onBeforeSubmitForm={this.handleBeforeSubmitForm}
          onAfterSubmit={this.handleAfterSubmitForm}
        >
          <Row className="RowStyle" style={{ display: 'none' }}>
            <Col span={6}>
              <Item {...formItemLayout} label='业务日期' field='BUSIDATE'>
                {form.getFieldDecorator('BUSIDATE', { initialValue: '' })(<Input disabled />)}
              </Item>
            </Col>
            <Col span={6}>
              <Item {...formItemLayout} label='项目编号' field='PROJID'>
                {form.getFieldDecorator('PROJID', { initialValue: '' })(<Input disabled />)}
              </Item>
            </Col>
            <Col span={6}>
              <Item {...formItemLayout} label='项目状态' field='PROJSTATUS'>
                {form.getFieldDecorator('PROJSTATUS', { initialValue: '' })(<Input disabled />)}
              </Item>
            </Col>
            <Col span={6}>
              <Item {...formItemLayout} label='项目负责人' field='DEPTMANANAME'>
                {form.getFieldDecorator('DEPTMANANAME', { initialValue: '' })(<Input disabled />)}
              </Item>
            </Col>
          </Row>
          <Row className="RowStyle" style={{ display: 'none' }}>
            <Col span={6}>
              <Item {...formItemLayout} label='项目负责人工号' field='STAFF_ID'>
                {form.getFieldDecorator('STAFF_ID', { initialValue: '0' })(<Input disabled />)}
              </Item>
            </Col>
            <Col span={6}>
              <Item {...formItemLayout} label='流程发起人' field='START_USER'>
                {form.getFieldDecorator('START_USER', { initialValue: '' })(<Input disabled />)}
              </Item>
            </Col>
            <Col span={6}>
              <Item {...formItemLayout} label='自查批次' field='CHECK_BATCH'>
                {form.getFieldDecorator('CHECK_BATCH', { initialValue: '' })(<Input disabled />)}
              </Item>
            </Col>
            <Col span={6}>
              <Item {...formItemLayout} label='自查批次编号' field='CHECK_BATCH_ID'>
                {form.getFieldDecorator('CHECK_BATCH_ID', { initialValue: '' })(<Input disabled />)}
              </Item>
            </Col>
          </Row>
          <Row className="RowStyle" style={{ display: 'none' }}>
            <Col span={24}>
              <Item {...formItemLayout} label='标题' field='TITLE'>
                {form.getFieldDecorator('TITLE', { initialValue: '0' })(<Input disabled />)}
              </Item>
            </Col>
          </Row>
        </Form>
        <div className='App'>
          <h1 style={{ textAlign: 'center', paddingTop: '20px' }}>{title || '关于开展投行业务信息隔离墙清单自查工作的通知'}</h1>
          {/* 富文本内容展示区域 */}
          <div style={{ padding: '20px' }}>
            {contentLoading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Card loading={true} style={{ width: '100%' }}>
                  内容加载中...
                </Card>
              </div>
            ) : content ? (
              <div
                className="rich-content"
                dangerouslySetInnerHTML={{ __html: content }}
                style={{
                  minHeight: '400px',
                  padding: '20px',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                暂无内容
              </div>
            )}
          </div>
          {/* 附件展示表格 */}
          <div style={{ padding: '0 20px 20px' }}>
            <h3 style={{ marginBottom: '12px' }}>附件列表</h3>
            <Table
              rowKey={(record, index) => record.ATTACH_ID || record.FILE_ID || record.id || index}
              loading={fileListLoading}
              dataSource={fileList}
              pagination={false}
              size="middle"
              bordered
              columns={[
                {
                  title: '',
                  key: 'index',
                  width: 70,
                  render: (text, record, index) => index + 1,
                },
                {
                  title: '附件名称',
                  dataIndex: 'fullFileName',
                  key: 'fullFileName',
                  ellipsis: true,
                  render: (text, record) => text || record.fullFileName || record.name || '-',
                },
                {
                  title: '上传人',
                  dataIndex: 'displayName',
                  key: 'displayName',
                  width: 120,
                  render: (text, record) => text || record.displayName || '-',
                },
                {
                  title: '上传时间',
                  dataIndex: 'createTime',
                  key: 'createTime',
                  width: 250,
                  render: (text, record) => text || record.createTime || '-',
                },
                {
                  title: '操作',
                  key: 'action',
                  width: 120,
                  fixed: 'right',
                  render: (_, record) => (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => this.handleDownload(record)}
                        style={{ padding: '0 4px', color: '#1890ff' }}
                      >
                        下载
                      </Button>
                    </div>
                  ),
                }
              ]}
            />
          </div>
          {/* 超链接区域 */}
          <div style={{ padding: '10px 20px', textAlign: 'center' }}>
            <span>
              <a
                href={selfCheckUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#1890ff', cursor: 'pointer', textDecoration: 'underline' }}
              >
                【点击此处】
              </a>
              <span style={{ color: '#333' }}>填写清单自查，<span style={{ color: '#E74C3C' }}>填写完后<span
                style={{ color: '#1890ff', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={this.handleRefresh}
              >
                请刷新此页
              </span>，确保清单自查状态为"是"后再提交表单。</span></span>
            </span>
          </div>
          {/* 清单自查状态 */}
          <div style={{ padding: '10px 20px', borderTop: '1px solid #e8e8e8', borderBottom: '1px solid #e8e8e8' }}>
            <span style={{ display: 'inline-block', width: '150px', textAlign: 'right', marginRight: '10px', color: '#666' }}>
              是否已填写清单自查：
            </span>
            <Radio.Group
              value={selfCheckStatus}
              disabled
              loading={selfCheckLoading}
              buttonStyle="solid"
            >
              <Radio value="1" style={{ marginRight: '10px' }}>是</Radio>
              <Radio value="0">否</Radio>
            </Radio.Group>
          </div>
        </div>
      </div>
    );
  }
}

export default CustomForm;
