import React from 'react';
import {
    // Modal,
    Form,
    Radio,
    Input,
    TreeSelect,
    Alert,
    Row,
    Col,
    message
} from 'antd';
import _ from 'lodash';
import DraggableModal from '../../../components/DraggableModal';

/**
 * 用户意见弹窗
 */
class UserOpinionEditModal extends React.PureComponent {

    state = { ref: null, flowCodes: [], opinionText: "" }

    constructor(props) {
        super(props);
        if (props.flowCode) {
            this.state = { ref: null, flowType: props.flowCode, flowCodes: [], opinionText: props.opnContent || '' };
        } else {
            this.state = { ref: null, flowType: "-1", flowCodes: [], opinionText: props.opnContent || '' };
        }
    }

    __handleInputChange = (e) => {
        this.setState({
            opinionText: e.target.value
        })
    }

    handleCancel = () => {
        const {
            onCancel
        } = this.props;
        if (onCancel) {
            onCancel();
        }
    }

    handleOk = () => {
        const {
            opinionText,
            flowCodes,
            flowType,
        } = this.state;
        const {
            flowCode,
        } = this.props;

        var opinion = null;
        const opinionTextValue = _.trim(opinionText)
        if (!flowCodes.length > 0 && flowType === '0') {
            message.warn('请选择相关文种')
            return;
        }
        if (!opinionTextValue) {
            message.warn('请填写相关意见')
            return;
        }
        if (flowType === "-1") {
            opinion = { flowCodes: "-1", opinions: [{ opinion: opinionText }] };
        } else if (flowType === "0") {
            var opinion = { flowCodes: flowCodes.join(), opinions: [{ opinion: opinionText }] };
        } else {
            var opinion = { flowCodes: flowCode, opinions: [{ opinion: opinionText }] };
        }

        const {
            onOk
        } = this.props;
        if (onOk) {
            onOk(opinion);
        }
    }

    __handleChangeType = (e) => {
        const flowType = e.target.value;
        this.setState({ flowType });
    }

    // tree 的变更事件
    __handleTreeChange = (value, text, extra) => {
        let valueObjs = [];

        if (value && value.length > 0) {
            if (!text || text.length != value.length) {
                return;
            }
            valueObjs = value.map((v, i) => {
                let valueObj = {};
                valueObj["value"] = v;
                valueObj["text"] = text[i];
                return valueObj;
            });
        } else {
            value = [];
            valueObjs = [];
        }
        this.setState({ flowCodes: value });
    }

    onRef = (ref) => {
        this.state.ref = ref;
    }

    render() {
        const {
            visible,
            flowCodeList,
            // ...restProps
        } = this.props;

        const {
            opinionText,
            flowCodes,
            flowType,
        } = this.state;

        let flowCodesTreeData = [];
        flowCodeList.forEach(f => {
            let parentFlowCode = flowCodesTreeData.find(d => d.value === f.fileClassMain);
            if (parentFlowCode) {
                parentFlowCode.children.push({ title: f.flowName, value: f.flowCode, key: f.flowCode });
            } else {
                flowCodesTreeData.push({
                    title: f.fileClassMainName, value: f.fileClassMain, key: f.fileClassMain,
                    children: [{ title: f.flowName, value: f.flowCode, key: f.flowCode }]
                });
            }
        });

        return (
            <DraggableModal
                draggable
                title='常用意见'
                visible={visible}
                onCancel={this.handleCancel}
                onOk={this.handleOk}
                width={500}
                destroyOnClose
            >
                <Row type='flex' style={{ marginBottom: 8 }}>
                    <Col span={8}>适用文种: </Col>
                    {/** todo: 选择全部文种/当前文种/指定文种 */}
                    <Col span={16}>
                        <Radio.Group onChange={this.__handleChangeType} value={flowType}>
                            <Radio value={"-1"}>全部</Radio>
                            <Radio disabled={!this.props.flowCode} value={this.props.flowCode}>当前文种</Radio>
                            <Radio value={"0"}>指定文种</Radio>
                        </Radio.Group>
                    </Col>
                </Row>
                {
                    flowType === "0"
                        ?
                        <Row><Col span={8}></Col>
                            <Col span={16}>
                                <TreeSelect
                                    style={{ width: "250px" }}
                                    defaultValue={flowCodes}
                                    value={flowCodes}
                                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                    treeData={flowCodesTreeData}
                                    placeholder={"请选择使用的文种"}
                                    allowClear={true}
                                    onChange={this.__handleTreeChange}
                                    multiple={true}
                                    maxTagCount={2}
                                    treeCheckable={true}
                                />
                            </Col>
                        </Row>
                        :
                        null
                }

                <Row>
                    <Col span={8}>
                        您的常用意见：
                    </Col>
                    <Col span={16}>
                        <Input.TextArea maxLength={2000} autoSize={{ minRows: 3, maxRows: 4 }} value={opinionText}
                            onChange={this.__handleInputChange} />
                    </Col>
                </Row>
            </DraggableModal>
        );
    }
}

export default UserOpinionEditModal;
