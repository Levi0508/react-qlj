import { Radio, Checkbox, TreeSelect,  Select, Tree, Badge, Tooltip, Icon } from 'antd';

import React, { Component } from 'react';

import FormExtraLabel from '../FormExtraLabel';
import FormBaseComponent from '../FormBaseComponent';
import FormLabel from '../FormLabel';
import DeptSelectModal from './DeptSelectModal';
import check from '../Util';

import _ from 'lodash';

class FormDeptSelect extends FormBaseComponent {


    constructor(props) {
        super(props);

        this.state = {
            error: false, errormsg: "",
            ref: null,
            value: null, // 该数据仅供没有弹出选择使用，如果曾经选择过，还是用getValue方式获取底层数据
        };
    }

    componentDidMount() {
        if(this.props.onRef && this.props.arg.field)
            this.props.onRef(this, this.props.arg.field);
    }

    _setValue(newvalue) {
        this.setState({value: newvalue}, () => {
            const {
                ref,
            } = this.state;

            if(ref) ref.call("setValue", newvalue);
        });
    }

    _getValue() {
        const {
            field,
            fieldtext,
        } = this.props.arg;
        const {
            ref,
            value,
        } = this.state;

        let retArr = [];
        if(ref) {
            const deptObj = ref.call("getValue");
            if(deptObj && deptObj.value) {
                retArr.push({ field: field, value: deptObj.value.join(), valueObj: deptObj.valueObj });
                if(fieldtext && deptObj.text) {
                    retArr.push({ field: fieldtext, value: deptObj.text.join(), valueObj: deptObj.valueObj }) ;
                }
            }
        } else if(value && value.value) {
            retArr.push({ field: field, value: value.value, valueObj: null });
            if(fieldtext && value.text) {
                retArr.push({ field: fieldtext, value: value.text, valueObj: null });
            }
        }

        return retArr.length > 0 ? retArr : null;
    }

    _check() {
        const {
            field,
            labelname
        } = this.props.arg;

        const {
            ref,
            value,
        } = this.state;

        let checkValue = null;
        if(ref) {
            const deptObj = ref.call("getValue");
            if(deptObj)
                checkValue = deptObj.value;
        } else if(value) {
            checkValue = value.value;
        }

        let messageList = check(this.props.arg, checkValue);
        if(messageList && messageList.length > 0) { // 有错误，变红并且展示
            this.setState({error: true, errormsg: messageList.join()});
            return { field: field, labelname: labelname, message: messageList.join() };
        } else {
            this.setState({error: false, errormsg: ""});
        }
        return null;
    }
    render() {
        let edit = _.get(this.props, "edit", true);
        return !!this.props.hidden ? this.__renderHidden() : !edit ? this.__renderDisplay() : this.__renderEdit();
    }


    __renderHidden = () => {
        return null;
    }

    __renderEdit = () => {
        const {
            arg,
        } = this.props;

        let style = this.__getStyle();

        return this.__renderTemplete(style,
            <DeptSelectModal arg={arg} onRef={this._onRef} handleEvent={this.__handleSelectChange}></DeptSelectModal>
        );
    }

    __renderDisplay = () => {
        const {
            ref,
            value,
        } = this.state;

        let text = [];
        if(ref) {
            const deptObj = ref.call("getValue");
            if(deptObj && deptObj.text) {
                text = deptObj.text;
            }
        } else if(value && value.text) {
            text = value.text.split(',');
        }

        let style = this.__getStyle();

        return this.__renderTemplete(style, <div className="displaycontent">{ text.join("，")}</div>);
    }

    __renderTemplete = (style, children) => {
        const {
            error,
            errormsg,
        } = this.state;

        const {
            require,
            field,
            labelname,
            tip,
        } = this.props.arg;

        return <div data-field={field}
                    className={style.contentstyle.className}
               >
                    <FormLabel labelname={labelname} labelStyle={style.labelStyle} tip={tip}>
                            {!!require && <FormExtraLabel></FormExtraLabel>}
                    </FormLabel>
                    <div className="fieldcontent">
                        {children}
                        {error ? <Tooltip title={errormsg}><Icon className="errormsg" style={{color: "#FF0000"}} type="exclamation-circle" /></Tooltip> : null }
                    </div>
                </div>;
    }

    __getStyle = () => { // 获取样式
        // 主要是layout，如果layout
        const {
            layout, // 如果layout存在，并且layout.normal存在，则表示为固定布局
            style, // 如果未固定布局，需要根据style.width来进行计算宽度
            field,
            labelStyle,
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
            let innerflex;
            if(field.indexOf("-") > 0) {
                innerflex = _.get(this.props.arg, "layout.grid.col.innerflex", 1)
            } else {
                innerflex = _.get(this.props.arg, "layout.grid.col.innerflex", 2)
            }
            return {
                contentstyle: {className: className},
                labelStyle: labelStyle,
                style: {},
                groupstyle: { display: "flex" },
                controlstyle: { flex: innerflex, minWidth: "120px" }
            };
        } else {
            let width = _.get(this.props.arg,"style.width", 230); // 默认为230
            if(this.props.arg.field.indexOf("-") > 0) {
                width = (width - 30) / 2;
            }
            return {
                contentstyle: {className: className},
                labelStyle: labelStyle,
                style: {},
                groupstyle: {},
                controlstyle: {width: width + "px"}
            };
        }
    }

    __handleSelectChange = (event, field, value, text, valueObj) => {
        super.handleEvent(null, event, this.props.arg.field, value, text, valueObj);
    }

    _onRef = (ref, field) => {
        this.state.ref = ref;
        if(this.state.value) {
            if(ref) ref.call("setValue", this.state.value);
        }
    }
}
export default FormDeptSelect
