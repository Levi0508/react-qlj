import React, { Component } from 'react';
import FormBaseComponent from './FormBaseComponent';

import { Button } from 'antd';
import _ from 'lodash';

class FormButton extends FormBaseComponent {
    // props.arg
    // field: ok/submit/search 默认为主按钮，颜色为蓝色，其他为普通
    // labelname:
    // type: "input"
    // displaytype: /danger 普通按钮/危险按钮
    // newline：是否换行，自身无效，仅供为了上级适用

    // layout:  普通布局，默认: { nomarl: { }}，需要配合style的width
    //          grid布局，默认：{ grid: { col:{ span: 8 } , direction: "h"} }
    // style: 输入控件的样式,支持 margin-left/margin-right

    // disabled: true/false
    // hidden: true/false

    // 1、主按钮：    { field: 'search', labelname: '查询', type: 'button' }
    // 2、普通按钮：  { field: 'search', labelname: '查询', type: 'button' }
    // 3、警示按钮：  { field: 'button', labelname: '查询', displaytype: 'danger', type: 'button' }
    static defaultProps = {
        arg : " { field: 'search', labelname: '查询', type: 'button' }", // 控件内部属性
        disabled : false, // 是否禁用，禁用时事件无效
        hidden : false, // 是否隐藏
    }

    constructor(props) {
        super(props)
    }

    componentDidMount() {
        if(this.props.onRef && this.props.arg.field)
            this.props.onRef(this, this.props.arg.field);
    }

    render() {
        let edit = _.get(this.props, "edit", true);
        return !!this.props.hidden ? this.__renderHidden() : this.__renderEdit();
    }

    __renderHidden = () => {
        return null;
    }

    __renderEdit = () => {

        let disabled = _.get(this.props, "disabled", false);

        const {
            field,
            labelname
        } = this.props.arg;

        let style = this.__getStyle();

        return <div data-field={field}
                    className="formfield formbutton"
                    draggable={this.props.draggable}
                    onDragStart={(e) => this.props.onDragStart(e, this.props.arg)}
                >
                    <div className="fieldcontent">
                        <Button {...style}
                            disabled={!!disabled}
                            onClick={this.__handleClick}>
                                {labelname}
                        </Button>
                    </div>
                </div>
    }

    __getStyle = () => {
        const {
            style
        } = this.props.arg;

        let buttonStyle = null;
        if(style) {
            buttonStyle = {};
            if(style["margin-left"]) {
                buttonStyle.marginLeft = style["margin-left"];
            }
            if(style["margin-right"]) {
                buttonStyle.marginRight = style["margin-right"];
            }
        }
        var config = {};
        if(buttonStyle) {
            config.className = "customize";
            config.style = buttonStyle;
        }
        switch(this.props.arg.displaytype) {
            case "ok":
            case "submit":
            case "search":
                config["type"] = "primary";
                break;
            case "link":
                config["type"] = "link";
                break;
        }
        return config;
    }

    __handleClick = (e) => {
        super.handleEvent(e, { type: "click", source: this.props.arg.field, target: this.props.arg.field }, this.props.arg.field, null, null, null, this.props.arg);
    }
}

export default FormButton