import { Input, DatePicker, Tooltip, Icon, TimePicker } from 'antd';

import React, { Component } from 'react';

import FormLabel from './FormLabel';
import FormBaseComponent from './FormBaseComponent';
import FormExtraLabel from './FormExtraLabel';
import check from './Util';

import zhCN from 'antd/lib/locale-provider/zh_CN';
import moment from 'moment';
import 'moment/locale/zh-cn';
const { MonthPicker, RangePicker, WeekPicker } = DatePicker;
moment.locale('zh-cn');

import _ from 'lodash';

class FormDate extends FormBaseComponent {
    constructor(props) {
        super(props);

        const {
            value,
            valueObj,
            displaytype,
            momenttype,
        } = this.__initData(this.props.arg);

        this.state = {
            displaytype: displaytype,
            momenttype: momenttype,
            value: value,
            valueObj: valueObj,
            leftopen: false,
            rightopen: false
        };
    }
    componentDidMount() {
        if (this.props.onRef && this.props.arg.field)
            this.props.onRef(this, this.props.arg.field);
    }
    // 更换了displaytype
    componentWillReceiveProps(nextProps) {
        if (nextProps.arg.displaytype !== this.props.arg.displaytype) {
            const {
                value,
                valueObj,
                displaytype, // 展示用
                momenttype, // 取值用，比如设置为yyyymm，则取值为202005，展示为2020-05
            } = this.__initData(nextProps.arg);

            this.setState({
                displaytype: displaytype,
                momenttype: momenttype,
                value: value,
                valueObj: valueObj,
            });
        }
    }

    _setValue(value) {
        const {
            field
        } = this.props.arg;

        const {
            momenttype,
        } = this.state;

        var convert = this.__convert;

        if (value) {
            if (Array.isArray(value)) {
                let cvalue = [];
                value.forEach((valueitem) => {
                    cvalue.push(convert(valueitem, momenttype));
                })
                this.setState({ value: cvalue.map(c => c == null ? null : c.format(momenttype)), valueObj: cvalue }, () => {
                    super.handleEvent(null, { type: "change", source: "", target: field }, field, cvalue.map(c => c == null ? null : c.format(momenttype)));
                });
            } else {
                this.setState({ value: convert(value, momenttype).format(momenttype), valueObj: convert(value, momenttype) }, () => {
                    super.handleEvent(null, { type: "change", source: "", target: field }, field, value);
                });
            }
        } else {
            if (field.indexOf("-") >= 0) {
                this.setState({ value: [null, null], valueObj: [null, null] }, () => {
                    super.handleEvent(null, { type: "change", source: "", target: field }, field, [null, null]);
                });
            } else {
                this.setState({ value: null, valueObj: null }, () => {
                    super.handleEvent(null, { type: "change", source: "", target: field }, field, null);
                });
            }
        }
    }
    _getValue() {
        const {
            field,
        } = this.props.arg;

        const {
            value
        } = this.state;
        if (value === undefined || value === null) return null;

        if (field.indexOf("-") > 0) {//区间，但是分别绑定两个字段
            let retValue = [];
            let fields = field.split("-");
            fields.forEach((item, index) => {
                if (typeof (value[index]) != "undefined" && value[index] !== null) {
                    retValue.push({ field: fields[index], value: value[index] });
                }
            });
            return retValue;
        } else {
            return { field: field, value: value };
        }
    }
    _check() {
        const {
            field,
            labelname
        } = this.props.arg;
        let messageList = check(this.props.arg, this.state.value);
        if (messageList && messageList.length > 0) { // 有错误，变红并且展示
            this.setState({ error: true, errormsg: messageList.join() });
            return { field: field, labelname: labelname, message: messageList.join() };

        } else {
            this.setState({ error: false, errormsg: "" });
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
            draggable={this.props.draggable}
            onDragStart={(e) => this.props.onDragStart(e, this.props.arg)}
        >
            <FormLabel labelname={labelname} labelStyle={style.labelStyle} tip={tip}>
                {!!require && <FormExtraLabel></FormExtraLabel>}
            </FormLabel>
            <div className="fieldcontent">
                {children}
                {error ? <Tooltip title={errormsg}><Icon className="errormsg" style={{ color: "#FF0000" }} type="exclamation-circle" /></Tooltip> : null}
            </div>
        </div>;
    }
    __renderEdit = () => {
        const {
            disabled,
        } = this.props;

        const {
            field,
            require,
        } = this.props.arg;

        const {
            displaytype,
            valueObj
        } = this.state;

        let style = this.__getStyle();
        const max = String(_.get(this.props.arg, "options.max", null));
        const min = String(_.get(this.props.arg, "options.min", null));


        if (field.indexOf("-") > 0) {              //两个日期框
            const disabledStartDate = (startValue) => {
                let flag = false;
                if (valueObj && valueObj.length >= 2 && valueObj[1]) {
                    flag = startValue.valueOf() > valueObj[1].valueOf()
                }
                if (flag) return flag;

                flag = max === 'null' ? false : max.length === 8 ? startValue > moment(max).add(1, 'day').toDate() : startValue > moment().add(max, 'day').toDate();
                if (flag) return flag;
                flag = min === 'null' ? false : min.length === 8 ? startValue < moment(min).add('day').toDate() : startValue < moment().add(min, 'day').toDate();

                return flag;
            }

            const disabledEndDate = (endValue) => {
                let flag = false;
                if (valueObj && valueObj.length >= 2 && valueObj[0]) {
                    flag = endValue.valueOf() < valueObj[0].valueOf()
                }

                if (flag) return flag;

                flag = max === 'null' ? false : max.length >= 8 ? endValue > moment(max).add(1, 'day').toDate() : endValue > moment().add(max, 'day').toDate();
                if (flag) return flag;
                flag = min === 'null' ? false : min.length >= 8 ? endValue < moment(min).add('day').toDate() : endValue < moment().add(min, 'day').toDate();

                return flag;
            }

            const placeholder = _.get(this.props.arg, "placeholder", [])
            if (displaytype == "YYYY-MM-DD HH:mm") {//日期+时间
                return this.__renderTemplete(style,
                    <span className="ant-input-group ant-input-group-compact" style={style.groupstyle}>
                        <DatePicker style={style.controlstyle} disabled={!!disabled} showTime={{ format: 'HH:mm' }} format={displaytype}
                            onChange={(date, dateStr) => this.__handleChange([dateStr, null])} allowClear={!require} placeholder={placeholder[0] || ""}
                            disabledDate={disabledStartDate}
                            value={valueObj[0]} />
                        <Input style={{ width: 30, borderLeft: 0, pointerEvents: 'none', backgroundColor: '#fff' }} placeholder="~" disabled />
                        <DatePicker style={style.controlstyle} disabled={!!disabled} showTime={{ format: 'HH:mm' }} format={displaytype}
                            onChange={(date, dateStr) => this.__handleChange([null, dateStr])} allowClear={!require} placeholder={placeholder[placeholder.length - 1] || ""}
                            disabledDate={disabledEndDate}
                            value={valueObj[1]} />
                    </span>
                );
            } else if (displaytype == "YYYY-MM") {
                return this.__renderTemplete(style,
                    <span className="ant-input-group ant-input-group-compact" style={style.groupstyle}>
                        <MonthPicker className="rangeleft" style={style.controlstyle} disabled={!!disabled} allowClear={!require}
                            onChange={(date, dateStr) => this.__handleChange([dateStr, null])} placeholder={placeholder[0] || ""}
                            value={valueObj[0]} />
                        <Input style={{ width: 30, borderLeft: 0, pointerEvents: 'none', backgroundColor: '#fff' }} placeholder="~" disabled />
                        <MonthPicker className="rangeright" style={style.controlstyle} disabled={!!disabled} allowClear={!require}
                            onChange={(date, dateStr) => this.__handleChange([null, dateStr])} placeholder={placeholder[placeholder.length - 1] || ""}
                            value={valueObj[1]} />
                    </span>
                );
            } else if (displaytype == "YYYY-MM-DD") {//日期
                return this.__renderTemplete(style,
                    <span className="ant-input-group ant-input-group-compact" style={style.groupstyle}>
                        <DatePicker style={style.controlstyle} disabled={!!disabled} allowClear={!require} format={displaytype}
                            onChange={(date, dateStr) => this.__handleChange([dateStr, null])} placeholder={placeholder[0] || ""}
                            disabledDate={disabledStartDate}
                            value={valueObj[0]} />
                        <Input style={{ width: 30, borderLeft: 0, pointerEvents: 'none', backgroundColor: '#fff' }} placeholder="~" disabled />
                        <DatePicker style={style.controlstyle} disabled={!!disabled} allowClear={!require} format={displaytype}
                            onChange={(date, dateStr) => this.__handleChange([null, dateStr])} placeholder={placeholder[placeholder.length - 1] || ""}
                            disabledDate={disabledEndDate}
                            value={valueObj[1]} />
                    </span>
                );
            } else if (displaytype == "YYYY") {
                return this.__renderTemplete(style,
                    <span className="ant-input-group ant-input-group-compact" style={style.groupstyle}>
                        <DatePicker style={style.controlstyle} disabled={!!disabled} allowClear={!require} format={displaytype} mode={"year"}
                            onPanelChange={(dateStr) => this.handlePanelChange([dateStr, null])} placeholder={placeholder[0] || ""}
                            open={this.state.leftopen} onOpenChange={this.handleLeftOpenChange}
                            value={valueObj[0]} />
                        <Input style={{ width: 30, borderLeft: 0, pointerEvents: 'none', backgroundColor: '#fff' }} placeholder="~" disabled />
                        <DatePicker style={style.controlstyle} disabled={!!disabled} allowClear={!require} format={displaytype} mode={"year"}
                            onPanelChange={(dateStr) => this.handlePanelChange([null, dateStr])}
                            open={this.state.rightopen} onOpenChange={this.handleRightOpenChange} placeholder={placeholder[placeholder.length - 1] || ""}
                            value={valueObj[1]} />
                    </span>
                );
            } else if (displaytype == "HH:mm") {//小时+分钟
                const minuteStep = Number(_.get(this.props.arg, "options.minuteStep", 1));
                return this.__renderTemplete(style,
                    <span className="ant-input-group ant-input-group-compact" style={style.groupstyle}>
                        <TimePicker disabled={!!disabled} allowClear={!require} minuteStep={minuteStep}
                            format="HH:mm"
                            onChange={(date, dateStr) => this.__handleChange([dateStr, null])}
                            value={valueObj[0]} placeholder={placeholder[0] || ""}
                            defaultOpenValue={moment('00:00:00', 'HH:mm')}
                        />
                        <Input style={{ width: 30, borderLeft: 0, pointerEvents: 'none', backgroundColor: '#fff' }} placeholder="~" disabled />
                        <TimePicker disabled={!!disabled} allowClear={!require} minuteStep={minuteStep}
                            format="HH:mm"
                            onChange={(date, dateStr) => this.__handleChange([null, dateStr])}
                            value={valueObj[1]} placeholder={placeholder[placeholder.length - 1] || ""}
                            defaultOpenValue={moment('00:00:00', 'HH:mm')}
                        />
                    </span>
                )
            } else if (displaytype == 'YYYY-MM-DD HH:mm:ss') {
                return this.__renderTemplete(style,
                    <span className="ant-input-group ant-input-group-compact" style={style.groupstyle}>
                        <DatePicker style={style.controlstyle} disabled={!!disabled} showTime format={displaytype}
                            onChange={(date, dateStr) => this.__handleChange([dateStr, null])} allowClear={!require} placeholder={placeholder[0] || ""}
                            disabledDate={disabledStartDate}
                            value={valueObj[0]} />
                        <Input style={{ width: 30, borderLeft: 0, pointerEvents: 'none', backgroundColor: '#fff' }} placeholder="~" disabled />
                        <DatePicker style={style.controlstyle} disabled={!!disabled} showTime format={displaytype}
                            onChange={(date, dateStr) => this.__handleChange([null, dateStr])} allowClear={!require} placeholder={placeholder[placeholder.length - 1] || ""}
                            disabledDate={disabledEndDate}
                            value={valueObj[1]} />
                    </span>
                );
            }
        } else {//单个
            const disabledDate = (current) => {
                let flag = false;

                flag = max === 'null' ? false : max.length >= 8 ? current > moment(max).add('day').toDate() : current > moment().add(max, 'day').toDate();
                if (flag) return flag;
                flag = min === 'null' ? false : min.length >= 8 ? current < moment(min).add('day').toDate() : current < moment().add(min, 'day').toDate();

                return flag;
            }
            if (displaytype == "YYYY-MM-DD") {//日期
                return this.__renderTemplete(style,
                    <DatePicker disabled={!!disabled} allowClear={!require} onChange={(date, dateStr) => this.__handleChange(dateStr)}
                        value={valueObj} placeholder={this.props.arg.placeholder || ""} disabledDate={disabledDate} />
                );
            } else if (displaytype == "YYYY-MM") {//月份
                return this.__renderTemplete(style,
                    <MonthPicker disabled={!!disabled} allowClear={!require} onChange={(date, dateStr) => this.__handleChange(dateStr)}
                        value={valueObj} placeholder={this.props.arg.placeholder || ""} />
                );
            } else if (displaytype == "YYYY") {    //仅显示年份
                return this.__renderTemplete(style,
                    <DatePicker disabled={!!disabled} allowClear={!require} onPanelChange={this.handlePanelChange}
                        open={this.state.leftopen}
                        onOpenChange={this.handleLeftOpenChange}
                        format={"YYYY"} mode={"year"} value={valueObj} placeholder={this.props.arg.placeholder || ""} />
                );
            } else if (displaytype == "YYYY-MM-DD HH:mm") {//日期+时间
                return this.__renderTemplete(style,
                    <DatePicker disabled={!!disabled} allowClear={!require} showTime={{ format: 'HH:mm' }} format={displaytype}
                        onChange={(date, dateStr) => this.__handleChange(dateStr)}
                        value={valueObj} placeholder={this.props.arg.placeholder || ""} disabledDate={disabledDate} />
                );
            } else if (displaytype == "HH:mm") { //小时+分钟
                const minuteStep = Number(_.get(this.props.arg, "options.minuteStep", 1));
                return this.__renderTemplete(style,
                    <TimePicker disabled={!!disabled} allowClear={!require} minuteStep={minuteStep}
                        // onPanelChange={this.handlePanelChange}
                        format="HH:mm"
                        onChange={(date, dateStr) => this.__handleChange(dateStr)}
                        value={valueObj} placeholder={this.props.arg.placeholder || ""}
                        defaultOpenValue={moment('00:00:00', 'HH:mm')}
                    />)
            } else if (displaytype == 'YYYY-MM-DD HH:mm:ss') {
                return this.__renderTemplete(style,
                    <DatePicker disabled={!!disabled} allowClear={!require} showTime={{ format: 'HH:mm:ss' }} format={displaytype}
                        onChange={(date, dateStr) => this.__handleChange(dateStr)}
                        value={valueObj} placeholder={this.props.arg.placeholder || ""} disabledDate={disabledDate} />
                );
            }
        }
    }
    __renderDisplay = () => { // 展示模式
        let style = this.__getStyle();
        const {
            field
        } = this.props.arg;
        const {
            displaytype,
            valueObj,
        } = this.state;
        if (field.indexOf("-") > 0) {
            return this.__renderTemplete(style, <div className="displaycontent" style={style.style}>{valueObj.map(v => v == null ? "" : v.format(displaytype)).join("~")}</div>);
        } else {
            return this.__renderTemplete(style, <div className="displaycontent" style={style.style}>{valueObj == null ? "" : valueObj.format(displaytype)}</div>);
        }
    }

    __getStyle = () => { // 获取样式
        // 主要是layout，如果layout
        const {
            layout, // 如果layout存在，并且layout.normal存在，则表示为固定布局
            style, // 如果未固定布局，需要根据style.width来进行计算宽度
            field,
            child,
            ref,
            labelStyle,
        } = this.props.arg;
        const {
            error,
            errormsg,
        } = this.state;

        let normal = _.get(this.props.arg, "layout.normal", "");
        let className = _.get(this.props.arg, "layout.grid.direction", "") === "v" ? "vformfield formdate" : "formfield formdate";
        if ((child && child.length > 0) || ref) {

        } else {
            className += ' formflex';
        }
        let displaycontentStyle = this.__convertStyle(style);
        if (error) {
            className += " has-error";
        }
        if (normal == "") { //为空表示不是固定布局
            let innerflex;
            if (field.indexOf("-") > 0) {
                innerflex = _.get(this.props.arg, "layout.grid.col.innerflex", 1)
            } else {
                innerflex = _.get(this.props.arg, "layout.grid.col.innerflex", 2)
            }
            return {
                contentstyle: { className: className },
                labelStyle: labelStyle,
                style: displaycontentStyle,
                groupstyle: { display: "flex" },
                controlstyle: { flex: innerflex }
            };
        } else {
            let width = _.get(this.props.arg, "style.width", 230); // 默认为230
            if (this.props.arg.field.indexOf("-") > 0) {
                width = (width - 30) / 2;
            }
            return {
                contentstyle: { className: className },
                labelStyle: labelStyle,
                style: displaycontentStyle,
                groupstyle: {},
                controlstyle: { width: width + "px" }
            };
        }
    }

    __convertStyle(sstyle) { // 字符串转换
        let style = {};
        if (typeof (sstyle) == "string") {
            let sstyles = sstyle.toLowerCase()
                .replace(/-\S/g, function (m) { return m.replace("-", "").toUpperCase() })
                .split(";");
            sstyles.forEach(styleItem => {
                let styleArr = styleItem.split(":");
                if (styleArr.length == 2) {
                    style[styleArr[0].trim()] = styleArr[1].trim();
                }
            });
        } else if (_.isObject(sstyle)) {
            style = sstyle;
        }
        return style;
    }

    __initData(arg) {
        //yyyymmdd;
        //yyyy-mm-dd;
        //yyyymm;
        //yyyy-mm;
        //yyyymmdd hhmi;
        //yyyy-mm-dd hh:mi

        let datetype = _.get(arg, "displaytype", _.get(arg, "datetype", "yyyymmdd"));
        var displaytype, momenttype;
        switch (datetype.toLowerCase()) {
            case "yyyy":
                displaytype = "YYYY";
                momenttype = "YYYY";
                break;
            case "yyyymm":
                displaytype = "YYYY-MM"
                momenttype = "YYYYMM";
                break;
            case "yyyy-mm-dd":
                displaytype = "YYYY-MM-DD"
                momenttype = "YYYY-MM-DD";
                break;
            case "yyyy-mm":
                displaytype = "YYYY-MM"
                momenttype = "YYYY-MM";
                break;
            case "yyyymmddhhmi":
                displaytype = "YYYY-MM-DD HH:mm"
                momenttype = "YYYYMMDDHHmm";
                break;
            case "yyyymmdd hhmi":
                displaytype = "YYYY-MM-DD HH:mm"
                momenttype = "YYYYMMDD HHmm";
                break;
            case "yyyy-mm-dd hh:mi":
                displaytype = "YYYY-MM-DD HH:mm"
                momenttype = "YYYYMMDD HHmm";
                break;
            case "hh:mm":
                displaytype = "HH:mm"
                momenttype = "HH:mm";
                break;
            case "yyyy-mm-dd hh:mm:ss":
                displaytype = "YYYY-MM-DD HH:mm:ss"
                momenttype = "YYYY-MM-DD HH:mm:ss";
                break;
            default:
                displaytype = "YYYY-MM-DD"
                momenttype = "YYYYMMDD";
                break;
        }

        const {
            field,
            defval,
        } = arg;

        const convert = this.__convert;
        const defValueFunc = this.__getDefaultValue;
        var value, valueObj;
        if (field.indexOf("-") > 0) { //区间
            let fields = field.split("-");
            valueObj = [null, null];
            if (defval && Array.isArray(defval)) {
                fields.forEach((f, index) => {
                    if (index < defval.length) {
                        valueObj[index] = convert(defValueFunc(displaytype, defval[i]), momenttype);
                    }
                });
            }
            value = valueObj.map(v => v == null ? null : v.format(momenttype));
        } else {
            valueObj = null;
            if (_.isObject(defval) && defval.value !== undefined && defval.value !== null) {
                valueObj = convert(defValueFunc(displaytype, defval.value), momenttype);
            } else if (defval !== undefined && defval !== null) {
                valueObj = convert(defValueFunc(displaytype, defval), momenttype);
            }
            value = valueObj == null ? null : valueObj.format(momenttype);
        }

        return { value, valueObj, displaytype, momenttype };
    }
    __getDefaultValue(displaytype, value) {
        if (value === "") return value;
        if (value < 100) { // 小于100的是默认数据，例如0是当天
            switch (displaytype) {
                case "YYYY-MM-DD":
                    return moment().add(value, "days").format('YYYYMMDD');
                case "YYYY-MM":
                    return moment().add(value, "months").format('YYYYMM');
                case "YYYY":
                    return moment().add(value, "years").format('YYYY');
            }
        } else {
            return value;
        }
    }
    __convert(datestr, momenttype) {
        if (!datestr) return null;
        if (datestr.length === 13) {
            return moment(parseInt(datestr));
        }
        return moment(datestr.toString(), momenttype || this.state.momenttype);
    }
    __handleChange = (dateStr) => {
        const {
            field,
        } = this.props.arg;

        const max = String(_.get(this.props.arg, "options.max", null));
        const min = String(_.get(this.props.arg, "options.min", null));



        if (max !== 'null' && max.length >= 8) {
            if (moment(dateStr) > moment(max)) {
                dateStr = max;
            }
        } else if (min !== 'null' && min.length >= 8) {
            if (moment(dateStr) < moment(min)) {
                dateStr = min;
            }
        }


        const {
            value, // 存放外部获取值
            valueObj, // 存放monent类型
            momenttype
        } = this.state;
        const convert = this.__convert;

        if (field.indexOf("-") > 0) { //区间
            let cvalue = [];
            dateStr.forEach((valueitem, valueindex) => {
                if (valueitem != undefined && valueitem != null) {
                    if (valueitem === "") { // 清空会出现 ""
                        cvalue.push(null);
                    } else {
                        cvalue.push(convert(valueitem, momenttype));
                    }
                } else
                    cvalue.push(valueObj[valueindex]);
            });
            this.setState({ value: cvalue.map(c => c == null ? null : c.format(momenttype)), valueObj: cvalue }, () => {
                super.handleEvent(null, { type: "change", source: field, target: field }, field, cvalue.map(c => c == null ? null : c.format(momenttype)));
            });

        } else if (dateStr) { // 设置了值
            let cvalue = convert(dateStr, momenttype);

            this.setState({ value: cvalue == null ? null : cvalue.format(momenttype), valueObj: cvalue }, () => {
                super.handleEvent(null, { type: "change", source: field, target: field }, field, cvalue == null ? null : cvalue.format(momenttype));
            });

        } else { // 清空了
            this.setState({ value: null, valueObj: null }, () => {
                super.handleEvent(null, { type: "change", source: field, target: field }, field, null);
            });

        }
    }


    handlePanelChange = (dateStr) => {
        this.__handleChange(dateStr);
        if (Array.isArray(dateStr)) {
            if (dateStr[0] && !dateStr[1])
                this.setState({ leftopen: false });
            else if (!dateStr[0] && dateStr[1])
                this.setState({ rightopen: false });
        }
        else
            this.setState({ leftopen: false });
    }
    handleLeftOpenChange = (status) => {
        if (status)
            this.setState({ leftopen: true })
        else
            this.setState({ leftopen: false })
    }
    handleRightOpenChange = (status) => {
        if (status)
            this.setState({ rightopen: true });
        else
            this.setState({ rightopen: false });
    }
}
export default FormDate
