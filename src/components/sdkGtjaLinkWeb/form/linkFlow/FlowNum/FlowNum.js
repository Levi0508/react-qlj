import { Radio, Checkbox, TreeSelect,  Select, Tree, Badge, Tooltip, Icon } from 'antd';

import React, { Component } from 'react';

import FormBaseComponent from '../../reactframework/FormBaseComponent';
import FormLabel from '../../reactframework/FormLabel';
import DocumentNum from './DocumentNum';
import FormExtraLabel from '../../reactframework/FormExtraLabel';
import check from '../../reactframework/Util';

import _ from 'lodash';

class FlowNum extends FormBaseComponent {

    constructor(props) {
        super(props);

        this.state = { value: "",
            valueObj: null,
            error: false,
            errormsg: "",
            ref: null,
        };
    }

    componentDidMount() {
        if(this.props.onRef && this.props.arg.field)
            this.props.onRef(this, this.props.arg.field);
    }

    _setValue(value) { // 直接当作字符串设置为值即可
        const {
            ref,
        } = this.state;

        this.setState({value: value, valueObj: {value}}, () => {
            if(ref) ref.call("setValue", value);
        });
    }

    _getValue() {
        const {
            field
        } = this.props.arg;
        const {
            value,
            valueObj,
        } = this.state;

        return _.isEmpty(value) ? null : { field, value, valueObj };
    }
    _check() {
        const {
            field,
            labelname
        } = this.props.arg;
        let messageList = check(this.props.arg, this.state.value);

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
    _onRef = (ref, field) => {
        this.state.ref = ref;
    }

    __renderHidden = () => {
        return null;
    }
    __renderTemplete = (style, children) => {
        const {
            error,
            errormsg,
        } = this.state;

        const {
            require,
            field,
        } = this.props.arg;

        return <div data-field={field}
                    className={style.contentstyle.className}
               >
                    <FormLabel labelname={this.props.arg.labelname} labelStyle={style.labelStyle}>
                            {!!require && <FormExtraLabel></FormExtraLabel>}
                    </FormLabel>
                    <div className="fieldcontent">
                        {children}
                        {error ? <Tooltip title={errormsg}><Icon className="errormsg" style={{color: "#FF0000"}} type="exclamation-circle" /></Tooltip> : null }
                    </div>
                </div>;
    }
    __renderEdit = () => {
        const {
            arg
        } = this.props;
        let style = this.__getStyle();

        return this.__renderTemplete(style,
            <DocumentNum arg={arg} onRef={this._onRef} handleEvent={this.__handleSelectChange}></DocumentNum>
        );
    }
    __renderDisplay = () => {
        let style = this.__getStyle();

        const {
            value,
        } = this.state;

        return this.__renderTemplete(style, <div className="displaycontent">{value}</div>);
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
        let className = _.get(this.props.arg, "layout.grid.direction", "") === "v" ? "vformfield flownum": "formfield flownum";
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

    // select check radio 的变更事件
    __handleSelectChange = (event, field, value, text, valueObj) => {

        const prevalue = this.state.value;

        if(!_.isEqual(prevalue, value)) {
            this.setState({ value, valueObj }, () => {
                super.handleEvent(null, event, this.props.arg.field, value, value, valueObj);
            });
        }
    }
}
export default FlowNum
