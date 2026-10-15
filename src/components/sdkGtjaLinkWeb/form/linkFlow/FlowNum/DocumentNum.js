import React from 'react';
import {
    Input,
    Select,
    // Modal,
    Icon,
    message,
} from 'antd';
import linkRequest from '../../../utils/linkRequest';
import Modal from '../../../components/DraggableModal';

import _ from 'lodash';

import FormBaseComponent from '../../reactframework/FormBaseComponent';
import DocumentNumModal from './DocumentNumModal';

class DocumentNum extends FormBaseComponent {

    static defaultProps = {
        arg: "{ labelname: '文号', field: '', flowoption: { piid:'', tiid:'', flowCode:'', auto: false }}",
    }

    state = { ref: null, value: "", valueObj: null}

    componentDidMount() {
        if(this.props.onRef)
            this.props.onRef(this, null);
        const edit = _.get(this.props, "arg.edit", true);
        if(edit) { // 根据需求改为当edit:true时，自动绑定
            this.__autodisplay();
        }
    }

    componentWillReceiveProps(nextProps) {
        const flowoption = _.pick(_.get(this.props,"arg.flowoption",{}), ["piid","tiid","ruleCode"]);
        const nextFlowoption = _.pick(_.get(nextProps,"arg.flowoption",{}), ["piid","tiid","ruleCode"]);
        if(!_.isEqual(flowoption, nextFlowoption)) {
            this.__autodisplay();
        }
    }

    // 仅仅是为了展示
    _setValue(value) { // 直接当作字符串设置为值即可

        this.setState({ value });
    }

    render() {
        const {
            arg,
        } = this.props;

        const {
            labelname
        } = this.props.arg;

        const {
            visible,
            value,
        } = this.state;

        const piid = _.get(this.props, "arg.flowoption.piid");

        let style = this.__getStyle();

        return <>
                {
                    piid
                    ?
                    <Input style={style.controlstyle} value={value}
                    addonAfter={<Icon type="folder" onClick={this.__handleModal} />} />
                    :
                    <span>{value}</span>
                }

                <Modal
                    visible={visible}
                    title={labelname}
                    width={800}
                    onOk={this.__handleOk}
                    onCancel={this.__handleCancel}
                    destroyOnClose
                >
                    <DocumentNumModal
                        arg={arg}
                        onRef={this.__onRef}
                    />
                </Modal>

            </>;
    }

    __getStyle = () => {
        // 主要是layout，如果layout
        const {
            layout, // 如果layout存在，并且layout.normal存在，则表示为固定布局
            style, // 如果未固定布局，需要根据style.width来进行计算宽度
            field
        } = this.props.arg;
        const {
            error,
            errormsg,
        } = this.state;

        let normal = _.get(this.props.arg, "layout.normal", "");
        let className = _.get(this.props.arg, "layout.grid.direction", "") === "v" ? "vformfield forminput": "formfield forminput";
        if(error) {
            className += " has-error";
        }
        if( normal == "") { //为空表示不是固定布局
            let controlstyle;
            let width = _.get(this.props.arg,"style.width", ""); // 默认为230
            if(width !== "") {
                controlstyle = { width : width + "px"};
            } else {
                if(field.indexOf("-") > 0) {
                    controlstyle = { flex : _.get(this.props.arg, "layout.grid.col.innerflex", 1)};
                } else {
                    controlstyle = { flex: _.get(this.props.arg, "layout.grid.col.innerflex", 2)};
                }
            }

            return {
                contentstyle: {className: className},
                labelstyle: "width: " + _.get(this.props.arg, "labelStyle.width", 120) + "px; text-align:right",
                style: {},
                groupstyle: { display: "flex" },
                controlstyle
            };
        } else {
            let width = _.get(this.props.arg,"style.width", 230); // 默认为230
            if(this.props.arg.field.indexOf("-") > 0) {
                width = (width - 30) / 2;
            }
            return {
                contentstyle: {className: className},
                labelstyle: "width: " + _.get(this.props.arg, "labelStyle.width", 120) + "px; text-align:right",
                style: {},
                groupstyle: {},
                controlstyle: {width: width + "px"}
            };
        }
    }
    __onRef = (ref, field) => {
        this.state.ref = ref;
    }
    __handleModal = () => {
        const piid = _.get(this.props, "arg.flowoption.piid");
        if(piid) {
            this.setState({visible: true});
        } else {
            message.error("需在流程创建之后申请文号！");
        }
    }

    // 如果为edit的话，需要从后台看一下是否已经被分配，为了给哪些绑定但是不保存表单的人做的兼容
    __autodisplay = () => {
        const {
            flowoption
        } = this.props.arg;

        const auto = _.get(flowoption, "auto", true);
        if(!auto) return;

        const selectedDocument = _.pick(flowoption, ["piid", "tiid", "ruleCode", "ruleType"]);
        if(!selectedDocument.piid) return;
        if(!selectedDocument.ruleType) selectedDocument.ruleType = "0";

        linkRequest("FLOW_DOCNUMBER_Q0006", selectedDocument).then((result) => {
            if(result.State === 0) {
                if(result.Data.length > 0) { // 已经分配过了
                    const valueObj = {};
                    valueObj.sn = _.get(result.Data[0], "docSn", 0);
                    valueObj.ruleCode = _.get(result.Data[0], "ruleCode", "");
                    valueObj.docNumber = _.get(result.Data[0], "docNumber", "");
                    this.setState({ value: valueObj.docNumber, valueObj}, () => {
                        // 自动绑定的不能设置为修改事件，否则会触发外面的保存
                        super.handleEvent(null, { type: "change", source: "", target: this.props.arg.field }, this.props.arg.field, valueObj.docNumber, valueObj.docNumber, valueObj);
                    });
                }
            }
        });
    }
    // 自动绑定，这部分的自动生成模块被放到了LinkFlowForm的提交之前，此处废弃
    __autobind = () => {
        const {
            flowoption
        } = this.props.arg;

        const selectedDocument = _.pick(flowoption, ["piid", "tiid", "ruleType"]);
        if(!selectedDocument.piid) return;
        if(!selectedDocument.ruleType) selectedDocument.ruleType = "0";

        linkRequest("FLOW_DOCNUMBER_Q0006", selectedDocument).then((result) => {
            if(result.State === 0) {
                if(result.Data.length > 0) { // 已经分配过了
                    const valueObj = {};
                    valueObj.sn = _.get(result.Data[0], "docSn", 0);
                    valueObj.ruleCode = _.get(result.Data[0], "ruleCode", "");
                    valueObj.docNumber = _.get(result.Data[0], "docNumber", "");
                    this.setState({ value: valueObj.docNumber, valueObj}, () => {
                        super.handleEvent(null, "change", this.props.arg.field, valueObj.docNumber, valueObj.docNumber, valueObj);
                    });
                } else { // 没有被分配过，现在需要自动分配
                    let param2 = { ruleType: "0"};
                    if(flowoption.ruleCode) {
                        param2.ruleCodes = flowoption.ruleCode.split(',');
                    } else {
                        param2.flowCode = flowoption.flowCode;
                    }
                    // 查询配置信息
                    linkRequest("FLOW_DOCNUMBER_Q0002", param2).then((result2) => {
                        if(result2.State === 0 && result2.Data.length > 0) {
                            selectedDocument.ruleCode = result2.Data[0].ruleCode;
                            selectedDocument.year = result2.Data[0].docYear && (new Date()).getFullYear();
                            selectedDocument.month = result2.Data[0].docMonth && (new Date()).getMonth() + 1;

                            // 获取当前序号
                            linkRequest("FLOW_DOCNUMBER_Q0003", selectedDocument).then((result3) => {
                                if(result3.State === 0) {
                                    selectedDocument.sn = result3.Data;
                                    this.__bindSn(selectedDocument);
                                }
                            });
                        }
                    });
                }
            }
        });
    }

    // 生成文号
    __bindSn = (selectedDocument) => {

        let param = _.extend( {}, this.props.arg.flowoption, selectedDocument);
        _.extend(param, selectedDocument);

        if(selectedDocument.oldsn) {
            let oldParam = _.pick(this.props.arg.flowoption, ["piid","tiid"]);
            oldParam.ruleCode = selectedDocument.ruleCode;

            // 先取消关系，再绑定文号
            linkRequest("FLOW_DOCNUMBER_D0009", oldParam).then((data) => {
                if(data.State === 0) {
                    linkRequest("FLOW_DOCNUMBER_I0007", param).then((data) => {
                        if(data.State === 0) {
                            this.setState({ visible: false, value: data.Data, valueObj: selectedDocument}, () => {
                                super.handleEvent(null, { type: "change", source: this.props.arg.field, target: this.props.arg.field }, this.props.arg.field, data.Data, data.Data, selectedDocument);
                            });
                        } else {
                            message.error(data.ErrMsg);
                        }
                    });
                } else {
                    message.error(data.ErrMsg);
                }
            });
        } else {
            linkRequest("FLOW_DOCNUMBER_I0007", param).then((data) => {
                if(data.State === 0) {
                    this.setState({ visible: false, value: data.Data, valueObj: selectedDocument}, () => {
                        super.handleEvent(null, { type: "change", source: this.props.arg.field, target: this.props.arg.field }, this.props.arg.field, data.Data, data.Data, selectedDocument);
                    });
                } else {
                    message.error(data.ErrMsg);
                }
            });
        }
    }

    // 保存
    __handleOk = (e) => {
        e.preventDefault();

        let modalValue = this.state.ref.call("getValue");

        if(modalValue !== null) {
            let selectedDocument = modalValue.valueObj;
            this.__bindSn(selectedDocument);
        } else {
            this.setState({visible: false});
        }
    }

    __handleCancel = () => {
        this.setState({visible: false});
    }
}

export default DocumentNum;
