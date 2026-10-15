import React from 'react';
import {
    Select,
    // Modal,
    Icon,
    message
} from 'antd';

import Modal from '../../../components/DraggableModal';
import FormBaseComponent from '../FormBaseComponent';
import StaffSelect from './StaffSelect';
import _ from 'lodash';

class StaffSelectModal extends FormBaseComponent {

    static defaultProps = {
        arg : "{ field: 'staff',  labelname: '人员', type: 'staff', options: { textfield: '{$userName$}({$userCode$})', valuefield: 'userCode'} }", // 控件内部属性
    }

    constructor(props) {
        super(props);

        const {
            value,
            text,
        } =  this.__initDefValue(props.arg.defval);

        const valuefield = _.get(props.arg, "options.valuefield", "userCode");

        this.state = { ref: null, selectRef: null, valuefield, value, text, valueObj: null};
    }

    componentDidMount() {
        if(this.props.onRef)
            this.props.onRef(this, null);
    }

    _setValue(newValue) {
        if(newValue === undefined) return;

        const {
            valuefield
        } = this.state;

        var {
            valueObj
        } = this.state;

        const {
            value,
            text,
        } = this.__initDefValue(newValue);

        if(valueObj) { // 如果valueObj已存在的话，那就是曾经打开过，需要过滤下
            valueObj = valueObj.filter(o => value.findIndex(v => v === o[valuefield]) < 0);
        }

        this.setState({value, text}, () => {
            if(this.state.ref) this.state.ref.call("setValue", {value, text, valueObj});
        });
    }

    _getValue() {
        const {
            field
        } = this.props.arg;
        const {
            value,
            text,
            valueObj,
        } = this.state;

        if(!value || value.length == 0) {
            return null;
        }
        return {field, value, text, valueObj};
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
            text,
            valueObj,
        } = this.state;

        var staffArg = _.extend({}, arg);

        const style = this.__getStyle();

        if(!valueObj) { // 没有选过人，但是有初始化数据的话
            if(!arg.defval && value && value.length > 0) {
                staffArg.defval = [value, text];
            }
        }

        return <>
                <Select
                    style={style.controlstyle}
                    ref={this.__onSelectRef}
                    value={value}
                    mode="tags"
                    open={false}
                    onFocus={this.__handleModal}
                    onChange={this.__handleChange}
                >
                    {value.map((v,i)=><Select.Option value={v} key={v}>{text[i]}</Select.Option>)}
                </Select>
                <Icon type="user-add" onClick={this.__handleModal} style={{ marginLeft: "8px"}} />
                <Modal
                    visible={visible}
                    title={labelname}
                    width={776}
                    onOk={this.__handleOk}
                    onCancel={this.__handleCancel}
                >
                    <StaffSelect
                        arg={staffArg}
                        onRef={this.__onRef}
                    />
                </Modal>
            </>;
    }

    // 初始化数据+
    __initDefValue = (curval) => {

        let value = [];
        let text = [];

        if(_.isString(curval)) { // setValue("015225,016xxx")
            value = curval.split(',');
            text = curval.split(',');
        } else if(_.isArray(curval)) {
            if(curval.length >= 0) {
                if(_.isString(curval[0])) { // setValue(["015225,016xxx","秦xx,xxx"])
                    if(curval.length === 2) {
                        value = curval[0].split(',');
                        text = curval[1].split(',');
                    }
                } else if(_.isObject(curval[0])){ // setValue([{ value: "",text: ""}])
                    value = curval.map(c=>c.value);
                    text = curval.map(c=>c.text);
                }
            }
        } else if(_.isObject(curval)) { // setValue({value: "", text: ""})
            value = curval.value.split(',');
            text = curval.text.split(',');
        }
        return { value, text };
    }

    __getStyle = () => { // 获取样式
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
        let className = _.get(this.props.arg, "layout.grid.direction", "") === "v" ? "vformfield": "formfield";
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
                    controlstyle = { minWidth: "180px", flex: _.get(this.props.arg, "layout.grid.col.innerflex", 2)};
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
    __onSelectRef = (ref) => {
        this.state.selectRef = ref;
    }

    // 打开人员选择弹窗
    __handleModal = () => {
        this.state.selectRef.blur();
        this.setState({visible: true});
    }

    // 关闭人员选择弹窗并保存
    __handleOk = (e) => {
        const min = _.get(this.props.arg, "options.min", null);

        e.preventDefault();

        let modalValue = this.state.ref.call("getValue");
        let value = null;
        let text = null;
        let valueObj = null;
        if(modalValue !== null) {
            value = modalValue.value;
            text = modalValue.text;
            valueObj = modalValue.valueObj;
        } else {
            value = [];
            text = [];
            valueObj = [];
        }
        if(min&&value.length<min){
            message.warn(`至少选择${min}个人员`);
            return;
        }

        this.setState({ visible: false, value, text, valueObj}, () => {
            super.handleEvent(null, { type: "change", source: this.props.arg.field, target: this.props.arg.field }, this.props.arg.field, value, text, valueObj);
        });
    }

    // 关闭人员选择弹窗
    __handleCancel = () => {
        this.state.selectRef.blur();
        this.setState({visible: false});
    }

    // 在已选之上删除选择项
    __handleChange = (selectedValue) => {
        var {
            value,
            text,
            valueObj,
            valuefield,
            ref,
        } = this.state;

        if(selectedValue.length === 0) {
            value = [];
            text = [];
            valueObj =[];
        } else {
            var removeIndexs = [];
            value.forEach((v,i)=>{
                if(selectedValue.findIndex(s=>s === v) < 0) { // 被删掉了一个
                    removeIndexs.push(i);
                    text.splice(i, 1);
                    if(valueObj) valueObj = valueObj.filter(o=>o[valuefield] === v)
                }
            });
            if(removeIndexs.length > 0) {
                removeIndexs.forEach(i=> {
                    value.splice(i,1);
                })
            }
        }

        this.setState({value, text, valueObj}, () => {
            if(ref) ref.call("setValue", { value, text, valueObj});
            super.handleEvent(null, { type: "change", source: this.props.arg.field, target: this.props.arg.field }, this.props.arg.field, value, text, valueObj);
        });
    }
}

export default StaffSelectModal;
