import { Divider } from 'antd';

import React, { Component } from 'react';

import FormBaseComponent from './FormBaseComponent';

class FormDivider extends FormBaseComponent {
    // props.arg
    // field: 可以为空
    // labelname: 显示名称
    // type: "divider"
    // displaytype: ""(标题)/"title"(标题)/"vertical"(竖分割线)/"line"(横线模式)
    // defval: ""/["",""]
    // options:
    //          unencode:
    //          rows:
    //          min/max: 配合formattertype:n或者rows使用
    constructor(props) {
        super(props)
    }
    render() {
        let edit = _.get(this.props, "edit", true);
        return !!this.props.hidden ? this.__renderHidden() : !edit ? this.__renderDisplay() : this.__renderDisplay();
    }

    __renderHidden = () => {
        return null;
    }

    __renderDisplay = () => {
        const {
            labelname,
            displaytype,
        } = this.props.arg;

        const style = this.__getStyle();

        if(!displaytype || displaytype === "title") {
            return <div className={style.contentstyle.className}>
                        <div className="fieldcontent">
                            {labelname}
                        </div>
                    </div>
        } else {

        }
    }

    __getStyle = () => { // 获取样式
        // 主要是layout，如果layout
        const {
            layout, // 如果layout存在，并且layout.normal存在，则表示为固定布局
            style, // 如果未固定布局，需要根据style.width来进行计算宽度
            field
        } = this.props.arg;

        let normal = _.get(this.props.arg, "layout.normal", "");
        let className = _.get(this.props.arg, "layout.grid.direction", "") === "v" ? "vformfield formdivider": "formfield formdivider";

        if( normal == "") { //为空表示不是固定布局
            let innerflex;
            if(field.indexOf("-") > 0) {
                innerflex = _.get(this.props.arg, "layout.grid.col.innerflex", 1)
            } else {
                innerflex = _.get(this.props.arg, "layout.grid.col.innerflex", 2)
            }
            return {
                contentstyle: {className: className},
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
                style: {},
                groupstyle: {},
                controlstyle: {width: width + "px"}
            };
        }
    }
}

export default FormDivider