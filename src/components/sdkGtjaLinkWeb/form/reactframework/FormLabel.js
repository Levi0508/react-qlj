import React, { Component } from 'react';
import { Tooltip } from 'antd';
import FormBaseComponent from './FormBaseComponent';
import FormExtraLabel from './FormExtraLabel';

class FormLabel extends FormBaseComponent {
    constructor(props) {
        super(props)
        if (this.props.arg && this.props.arg.defval) {
            this.state = { value: this.props.arg.defval };
        } else {
            this.state = { value: "" };
        }
    }
    componentDidMount() {
        if (this.props.onRef && this.props.arg.field)
            this.props.onRef(this, this.props.arg.field);
    }
    _setValue(value) {
        this.setState({ value: value });
    }
    _getValue() {
        if (this.state.value)
            return { field: this.props.arg.field, oper: "", value: this.state.value };
        return null;
    }
    __convertStyle(sstyle) {
        let style = {};
        if (typeof (sstyle) == "string") {
            let sstyles = sstyle.toLowerCase()
                .replace(/-\S/g, function (m) { return m.replace("-", "").toUpperCase() })
                .split(";");
            sstyles.forEach(styleItem => {
                let styleArr = styleItem.split(":");
                if (styleArr.length == 2) {
                    style[styleArr[0].trim()] = styleArr[1].trim();
                    if(styleArr[0].trim() === "width" || styleArr[0].trim() === "height") {
                        if(styleArr[1].trim() == parseInt(styleArr[1].trim())) {
                            style[styleArr[0].trim()] = styleArr[1].trim() + "px";
                        }
                    }
                }
            });
        } else {
            Object.keys(sstyle).forEach(k => {
                if(k === "width" || k === "height") {
                    if(sstyle[k] == parseInt(sstyle[k])) {
                        sstyle[k] = parseInt(sstyle[k]) + "px";
                    }
                }
            });
            style = sstyle;
        }
        return style;
    }

    render() {
        if (this.props.labelname && this.props.labelname.length > 0) {//前缀模式
            let labelStyle = {};
            if (this.props.labelStyle) {
                labelStyle = this.__convertStyle(this.props.labelStyle);
            }
            let style = Object.assign({}, this.props.style, labelStyle);
            return <span className="fieldlabel" style={style}>
                    {this._renderTip()}
                    {this.props.children}
                    {this.props.labelname}
                    ：
                    </span>;
        } else if (this.props.arg) {//独立模式
            return !!this.props.hidden ? this.__renderHidden() : this.__renderEdit();
        } else {
            return null;
        }
    }
    __renderHidden = () => {
        return null;
    }
    __renderEdit = () => {
        let displaytype = _.get(this.props.arg, "displaytype", "");
        let style = this.__getStyle();
        if (displaytype === "html") {
            return this.__renderTemplete(style,
                <span style={style.controlstyle} dangerouslySetInnerHTML={{ __html: this.state.value }}></span>
            );
        }
        return this.__renderTemplete(style,
            <span style={style.controlstyle}>{this.state.value}</span>
        );
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
            tip
        } = this.props.arg;

        return <div data-field={field}
            className={style.contentstyle.className}
            draggable={this.props.draggable}
            onDragStart={(e) => this.props.onDragStart(e, this.props.arg)}
        >
            <FormLabel labelname={labelname} labelStyle={style.labelstyle} tip={tip}>
                {!!require && <FormExtraLabel></FormExtraLabel>}
            </FormLabel>
            <div className="fieldcontent">
                {children}
                {error ? <span className="errormsg">{errormsg}</span> : null}
            </div>
        </div>;
    }

    _renderTip = () => {
        const {
            tip
        } = this.props;
        const tipView = []
        tip && tip.indexOf('\n') >= 0 && tip.split("\n").forEach((v, i) => {
            tipView.push(v)
        })
        tip && tip.indexOf('<br>') >= 0 && tip.split("<br>").forEach((v, i) => {
            tipView.push(v)
        })
        if (!tip) return null;
        return <Tooltip title={tipView.length > 0 ? <div>{tipView.map(item => { return <span>{item}<br /></span> })}</div> : tip}>
            <img style={{ width: "15px", height: "15px", top: "15px" }}
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAAXNSR0IArs4c6QAABUVJREFUSA3lV21I3WUUP+deXzObrWnozDkVt2YjqAzGGrjRh1oxxHBBDcTNUS3Z9FYUUaJRH/rQtYYtFlmXXj40a20tDIqwjcA2BHvbymXXF1KZS600Tb33nn7n730uz727dxP6FD3gfc5z3n7/55zznOeR6P82eLkbXtMqN3KIKoXpDtisJqFcYpoFPYa/X5ip03UVdfof4j+W4/OKwADcJkIvkshttkNmngc/mUhchs/EC6DbXW5qGWjgC4Yfb04IXHRYVgRnyCcklWoIoO+www8A0wk4//A+nqrokqTRXrp+keiWkFAl5FUikgXlGUSgcaiR34gH6viLJyj2SklA6ARA18NJPws9NfQYfxhP1+YVHJJreY6eBm8/bFNczAfL88nTsZODtp7Sl+y4+DXJCczSGRiugfjj9Cza1beHp23DZhGXr41Kk4Qm+vfzRVumdEGrbEY9HIWPHHz4K8MebojViQK+9bAk//YXdSFcmxHad2sbqaaZ4SI8Ct+SNJmi55DbfchthrKh1yduenT4AH9h9HQGeBEi9TV8ZUOnbsjD7bY8UhjKvDhDj4RBTycnUZ0NqrsEaCfkTyB/i3D2KVB7sF5HQfp8rVd22o6HG9nvdlMV9BZxAlpLDkq2LY8AQ3ANBM/CWRClugchnLcVfV7aC5CtcNSdnkIl2MF2hLDczbwDeiEk8VBhKwrLGv4D/BWWbQh55uIifFsjArwYoF0I3yrE/u1+D5+1dBwyxHSPQzDV/1TPE0Y+4OETaoPjdp0QbTJ8M+MjX8DH/on13rJX5WrDjwAjb86xQYOIyoVRxIyGwRO3r6ZvLZ4hnQ9FTksNw8zhjzyOXadNL9Bdhu8Ab/JKOvJWgQYwvruBuo3Qnl1M1dDZEns0nBQJ1YV1v7FtIjTTMaVRpncbXpISF9yULwFJBvD3dkEZJZ0HG3nQXiutVb4wRZ8gResRzo8GPXwyVkfXSMHSBzEVGbmzY1RGnsNgGjWCK83hKn8Pud2iBQcHDyaycWWF/UoYB4pLOXZRWtjo70TGsfw3W+kZVHkVonQOFXNvtwc9K8EozyB0VQSaIzhLwKhKvWE0JrkJbKPY1UfEjUJ6HMU260ql7Wc9PBmlELM4M0I5cK6bjETU2XFqEo2EdYtibOIue8ZREzib+NCegXoeiqtkMd0uKg4vo4G15DVkcLYBTaDQsolLukPkFCUihRBeeQSCSz0A+qeMtrNjXSAQx3VGY45qfcqLHfkbaQgF1YWcHY2Vxa61CMG7T/mcsnSsHFp/dOgLQ0L0A87qBPp0CVqmdpt/PQq9UhMS8eFDT6LNVhiHkR3j0v4RofChUrMXgtRiFBLNmhJtPInkyi/zykpE8Hml2UVP6mxGBFgZqUxNqNRJCkkDIpDwXEJWhReHHxV5vuyIpBhn9qyvkxmiDpzzfOz2ncEGPm3Lo4DPe3iE3JpjDqBi2wteElwccYbQWjhkHKmc4DhlxmroZeDvxTNJZBuKtndVBj0cq4PoXjqQl1rs6HWUXJI+X1wZ1GS/HjXEOPg1CN85POpO2R6KXpbyQAgXjchG7LQP9XIn6uVXW0fpuMAqCL8uNVQrEX4cN/LiYu/AHfuzyu2hL5fJOaoIhpzLolqjAZvPcLHcjx7/u61r6ITAqgDwXIS8BU1+N5y5HSM8/sAbQM8bw9nTWy0P65vQA1aE5SPgNdU2kK/ZejY5MuvnssBGr6hNSkPz9AD2UYm83Wz4kZmdPq07PJYr9P7l+raxWRawUdZ5XbtkLkxTHh4O+p/EnDuZRm/YQGNfbkVB/hfGPyac8XEnYx4XAAAAAElFTkSuQmCC"></img>
        </Tooltip>;
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
        let className = _.get(this.props.arg, "layout.grid.direction", "") === "v" ? "vformfield" : "formfield";
        if (error) {
            className += " has-error";
        }
        if (normal == "") { //为空表示不是固定布局
            let controlstyle = this.__convertStyle(_.get(this.props.arg, "style", ""));
            let width = _.get(this.props.arg, "style.width", ""); // 默认为230
            if (width !== "") {
                _.extend(controlstyle, { width: width + "px", lineHeight: "32px" });
            } else {
                if (field.indexOf("-") > 0) {
                    _.extend(controlstyle, { flex: _.get(this.props.arg, "layout.grid.col.innerflex", 1), lineHeight: "32px" });
                } else {
                    _.extend(controlstyle, { flex: _.get(this.props.arg, "layout.grid.col.innerflex", 2), lineHeight: "32px" });
                }
            }

            return {
                contentstyle: { className: className },
                labelstyle: labelStyle,
                style: {},
                groupstyle: { display: "flex" },
                controlstyle
            };
        } else {
            let width = _.get(this.props.arg, "style.width", 230); // 默认为230
            if (this.props.arg.field.indexOf("-") > 0) {
                width = (width - 30) / 2;
            }
            return {
                contentstyle: { className: className },
                labelstyle: labelStyle,
                style: {},
                groupstyle: {},
                controlstyle: { width: width + "px", lineHeight: "32px" }
            };
        }
    }
}
export default FormLabel