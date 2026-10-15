import React from 'react';
import {
    // Modal,
    Icon,
    Row,
    Col,
    Typography,
    Checkbox,
    Button,
    Descriptions,
    Card,
    Divider,
} from 'antd';
import Modal from '../../../components/DraggableModal';

import { withFlowContext } from '../../LinkFlowContext';
import utils from '../../../utils/utils';
import '../../styles.less';
import './styles.less';

class SmartCommitModal extends React.PureComponent {

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
        // 执行隐藏智能提交
        dispatch({
            type: 'hideSmartCommitModel',
            payload: { showPathSelect: false },
        });
    }

    handleNotOk = () => {
        const { dispatch } = this.props;
        // 记录智能提交使用情况
        dispatch({
            type: 'recordSmartCommit',
            payload: 0,
        });
        // 执行隐藏智能提交、显示路径选择操作
        dispatch({
            type: 'hideSmartCommitModel',
            payload: { showPathSelect: true },
        });
    }

    handleOk = () => {
        // 执行提交操作
        const { dispatch } = this.props;
        // 记录智能提交使用情况
        dispatch({
            type: 'recordSmartCommit',
            payload: 1,
        });
        // // 执行提交操作
        dispatch({
            type: 'completeTask',
        });
    }

    render() {
        const {
            smartCommitParams,
            smartCommitModalVisible,
            loadings,
        } = this.props;

        return (
            <Modal
                visible={smartCommitModalVisible}
                title={<div>智能提交</div>}
                bodyStyle={{
                    minHeight: 150,
                    padding: 30,
                }}
                width={700}
                centered
                // mask={false}
                className={utils.getClassName('modal', this.props)}
                zIndex={1002}
                onCancel={this.handleCancel}
                footer={
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            paddingTop: 22,
                            paddingBottom: 16,
                        }}
                    >
                        <Checkbox style={{ marginRight: 12 }} checked={this.state.autoClose} onChange={this.changeautoClose}>提交后自动关闭</Checkbox>
                        <Button style={{ marginRight: 12 }} key="back" type='primary' ghost onClick={this.handleNotOk}>
                            重新选择路径
                        </Button>
                        <Button key="submit" type="primary" onClick={this.handleOk} loading={loadings['completeTask']}>
                            确定
                        </Button>
                    </div>
                }
                footerStyle
            >
                <Typography.Text style={{ fontSize: 12, color: '#A6A6A6' }}>
                    <Icon type='info-circle' style={{ marginRight: 12 }} />
                    根据您的历史提交记录自动计算得出较可能提交路径和处理人
                </Typography.Text><br />
                {
                    (smartCommitParams || { candidateInfo: [] }).candidateInfo.map(item => (
                        <Card
                            bordered
                            style={{ marginTop: 30 }}
                            bodyStyle={{ padding: 30 }}
                        >
                            <Descriptions column={1} className={utils.getClassName('descriptionTdTop', this.props)}>
                                <Descriptions.Item label={<span style={{fontSize: 16}}>提交路径</span>}>
                                    <span style={{fontSize: 16}}>{item.pathName}</span>
                                </Descriptions.Item>
                                <Descriptions.Item label='&emsp;处理人'>
                                    <div>
                                        {(item.handlerInfoList || []).map(({ userName, orgName, deptName }, j) =>
                                            <>
                                                {j !== 0 && <br />}
                                                <span>
                                                    {orgName || deptName} - {userName}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    ))
                }
            </Modal>
        );
    }
}

export default withFlowContext(SmartCommitModal, [
    'smartCommitParams',
    'smartCommitModalVisible',
    'loadings',
]);
