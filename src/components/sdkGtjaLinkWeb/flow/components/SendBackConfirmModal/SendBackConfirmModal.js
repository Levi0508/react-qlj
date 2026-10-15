import React from 'react';
import {
    // Modal,
    Icon,
    Row,
    Col,
    Typography,
} from 'antd';

import Modal from '../../../components/DraggableModal';
import { withFlowContext } from '../../LinkFlowContext';
import utils from '../../../utils/utils';
import '../../styles.less';
import classNames from 'classnames';

class SendBackConfirmModal extends React.PureComponent {

    handleCancel = () => {
        const {dispatch} = this.props;
        dispatch({
            type: 'toggleSendBackModal',
            payload: false,
        });
    }

    handleOk = () => {
        // TODO: 执行退回操作
        const {dispatch} = this.props;
        dispatch({
            type: 'toggleSendBackModal',
            payload: false,
        });
    }

    render() {
        const {
            sendBackConfirmModalVisible,
        } = this.props;
        return (
            <Modal
                visible={sendBackConfirmModalVisible}
                title={null}
                okText='退回'
                bodyStyle={{
                    height: 150,
                }}
                okButtonProps={{
                    type: 'danger',
                }}
                onCancel={this.handleCancel}
                onOk={this.handleOk}
                centered
                className={utils.getClassName('modal', this.props)}
            >
                <Row type='flex' align='top'>
                    <Col>
                        <Icon
                            type="exclamation"
                            style={{
                                width: 26,
                                height: 26,
                                textAlign: 'center',
                                backgroundColor: '#F39000',
                                color: 'white',
                                borderRadius: '100%',
                                fontSize: 26,
                                marginTop: 6,
                            }}
                        />
                    </Col>
                    <Col style={{ marginLeft: 10 }}>
                        <Typography.Text strong style={{ fontSize: 18, lineHeight: '40px' }}>确定要退回吗？</Typography.Text><br />
                        <Typography.Text>将根据配置退回审批单。</Typography.Text>
                    </Col>
                </Row>
            </Modal>
        );
    }
}

export default withFlowContext(SendBackConfirmModal, ['sendBackConfirmModalVisible']);
