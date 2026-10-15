import React, { useState, useEffect } from 'react';
import Form from '@/components/IbFlowForm';
import { Input, Row, Col, Card, Tooltip, Button, message } from 'antd';
import { request } from 'ice';
import store from '@/store';

import moment from 'moment';

import request003 from './services';
import { previewInWindow } from '@/hooks/useFilePreviewWindow';
import flowServices from '../../components/sdkGtjaLinkWeb/services/flow';
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
      projId: '',
      projInfo: {}, // 存储接口返回的项目信息（小驼峰格式）
      loading: false,
      staffId: '',
      deptmananame: '',
      pkId: '',
    }
  }

  handleGetFormData = async (formData, SYS_GUID, curNode, tiid) => {
    const piid = formData.SYS_PIID;
    const projId = formData.PROJ_ID;
    const batchId = formData.BATCH_ID;
    const staffId = formData.STAFF_ID;
    const deptmananame = formData.DEPTMANANAME;
    const pkId = formData.PK_ID;

    this.setState({
      curNode,
      tiid,
      piid,
      projId,
      staffId,
      deptmananame,
      pkId
    });

    // 调用接口获取项目信息
    await this.fetchProjInfo(piid, batchId, projId, pkId);
  }

  // 获取项目信息
  fetchProjInfo = async (piid, batchId, projId, pkId) => {
    if (!piid || !projId) {
      console.warn('piid或projId参数为空，无法获取项目信息');
      return;
    }
    try {
      const result = await request003.selectProjInfo({ piid, batchId, projId, pkId });
      if (result && result.success && result.data !== undefined) {
        let projInfo = result.data;
        // 如果 data 是字符串，尝试解析为 JSON
        if (typeof projInfo === 'string') {
          try {
            projInfo = JSON.parse(projInfo);
          } catch (e) {
            console.warn('selectProjInfo接口返回的data字符串无法解析为JSON:', e);
            projInfo = {};
          }
        }
        // 如果是数组，取第一个元素
        if (Array.isArray(projInfo)) {
          projInfo = projInfo[0] || {};
        }
        console.log('selectProjInfo接口返回:', projInfo);
        this.setState({ projInfo });
      } else {
        console.warn('selectProjInfo接口返回数据格式不正确:', result);
      }
    } catch (error) {
      console.error('获取项目信息失败:', error);
    }
  }

  handleGetChildFormData = async (formData, SYS_GUID, curNode) => {
    // 实现逻辑
  }

  handleBeforeSubmitForm = async (formData) => {
    return { ...formData };
  }

  handleAfterSubmitForm = async (SYS_GUID, otherParams) => {
    console.log(otherParams);
  }

  getFileName = (filepath) => {
    if (!filepath) return '';
    const parts = filepath.split('/');
    return parts[parts.length - 1] || filepath;
  }

  // 下载附件
  handleDownload = async (file) => {
    const filepath = file.filepath;
    const fileName = this.getFileName(filepath);
    if (!filepath) {
      message.error('文件路径缺失，无法下载');
      return;
    }
    const hideLoading = message.loading(`正在下载: ${fileName}`, 0);
    try {
      await request003.downloadInoutCommentFile(filepath);
      hideLoading();
      message.success(`下载完成: ${fileName}`);
    } catch (error) {
      hideLoading();
      message.error(`下载失败: ${error.message || '未知错误'}`);
    }
  };

  // 预览附件（在独立的浏览器窗口打开）
  handlePreview = async (file) => {
    const filepath = file.filepath;
    if (!filepath) {
      message.error('文件路径缺失，无法预览');
      return;
    }
    const hideLoading = message.loading('正在加载预览...', 0);
    try {
      await previewInWindow(async () => {
        const result = await request003.previewInoutCommentFile(filepath);
        if (result && result.success && result.data) {
          const url = result.data.previewUrl || result.data.url || result.data;
          return url || null;
        }
        return null;
      }, {
        unsupportedMessage: '当前文件类型不支持预览',
        errorMessage: '预览失败',
      });
    } finally {
      hideLoading();
    }
  };

    render() {
    const { form } = this.props;
    const { curNode, piid, projId, projInfo, loading, staffId, deptmananame } = this.state;
    const nodeCode = curNode?.nodeCode;

    // 判断当前节点类型
    const isHgrysh = nodeCode === 'hgrysh'; // 合规人员审核
    const isXmfzryz = nodeCode === 'xmfzryz'; // 项目负责人阅知

    // 获取表单字段值，优先使用接口返回的字段，否则使用formData
    const getFieldValue = (fieldName, apiFieldName) => {
      // 优先从接口返回的字段获取（接口返回的是小驼峰格式）
      if (projInfo[apiFieldName] !== undefined && projInfo[apiFieldName] !== null && projInfo[apiFieldName] !== '') {
        return projInfo[apiFieldName];
      }
      // 否则从formData获取
      return form.getFieldValue(fieldName) || '';
    };

    const formItemLayout = {
      labelCol: { xs: { span: 24 }, sm: { span: 8 } },
      wrapperCol: { xs: { span: 24 }, sm: { span: 16 } },
    };

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
          {/* 隐藏字段 */}
          <Row className="RowStyle" style={{ display: 'none' }}>
            <Col span={12}>
              <Item {...formItemLayout} label='项目ID' field='PROJ_ID'>
                {form.getFieldDecorator('PROJ_ID', { initialValue: '' })(<Input disabled />)}
              </Item>
            </Col>
          </Row>
        </Form>

        <div className='App'>
          {/* 项目负责人阅知节点 - 顶部提示信息 */}
          {/* isXmfzryz && (
            <div style={{ 
              backgroundColor: '#fff3e0', 
              borderLeft: '4px solid #faad14',
              padding: '16px 20px',
              borderRadius: '0 4px 4px 0'
            }}>
              <p style={{ color: '#d46b08', margin: 0, fontWeight: 'bold' }}>
                投行合规组已对以下清单操作进行了审核反馈，请知悉并修订
              </p>
            </div>
          ) */}

          {/* 项目信息卡片 */}
          <Card title="项目信息">
            {/* 公共字段 - 所有节点都显示 */}
            <Row className="RowStyle">
              <Col span={12}>
                <Item {...formItemLayout} label='项目编号' field='PROJCODE'>
                  {form.getFieldDecorator('PROJCODE', {
                    initialValue: getFieldValue('PROJCODE', 'projcode')
                  })(<Input disabled />)}
                </Item>
              </Col>
              <Col span={12}>
                <Item {...formItemLayout} label='公司全称' field='KHNAME'>
                  {form.getFieldDecorator('KHNAME', {
                    initialValue: getFieldValue('KHNAME', 'khname')
                  })(<Input disabled />)}
                </Item>
              </Col>
            </Row>
            <Row className="RowStyle">
              <Col span={12}>
                <Item {...formItemLayout} label='项目名' field='PROJNAME'>
                  {form.getFieldDecorator('PROJNAME', {
                    initialValue: getFieldValue('PROJNAME', 'projname')
                  })(<Input disabled />)}
                </Item>
              </Col>
              <Col span={12}>
                <Item {...formItemLayout} label='证券代码' field='STOCKCODE'>
                  {form.getFieldDecorator('STOCKCODE', {
                    initialValue: getFieldValue('STOCKCODE', 'stockcode')
                  })(<Input disabled />)}
                </Item>
              </Col>
            </Row>
            <Row className="RowStyle">
              <Col span={12}>
                <Item {...formItemLayout} label='股票简称' field='STOCKNAME'>
                  {form.getFieldDecorator('STOCKNAME', {
                    initialValue: getFieldValue('STOCKNAME', 'stockname')
                  })(<Input disabled />)}
                </Item>
              </Col>
              <Col span={12}>
                <Item {...formItemLayout} label='业务类型' field='PROJTYPE'>
                  {form.getFieldDecorator('PROJTYPE', {
                    initialValue: getFieldValue('PROJTYPE', 'projtype')
                  })(<Input disabled />)}
                </Item>
              </Col>
            </Row>

            {/* 合规人员审核节点特有字段 */}
            {isHgrysh && (
              <>
                <Row className="RowStyle">
                  <Col span={12}>
                    <Item {...formItemLayout} label='项目负责人' field='DEPTMANANAME'>
                      {form.getFieldDecorator('DEPTMANANAME', {
                        initialValue: getFieldValue('DEPTMANANAME', 'deptmananame')
                      })(<Input disabled />)}
                    </Item>
                  </Col>
                  <Col span={12}>
                    <Item {...formItemLayout} label='项目负责人工号' field='STAFF_ID'>
                      {form.getFieldDecorator('STAFF_ID', {
                        initialValue: getFieldValue('STAFF_ID', 'staffId')
                      })(<Input disabled />)}
                    </Item>
                  </Col>
                </Row>
                <Row className="RowStyle">
                  <Col span={12}>
                    <Item {...formItemLayout} label='部门名称' field='DEPTNAME'>
                      {form.getFieldDecorator('DEPTNAME', {
                        initialValue: getFieldValue('DEPTNAME', 'deptName')
                      })(<Input disabled />)}
                    </Item>
                  </Col>
                  <Col span={12}>
                    <Item {...formItemLayout} label='清单状态' field='PROJLIST_STATUS_NAME'>
                      {form.getFieldDecorator('PROJLIST_STATUS_NAME', {
                        initialValue: getFieldValue('PROJLIST_STATUS_NAME', 'projStatusName')
                      })(<Input disabled />)}
                    </Item>
                  </Col>
                </Row>
                <Row className="RowStyle">
                  <Col span={12}>
                    <Item {...formItemLayout} label='操作内容' field='OP_CONTENT'>
                      {form.getFieldDecorator('OP_CONTENT', {
                        initialValue: getFieldValue('OP_CONTENT', 'opContent')
                      })(<Input disabled />)}
                    </Item>
                  </Col>
                  <Col span={12}>
                    <Item {...formItemLayout} label='操作时间' field='OP_TIME'>
                      {form.getFieldDecorator('OP_TIME', {
                        initialValue: getFieldValue('OP_TIME', 'opTime')
                      })(<Input disabled />)}
                    </Item>
                  </Col>
                </Row>
              </>
            )}

            {/* 项目负责人阅知节点特有字段 */}
            {isXmfzryz && (
              <>
                <Row className="RowStyle">
                  <Col span={12}>
                    <Item {...formItemLayout} label='清单状态' field='PROJLIST_STATUS_NAME'>
                      {form.getFieldDecorator('PROJLIST_STATUS_NAME', {
                        initialValue: getFieldValue('PROJLIST_STATUS_NAME', 'projStatusName')
                      })(<Input disabled />)}
                    </Item>
                  </Col>
                  <Col span={12}>
                    <Item {...formItemLayout} label='审核反馈' field='CHECK_RESULT'>
                      {form.getFieldDecorator('CHECK_RESULT', {
                        initialValue: getFieldValue('CHECK_RESULT', 'checkResult')
                      })(<Input disabled />)}
                    </Item>
                  </Col>
                </Row>
                <Row className="RowStyle">
                  <Col span={12}>
                    <Item {...formItemLayout} label='审核时间' field='CHECK_TIME'>
                      {form.getFieldDecorator('CHECK_TIME', {
                        initialValue: getFieldValue('CHECK_TIME', 'checkTime')
                      })(<Input disabled />)}
                    </Item>
                  </Col>
                  <Col span={12}>
                    <Item {...formItemLayout} label='审核附件' field='CHECK_TIME'>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {projInfo?.fileList?.map((item, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              borderBottom: '1px solid #f0f0f0',
                            }}
                          >
                            <Tooltip title={item.filepath}>
                              <Button
                                type="link"
                                onClick={() => this.handleDownload(item)}
                                style={{
                                  padding: 0,
                                  maxWidth: '100%',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'block',
                                  textAlign: 'left',
                                }}
                                title="点击下载文件"
                              >
                                <span
                                  style={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {this.getFileName(item.filepath)}
                                </span>
                              </Button>
                            </Tooltip>

                            <div style={{ flexShrink: 0, marginLeft: 8 }}>
                              <Tooltip title="预览">
                                <Button
                                  type="link"
                                  icon="eye"
                                  onClick={() => this.handlePreview(item)}
                                  disabled={!item.filepath}
                                  style={{ padding: 0 }}
                                />
                              </Tooltip>
                              <Tooltip title="下载">
                                <Button
                                  type="link"
                                  icon="download"
                                  onClick={() => this.handleDownload(item)}
                                  disabled={!item.filepath}
                                  style={{ padding: 0 }}
                                />
                              </Tooltip>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Item>
                  </Col>
                </Row>
              </>
            )}
          </Card>

          {/* 超链接区域 */}
          <div style={{ padding: '10px 20px', textAlign: 'center' }}>
            <span>
              <a
                href={(isHgrysh && curNode?.personType === '1')
                  ? `http://10.181.135.22:8080/thhg/projlistformTab?projid=${projId}&piid2=${piid}&staff_id=${staffId}&deptmananame=${deptmananame}&nodeCode=hgrysh`
                  : isXmfzryz
                    ? `http://10.181.135.22:8080/thhg/projlistformTab?projid=${projId}&piid2=${piid}&state=info&staff_id=${staffId}&deptmananame=${deptmananame}`
                    : `http://10.181.135.22:8080/thhg/projlistformTab?projid=${projId}&state=info`
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#1890ff', cursor: 'pointer', textDecoration: 'underline' }}
              >
                【点击此处】
              </a>查看清单详情
            </span>
          </div>
        </div>

</div>
    );
  }
}

export default CustomForm;
