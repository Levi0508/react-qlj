import React, { Component } from 'react';
import {
    // Modal,
    Input,
    Form,
    Descriptions,
    Upload,
    Icon,
    message,
    Row,
    Col,
    Button,
} from 'antd';
import _ from 'lodash';

import Modal from '../../../components/DraggableModal';
import utils from '../../../utils/utils';
import '../../styles.less';

import { withFlowContext } from '../../LinkFlowContext';

const msgText = ['空文件', '文件超过30M', '正常', '不支持上传此类型文件'];

@Form.create()
class ErrorReportModal extends Component {

    state = {fileList:[]};

    handleOk = () => {
        const {
            dispatch,
            form,
        } = this.props;
        const {
            fileList
        } = this.state;

        form.validateFieldsAndScroll((err, values) => {
            if (err) return;
            const { mailSubject, mailDesc } = values;
            dispatch({
                type: `submitErrorReport`,
                payload: {
                    mailSubject,
                    mailDesc,
                    fileList: JSON.stringify(fileList)
                },
            });
        });
    }

    handleCancel = () => {
        const {
            dispatch,
        } = this.props;
        dispatch({
            type: `toggleErrorReportModal`,
            payload: {
                visible: false,
            },
        });
    }

    renderSendContent = () => {
        const {
            errorReportMsg
        } = this.props;
        return (
            <div style={{width: "500px"}} dangerouslySetInnerHTML={{__html: errorReportMsg}}></div>
        );
    }

    verifyFileType = filename => {
        const {
            fileTypeWhiteList,
        } = this.props;
        if (!fileTypeWhiteList) {
            return 2;
        }
        const index = filename.lastIndexOf('.');
        const filetype = filename.substring(index + 1, filename.length).toLowerCase();
        return fileTypeWhiteList.indexOf(filetype) !== -1 ? 2 : 3;
    };

    /**
     * 验证上传文件大小
     * code： 0--表示空文件  1--表示文件过大    2：表示正常 3-表示文件类型不支持
     */
    verifyFileSize = fileSize => {
        if (fileSize === 0) {
            return 0;
        }
        if (fileSize >= 1024 * 1024 * 30) {
            return 1;
        }
        return 2;
    };

    removeFile = (file, index) => {
        const {
            fileList
        } = this.state;

        fileList.splice(index, 1);

        this.setState({fileList});
    }

    render() {
        const {
            errorReportModalVisible,
            loadings,
            form: { getFieldDecorator },
            systemId,
            flowCode,
            ...restProps
        } = this.props;
        var that = this;

        const uploadProps = {
            name: 'file',
            action: '/api/eoafilegw/fileUpload',
            showUploadList: false,
            data: {
                type: 'FLOW_ATTACH_UPLOAD_U0001',
                storeType: 'error', // arch--表示归档
                systemCode: systemId,
                flowCode: flowCode,
            },
            beforeUpload(file, fileList) {
                // 多文件上传未通过验证的文件
                let tempListUnVerify = [];

                if (fileList.length) {
                    // 循环遍历上传的多个文件  进行检查
                    fileList.forEach(item => {
                        let verify = that.verifyFileType(item.name);
                        if (verify !== 2) {
                            tempListUnVerify.push({
                                errorCode: verify,
                                fileName: item.name,
                            });
                            return false;
                        }
                        verify = that.verifyFileSize(item.size);
                        if (that.verifyFileSize(item.size) !== 2) {
                            tempListUnVerify.push({
                                errorCode: verify,
                                fileName: item.name,
                            });
                            return false;
                        }
                    });
                    // 未通过校验返回提示信息
                    if (tempListUnVerify.length) {
                        let messageFileName = [];
                        tempListUnVerify.forEach(items => {
                        messageFileName.push(`${items.fileName}(${msgText[items.errorCode]})`);
                        });
                        message.warn(`上传失败：${messageFileName.join('、')}`);
                        return false;
                    }
                }
            },
            onChange(info) {

                const { file } = info;
                const { status, uid } = file;

                if (status === 'error') {
                    const error = file.response.error || '上传失败';
                    message.error(`${error}`);
                } else if (status === 'done') {
                    const { Data, ErrMsg } = file.response;
                    const fileInfo = Data ? Data[0] : {};
                    if (Data) {
                        const {fileList} = that.state;
                        fileList.push({fileName: fileInfo.FileName, fileSize: fileInfo.fileSize, fileType: fileInfo.fileType, filepath: fileInfo.filePath})
                        //fileList.push({fileName: fileInfo.FileName, fileSize: fileInfo.fileSize, fileType: fileInfo.fileType, filepath: fileInfo.filePath})
                        that.setState({fileList});
                    } else {
                        message.error(`${ErrMsg}`);
                    }
                }
            },
        }
        return (
            <Modal
                title='发送错误报告'
                width={800}
                {...restProps}
                visible={errorReportModalVisible}
                confirmLoading={loadings['reportError']}
                onOk={this.handleOk}
                onCancel={this.handleCancel}
                centered
                className={utils.getClassName('modal', this.props)}
            >
                <Form>
                    <Descriptions bordered size={"small"} column={1}>
                        <Descriptions.Item label='发送内容'>{this.renderSendContent()}</Descriptions.Item>
                        <Descriptions.Item label='邮件主题'>
                            <Form.Item style={{ margin: 0 }}>
                                {
                                    getFieldDecorator('mailSubject', {
                                        initialValue: '错误报告',
                                        rules: [{ required: true, message: '请输入邮件主题' }],
                                    })(<Input maxLength={100} />)
                                }
                            </Form.Item>
                        </Descriptions.Item>
                        <Descriptions.Item label='描述'>
                            <Form.Item style={{ margin: 0 }}>
                                {
                                    getFieldDecorator('mailDesc', {
                                        rules: [{ required: true, message: '请输入描述' }],
                                    })(<Input.TextArea maxLength={500} rows={4} />)
                                }
                            </Form.Item>
                        </Descriptions.Item>
                        <Descriptions.Item label='附件'>
                            {
                                this.state.fileList.map((file,index) => {
                                    return  <Row gutter={[16, 24]}>
                                                <Col span={4}>
                                                    <a onClick={() => that.removeFile(file, index)}>删除</a>
                                                </Col>
                                                <Col span={20}>
                                                    {file.fileName}
                                                </Col>
                                            </Row>;
                                })
                            }
                            <Upload.Dragger {...uploadProps}>
                                <p className="ant-upload-drag-icon">
                                    <Icon type="inbox" theme="outlined" />
                                </p>
                                <p className="ant-upload-text">点击或将文件拖拽到这里上传</p>
                                <p className="ant-upload-hint">{`支持上传文件大小:30MB以内`}</p>
                            </Upload.Dragger>
                        </Descriptions.Item>
                    </Descriptions>
                </Form>
            </Modal>
        );
    }
}

export default withFlowContext(ErrorReportModal, [
    'serialNum',
    'template',
    'applyTitle',
    'drafterInfo',
    'currentUser',
    'errorReportModalVisible',
    'errorReportMsg',
    'loadings',
    'systemId',
    'flowCode',
    'fileTypeWhiteList',
]);
