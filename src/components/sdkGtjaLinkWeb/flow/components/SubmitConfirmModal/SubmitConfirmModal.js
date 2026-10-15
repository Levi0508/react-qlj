import React from 'react';
import {
    // Modal,
    Icon,
    Row,
    Col,
    Typography,
    Checkbox,
    Button,
} from 'antd';
import Modal from '../../../components/DraggableModal';

import { withFlowContext } from '../../LinkFlowContext';
import utils from '../../../utils/utils';
import '../../styles.less';

class SubmitConfirmModal extends React.PureComponent {

    constructor(props) {
        super(props);
        let autoClose = utils.getCookie("autoclose");
        this.state = {
            autoClose: (!autoClose || autoClose == "close"),    // 提交完成后是否自动关闭
        };
    }

    changeautoClose = (e) => {
        utils.setCookie("autoclose", e.target.checked ? "close" : "notclose");
        this.setState({
            autoClose: e.target.checked,
        });
    }

    handleCancel = () => {
        const { dispatch } = this.props;
        dispatch({
            type: 'toggleSubmitConfirmModal',
            payload: false,
        });
    }

    handleOk = () => {
        // 执行提交操作
        const { dispatch } = this.props;
        dispatch({
            type: 'completeTask',
        });
    }

    renderNodeHandlers = (handlers) => {
        if (!Array.isArray(handlers) || handlers.length === 0) return '';
        return handlers.map(({ userName, orgName, deptName }) => `${orgName || deptName} - ${userName}`).join('、');
    }

    renderHandlers = () => {
        const {
            selectedPaths,
            selectedNodesHandlers,
        } = this.props;
        // if (selectedPaths.length === 1) {
        //     // 单路径情况
        //     const endNodeCode = _.get(selectedPaths, '[0].endNodeCode');
        //     const handlers = selectedNodesHandlers[endNodeCode];
        //     return <>{this.renderNodeHandlers(handlers)}<br /></>;
        // }

        // TODO: 多路径情况
        return (
            <Typography.Text>
                已经选择环节-处理人：<br />
                {selectedPaths.map(path => (
                    <>
                        <Typography.Text>
                            <Typography.Text strong>{path.pathName}：</Typography.Text>
                            {this.renderNodeHandlers(selectedNodesHandlers[path.endNodeCode])}
                        </Typography.Text>
                        <br />
                    </>
                ))}
                点击提交后流程转至该处理人。
            </Typography.Text>
        );
    }

    renderNoHandler = () => {
        const {
            selectedPaths,
        } = this.props;
        return (
            <Typography.Text>
                即将结束<Typography.Text>{selectedPaths.map(path => {
                const { pathName } = path;
                if (pathName.indexOf('结束') === 0) return pathName.replace('结束', '');
                return pathName;
            }).join('、')}</Typography.Text>。<br />
            </Typography.Text>
        );
    }

    render() {
        const {
            selectedNodesHandlers,
            submitConfirmModalVisible,
            isSendBack,
            loadings,
        } = this.props;

        // 计算处理人总数
        const handlerCount = Object.keys(selectedNodesHandlers).reduce((r, n) => {
            const handlers = selectedNodesHandlers[n];
            return r + (Array.isArray(handlers) ? handlers.length : 0);
        }, 0);

        let autoClose = utils.getCookie("autoclose");
        this.state.autoClose = autoClose;

        return (
            <Modal
                visible={submitConfirmModalVisible}
                title={<div>&nbsp;</div>}
                bodyStyle={{
                    minHeight: 150,
                }}
                centered
                mask={false}
                className={utils.getClassName('modal', this.props)}
                zIndex={1002}
                onCancel={this.handleCancel}
                footer={[
                    <Checkbox checked={this.state.autoClose} onChange={this.changeautoClose}>提交后自动关闭</Checkbox>,
                    <Button key="back" onClick={this.handleCancel}>
                        取消
                    </Button>,
                    <Button key="submit" type="primary" onClick={this.handleOk} loading={loadings['completeTask']}>
                        提交
                    </Button>,
                ]}
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
                        <Typography.Text strong style={{ fontSize: 18, lineHeight: '40px' }}>{submitConfirmModalVisible ? `确定要${isSendBack ? '退回' : '提交'}吗？` : "提交中！"}</Typography.Text><br />
                    </Col>
                </Row>
                <Row style={{ marginLeft: 36 }}>
                    {
                        handlerCount === 0 ?
                            this.renderNoHandler()
                            :
                            this.renderHandlers()
                    }
                </Row>
            </Modal>
        );
    }
}

export default withFlowContext(SubmitConfirmModal, [
    'submitConfirmModalVisible',
    'selectedPaths',
    'selectedNodesHandlers',
    'isSendBack',
    'loadings',
]);
