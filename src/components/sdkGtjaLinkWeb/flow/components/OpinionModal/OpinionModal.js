import React from 'react';
import {
    // Modal,
    Form,
    Radio,
    Input,
    Select,
    Alert,
    Row,
    Col,
    Icon,
    message,
    Tooltip,
} from 'antd';
import _ from 'lodash';

import Modal from '../../../components/DraggableModal';
import UserOpinionEditModal from './UserOpinionEditModal';

import { withFlowContext } from '../../LinkFlowContext';
import utils from '../../../utils/utils';
import '../../styles.less';
import classNames from 'classnames';

const formLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
};

/**
 * 意见填写弹窗
 */
class OpinionModal extends React.PureComponent {

    state = {
        lastDecisionOpinion: null,  // 上一次选中的结论性意见(带句号)，用于将结论性意见填写至意见详情时做替换
        userOpinionModalVisible: false,
        selectedUserOpinion: null,
        opnContent: '',//保存点击新增常用意见时的输入框内容，用于默认填入
    }

    componentWillReceiveProps(nextProps) {
        const { opinionModalData } = nextProps;
        const { opinionModalData: oldOpinionModalData } = this.props;
        if (opinionModalData && opinionModalData !== oldOpinionModalData) {
            this.updateCurrentOpinion(nextProps);
        }
    }

    updateCurrentOpinion = (props) => {
        const { opinionModalData, form } = props || this.props;
        if (opinionModalData) {
            form.setFieldsValue({
                decisionOpinionCode: opinionModalData.decisionOpinionCode,
                opnContent: opinionModalData.opnContent,
            });
            this.state.lastDecisionOpinion = `${opinionModalData.decisionOpinionName}。`;
        }
    }

    handleCancel = () => {
        const { dispatch } = this.props;
        dispatch({
            type: 'toggleOpinionModal',
            payload: false,
        });
    }

    handleOk = () => {
        const {
            dispatch,
            form,
        } = this.props;
        form.validateFieldsAndScroll((err, values) => {
            if (err) return;
            // 缓存意见，completeTask时统一提交
            dispatch({
                type: 'saveOpinion',
                payload: values,
            });
        });
    }

    renderForbidden = () => {
        return (
            <Alert
                message="提示"
                description="根据本环节配置，不需要填写意见"
                type="warning"
                showIcon
            />
        );
    }

    handleSelectDecisionOpinion = (e) => {
        const {
            form,
            decisionOpinionList,
            writeDecisionToContent,
        } = this.props;
        if (!writeDecisionToContent) return; // 默认不将结论性意见填入意见详情
        const code = e.target.value;
        const decisionObj = decisionOpinionList.find(item => item.decisionOpinionCode === code);
        if (!decisionObj) return;
        let { decisionOpinion } = decisionObj;
        if (decisionOpinion.indexOf('。') !== decisionOpinion.length - 1) decisionOpinion += '。'; // 在末尾添加句号
        const { lastDecisionOpinion } = this.state;
        let opnContent = form.getFieldValue("opnContent") || "";
        if (lastDecisionOpinion && opnContent.indexOf(lastDecisionOpinion) === 0) {
            // 移除上一次选择的决策性意见
            opnContent = opnContent.replace(lastDecisionOpinion, '');
        }
        // 添加当前决策性意见
        opnContent = decisionOpinion + opnContent;

        this.state.lastDecisionOpinion = decisionOpinion;
        form.setFieldsValue({ opnContent });
    }

    handleSelectOpinion = (valueObj) => {
        const {
            form,
            userOpinionList,
        } = this.props;

        var opnContent = form.getFieldValue("opnContent") || "";
        opnContent += valueObj.label;

        const opinion = (userOpinionList || []).find(op => op.id === valueObj.key);

        // -1标识为非本人常用意见，删除时进行提示
        this.setState({ selectedUserOpinion: opinion || { key: valueObj.key, id: -1, opinion: valueObj.label } }, () => {
            form.setFieldsValue({
                opnContent,
            });
        });
    }

    delOpinionModal = () => {
        const {
            selectedUserOpinion
        } = this.state;

        const { dispatch } = this.props;
        const that = this;

        if (selectedUserOpinion !== null) {
            if (selectedUserOpinion.id === -1) {
                message.warn("该意见为流程常用意见，无法删除！");
            } else {
                Modal.confirm({
                    title: '删除常用意见?',
                    content: `${selectedUserOpinion.opinion}`,
                    onOk() {
                        dispatch({
                            type: 'deleteUserSelfOpinion',
                            payload: { ids: selectedUserOpinion.id }
                        }).then(result => {
                            that.setState({ selectedUserOpinion: null });
                        });
                    },
                });
            }

        } else {
            message.error('请选择意见后删除');
        }
    }

    showEditOpinionModal = () => {
        const {
            form,
            dispatch,
        } = this.props;

        var opnContent = form.getFieldValue("opnContent") || "";
        dispatch({
            type: 'fetchFlowCodeList',
        }).then(data => {
            this.setState({ opnContent, userOpinionModalVisible: true });
        });
    }

    handleEditUserOpinion = (opinion) => {
        const { dispatch } = this.props;
        dispatch({
            type: 'editUserSelfOpinion',
            payload: opinion
        }).then(data => {
            this.setState({ userOpinionModalVisible: false });
        });
    }

    handleCloseUserOpinion = () => {
        this.setState({ userOpinionModalVisible: false });
    }

    render() {
        const {
            opinionModalVisible,
            opinionModalData,
            opinionConfig,
            decisionOpinionList,
            userOpinionList,
            userSelfOpinionList,

            flowCode,
            flowCodeList,// 目前在用的流程列表
            form: { getFieldDecorator },
            // ...restProps
        } = this.props;

        const {
            userOpinionModalVisible,
            selectedUserOpinion,
            opnContent,
        } = this.state;

        const {
            allowWrite,             // 是否允许填写意见,为3时不可填，为2时必填
            showDecisionOpinion,     // 结论性意见是否显示，0-否 1-是
            useDecisionOpinion,     // 结论性意见是否必填，0-否 1-是
        } = opinionConfig;

        const parsedDecisions = (decisionOpinionList).map(({ decisionOpinionCode, decisionOpinion }) => ({ value: decisionOpinionCode, label: decisionOpinion }));

        const hideFooter = {};
        if (allowWrite - 3 === 0) hideFooter.footer = null;

        return (
            <Modal
                title='填写意见'
                visible={opinionModalVisible}
                onCancel={this.handleCancel}
                onOk={this.handleOk}
                width={500}
                centered
                className={utils.getClassName('modal', this.props)}
                {...hideFooter}
            >
                {
                    allowWrite - 3 === 0 ?
                        this.renderForbidden()  // allowWrite=3时禁止填写意见
                        :
                        <Form layout='horizontal' {...formLayout} >
                            {
                                showDecisionOpinion - 1 === 0 &&
                                <Form.Item label='结论性意见'>
                                    {getFieldDecorator('decisionOpinionCode', {
                                        initialValue: _.get(opinionModalData, 'decisionOpinionCode'),
                                        rules: [{ required: useDecisionOpinion - 1 === 0, message: '请选择结论性意见！' }]
                                    })(<Radio.Group options={parsedDecisions} onChange={this.handleSelectDecisionOpinion} />)}
                                </Form.Item>
                            }
                            <Row style={{ marginBottom: "5px" }}>
                                <Col span={6}></Col>
                                <Col span={12}>
                                    <Select
                                        labelInValue
                                        placeholder="可选常用意见"
                                        value={!selectedUserOpinion ? undefined : { key: (selectedUserOpinion.id === -1 ? selectedUserOpinion.key : selectedUserOpinion.id), label: selectedUserOpinion.opinion }}
                                        onChange={this.handleSelectOpinion}>
                                        {userOpinionList.map(opinion => {
                                            let opinionid = !opinion.id ? parseInt(Math.random() * 1000) : opinion.id;
                                            return <Select.Option key={opinionid} value={opinionid} title={opinion.opinion}>{opinion.opinion}</Select.Option>
                                        })}
                                    </Select>
                                </Col>
                                <Col span={6} style={{ lineHeight: "32px" }}>
                                    <Tooltip title="新增个人意见">
                                        <Icon type="plus" onClick={this.showEditOpinionModal} style={{ marginLeft: "10px" }} />
                                    </Tooltip>
                                    <Tooltip title="删除选中个人意见">
                                        <Icon type="delete" onClick={this.delOpinionModal} style={{ marginLeft: "10px" }} />
                                    </Tooltip>
                                </Col>
                            </Row>
                            <Form.Item label='意见详情'>
                                {getFieldDecorator('opnContent', {
                                    initialValue: _.get(opinionModalData, 'opnContent'),
                                    rules: [
                                        { required: allowWrite - 2 === 0, message: '请输入意见详情！' }, // 判断工具侧是否勾选意见必填
                                        { max: 2000, message: '意见详情超过最大值：2000！' }
                                    ],
                                })(<Input.TextArea maxLength={2000} autoSize={{ minRows: 4, maxRows: 8 }} placeholder='请输入意见详情......' />)}
                            </Form.Item>
                        </Form>
                }
                {
                    userOpinionModalVisible
                        ?
                        <UserOpinionEditModal
                            flowCodeList={flowCodeList}
                            flowCode={flowCode}
                            opnContent={opnContent}
                            visible={userOpinionModalVisible}
                            userSelfOpinionList={userSelfOpinionList}
                            onOk={this.handleEditUserOpinion}
                            onCancel={this.handleCloseUserOpinion}
                        />
                        :
                        null
                }
            </Modal>
        );
    }
}

export default Form.create()(withFlowContext(OpinionModal, [
    'opinionModalVisible',
    'opinionModalData',
    'opinionConfig',
    'decisionOpinionList',
    'userSelfOpinionList',
    'userOpinionList',
    'flowCode',
    'flowCodeList',
    'writeDecisionToContent',
]));
