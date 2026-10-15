/**
 * 文件作废弹窗
 */
import React from 'react';
import {
    // Modal,
    Form,
    Icon,
    Typography,
    Radio,
    Divider,
    message,
} from 'antd';

import Modal from '../../../components/DraggableModal';
import { withFlowContext } from '../../LinkFlowContext';
import utils from '../../../utils/utils';
import '../../styles.less';

import './styles.less';

const WarnText = (props) => (
    <div style={props.style}>
        <span style={{ color: '#F39000' }}>
            <Icon type='info-circle' theme='filled' style={{ marginRight: 8 }} />
            {props.children}
        </span>
    </div>
);

const radioOptions = [
    { label: '删除', value: 'Y' },
    { label: '保留', value: 'N' }
];

class FileDeleteModal extends React.Component {

    handleCancel = () => {
        const { dispatch } = this.props;
        dispatch({
            type: 'toggleFileDeleteModal',
            payload: false,
        });
    }

    handleOk = () => {
        const { dispatch, form } = this.props;
        form.validateFieldsAndScroll((err, values) => {
            if (err) return;
            dispatch({
                type: 'submitFileDelete',
                payload: values,
            });
        });
    }

    render() {
        const {
            form: { getFieldDecorator },
            fileDeleteModalVisible,
            loadings,
        } = this.props;

        const formLayout = {
            labelCol: { span: 12 },
            wrapperCol: { span: 12 },
            labelAlign: 'left',
        };

        return (
            <Modal
                title='文件作废'
                width={500}
                visible={fileDeleteModalVisible}
                onCancel={this.handleCancel}
                onOk={this.handleOk}
                confirmLoading={loadings['submitFileDelete']}
                destroyOnClose
                centered
                className={utils.getClassName('modal', this.props)}
            >
                <div style={{marginLeft: 16, marginRight: 16}}>
                    <Form layout='horizontal' {...formLayout} className={utils.getClassName('fileDeleteForm', this.props)}>
                        <WarnText>文号回收后可再次使用</WarnText>
                        <Form.Item label='是否回收文号'>
                            {
                                getFieldDecorator('retrieveSerialNumFlag', {
                                    initialValue: 'Y',
                                    rules: [{ required: true, message: '请选择是否回收文号' }],
                                })(<Radio.Group options={radioOptions} />)
                            }
                        </Form.Item>
                        <Divider dashed style={{ margin: 0, marginBottom: 16 }} />
                        <WarnText>待办、待阅文档删除后会从数据库中清除，并且不能恢复，请谨慎选择</WarnText>
                        <Form.Item label='是否删除相关待办、待阅文档'>
                            {
                                getFieldDecorator('deleteMsgFlag', {
                                    initialValue: 'Y',
                                    rules: [{ required: true, message: '请选择是否删除相关待办、待阅文档' }],
                                })(<Radio.Group options={radioOptions} />)
                            }
                        </Form.Item>
                        <Divider dashed style={{ margin: 0, marginBottom: 16,display:"none" }} />
                        <WarnText style={{ display:"none" }} >表单删除后会从数据库中清除，并且不能恢复，请谨慎选择</WarnText>
                        <Form.Item label='是否永久删除表单' style={{ display:"none" }}>
                            {
                                getFieldDecorator('deleteApplyTableFlag', {
                                    initialValue: 'N',
                                    rules: [{ required: true, message: '请选择是否永久删除表单' }],
                                })(<Radio.Group options={radioOptions} />)
                            }
                        </Form.Item>
                    </Form>
                </div>
            </Modal>
        );
    }
}

export default Form.create()(withFlowContext(FileDeleteModal, [
    'fileDeleteModalVisible',
    'loadings',
]));
