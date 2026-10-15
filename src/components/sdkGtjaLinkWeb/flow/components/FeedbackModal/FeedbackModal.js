import React from 'react';
import {
    // Modal,
    Form,
    message,
    Input,
} from 'antd';

import Modal from '../../../components/DraggableModal';
import UserListTransfer from '../UserListTransfer';
import GroupTitle from '../Typography/GroupTitle';

import { withFlowContext } from '../../LinkFlowContext';
import utils from '../../../utils/utils';
import '../../styles.less';
import classNames from 'classnames';

const userList = new Array(5).fill(0).map((n2, i2) => ({ userCode: `${i2}`, username: `张三${i2}` }));

class FeedbackModal extends React.Component {

    state = {

    }

    handleCancel = () => {
        const { dispatch } = this.props;
        dispatch({
            type: 'toggleFeedbackModal',
            payload: false,
        });
    }

    handleOk = () => {
        const { dispatch, form } = this.props;
        form.validateFieldsAndScroll((err, values) => {
            if (err) return;
            message.success(JSON.stringify(values));
            dispatch({
                type: 'toggleFeedbackModal',
                payload: false,
            });
        })
    }

    render() {
        const {
            form: { getFieldDecorator },
            feedbackModalVisible,
        } = this.props;
        return (
            <Modal
                title='填写反馈'
                visible={feedbackModalVisible}
                onCancel={this.handleCancel}
                onOk={this.handleOk}
                okText='确定'
                width={770}
                centered
                className={utils.getClassName('modal', this.props)}
            >
                <Form>
                    <GroupTitle style={{ marginBottom: 16 }}>反馈对象</GroupTitle>
                    <Form.Item>
                        {
                            getFieldDecorator('targets', {
                                rules: [{ required: true, message: '请选择反馈对象' }],
                            })(
                                <UserListTransfer dataSource={userList} />
                            )
                        }
                    </Form.Item>
                    <GroupTitle style={{ marginBottom: 16 }}>反馈内容</GroupTitle>
                    <Form.Item>
                        {
                            getFieldDecorator('content', {
                                rules: [{ required: true, message: '请输入您的反馈内容' }],
                            })(
                                <Input.TextArea placeholder='请输入您的反馈内容......' />
                            )
                        }
                    </Form.Item>
                </Form>
            </Modal>
        );
    }
}

export default Form.create()(withFlowContext(FeedbackModal, [
    'feedbackModalVisible',
]));
