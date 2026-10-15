import React, { Component } from 'react';

import FormBaseComponent from './FormBaseComponent';
import FormTable from './FormTable';

import _ from 'lodash';
import QueryForm from './QueryForm';



class FormDisplay extends FormBaseComponent {
    // props.arg
    // field:
    // labelname:
    // type: "display"
    // displaytype: form/table/html 表单/表格/html展示

    // disabled: true/false
    // hidden: true/false
    // edit: true/false

    static defaultProps = {
        arg : "{ field: 'formtable',  labelname: '占位', type: 'display', displaytype: 'table' }", // 控件内部属性
        edit : true, // 是否可编辑，不可编辑时显示为label模式
        disabled : false, // 是否禁用，禁用时显示为input模式
        hidden : false, // 是否隐藏，隐藏时仍然能获取到数据
    }

    constructor(props) {
        super(props);
        let value = _.get(props, "arg.defval", null);
        this.state = { error: false, errormsg: "", ref: null, value};
    }

    componentDidMount() {
        if(this.props.onRef && this.props.arg.field)
            this.props.onRef(this, this.props.arg.field);
    }

    _onRef = (ref, field) => {
        this.state.ref = ref;
    }

    _setValue(value) {
        if(value === undefined) return;

        const displaytype = _.get(this.props, "arg.displaytype", "html");
        if(displaytype === "html" || displaytype === "cnh") {
            this.setState({value});
        } else if(displaytype === "table" || displaytype === "form") {
            try{
                this.setState({value: eval('(' + value + ')')});
            } catch(e) {
                console.warn("后台数据错误：", value, e);
            }
        }
    }

    _getValue() {
        if(this.refs && this.refs.cnh) {
            var retValue = [];
            var html = this.refs.cnh.innerHTML;
            if(this.props.arg.child && this.props.arg.child.length > 0) {
                var that = this;
                var controls = this.refs.cnh.getElementsByTagName("input");
                if(controls && controls.length > 0) {
                    this.props.arg.child.forEach(field=> {
                        for( let i = 0; i < controls.length; i++) {
                            if(controls[i].name === field && controls[i].value != undefined) {
                                retValue.push({ field: field, value: controls[i].value });
                                var r = new RegExp('name="' + field + '".*?>', "g");
                                html = html.replace(r, 'name="' + field + '" value="' + controls[i].value + '" >');
                                break;
                            }
                        }
                    });
                }
            }
            retValue.push({ field: this.props.arg.field, value: html });
            return retValue;
        }
        // 其他类型不返回
    }

    _check() {
        return null;
    }

    render() {
        let edit = _.get(this.props, "edit", null);
        const displaytype = _.get(this.props, "arg.displaytype", "html");
        if(!!this.props.hidden)
            return null;

        const {
            value,
        } = this.state;

        if(!value) return null;

        if(displaytype === "table") {
            let arg = _.extend({}, this.props.arg);
            if(!arg.grid) arg.grid = {};
            _.extend(arg.grid, value);
            return <FormTable  {...this.props} arg={arg} onRef={this._onRef}></FormTable>
        } else if(displaytype === "form") {
            let form = this.props.page && this.props.page.form ? _.pick(this.props.page.form, ["labelStyle","layout"]) : {};
            form.class = "noborder";
            _.extend(form, value);
            if(edit !== null) form.edit = edit;

            let page = {form};

            return <QueryForm page={page} onRef={this._onRef}></QueryForm>
        } else if(displaytype === "html") {
            let controlstyle = this.__convertStyle(_.get(this.props.arg, "style", ""));
            return <span style={controlstyle} dangerouslySetInnerHTML={{__html: value}}></span>
        } else if(displaytype === "cnh") {
            let controlstyle = this.__convertStyle(_.get(this.props.arg, "style", ""));
            return <div className="formflex" ref="cnh" style={controlstyle} dangerouslySetInnerHTML={{__html: value}}></div>
        }
        return null;
    }

    __convertStyle(sstyle) {
        let style = {};
        if(typeof(sstyle) == "string") {
            let sstyles = sstyle.toLowerCase()
                            .replace(/-\S/g,function(m){return m.replace("-","").toUpperCase()})
                            .split(";");
            sstyles.forEach(styleItem => {
                let styleArr = styleItem.split(":");
                if(styleArr.length == 2) {
                    style[styleArr[0].trim()] = styleArr[1].trim();
                }
            });
        } else {
            style = sstyle;
        }
        return style;
    }
}
export default FormDisplay
