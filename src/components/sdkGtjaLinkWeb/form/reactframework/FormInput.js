import React, { Component } from 'react';

import FormBaseComponent from './FormBaseComponent';
import FormExtraLabel from './FormExtraLabel';
import FormLabel from './FormLabel';
import FormSelect from './FormSelect';
import FormTableModal from './FormTableModal';

import check from './Util';
import Tool from './Tool';

import { Input, InputNumber, Rate, Slider, Tooltip, Icon, Select } from 'antd';
import _ from 'lodash';

class FormInput extends FormBaseComponent {
    // props.arg
    // field:
    // labelname:
    // type: "input"
    // displaytype: /password/number 普通输入框/密码输入框
    // defval: ""/["",""]
    // options:
    //          unencode:
    //          rows:
    //          min/max: 配合formattertype:n或者rows使用
    // {"minstkbal":"","maxstkbal":["",""]} = form.getValue();
    // 不建议适用：
    // formattertype: ""/"n" 不限输入内容/数字(仅为了兼容，不建议适用)

    // newline：是否换行，自身无效，仅供为了上级适用
    // layout:  普通布局，默认: { nomarl: { }}，需要配合style的width
    //          grid布局，默认：{ grid: { col:{ span: 8 } , direction: "h"} }
    // style: 输入控件的样式
    // labelstyle: 显示名称的样式

    // disabled: true/false
    // hidden: true/false
    // edit: true/false

    // 1、普通输入框：  { field: 'stkcode',  labelname: '证券代码', type: 'input' }
    // 2、密码输入框：  { field: 'stkcode',  labelname: '证券代码', type: 'input', displaytype:"password" }
    // 3、数字输入框：  { field: 'minstkbal', labelname: '证券数量', type: 'input', displaytype: "number" }
    // 4、区间输入框：  { field: 'minstkbal-maxstkbal', labelname: '证券数量', type: 'input' }
    // 5、默认值:       { field: 'stkcode', labelname: '证券代码', type: 'input', defval: "默认值" }
    // 6、区间默认值：  { field: 'minstkbal-maxstkbal', labelname: '证券数量', type: 'input', defval: [1000, 2000] }
    // 7、特殊配置：    { field: 'stkcode',  labelname: '证券代码', type: 'input', options: { unencode: true } } // 不需要转义
    // { rows: 2, min: 2, max: 4 } // 变为textarea
    // { min: 1000, max: 2000 } // 数字类型的最大最小值

    static defaultProps = {
        arg: "{ field: 'stkcode',  labelname: '证券代码', type: 'input' }", // 控件内部属性
        edit: true, // 是否可编辑，不可编辑时显示为label模式
        disabled: false, // 是否禁用，禁用时显示为input模式
        hidden: false, // 是否隐藏，隐藏时仍然能获取到数据
    }

    constructor(props) {
        super(props);

        this.tool = new Tool();

        let value = this.__convertDefval(this.props.arg);

        this.state = { value, error: false, errormsg: "", refs: null, data: [], timeout: null, };
    }
    componentDidMount() {
        if (this.props.onRef && this.props.arg.field)
            this.props.onRef(this, this.props.arg.field);
    }
    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(_.get(this.props, "arg.defval", null), _.get(nextProps, "arg.defval", null))) {
            let value = this.__convertDefval(nextProps.arg);
            this.setState({ value });
        }
    }

    __convertDefval(arg) {
        const {
            field,
            defval
        } = arg;

        let value;
        if (field.indexOf("-") > 0) {//区间
            if (defval && Array.isArray(defval))
                value = defval;
            else
                value = [null, null];
        } else {
            if (defval != undefined) { // 新的都是是  {defval: ""}，为了兼容老的 {defval:{value:""}}
                if (_.isObject(defval) && defval.value != undefined) {
                    value = defval.value;
                } else {
                    value = defval;
                }
            } else
                value = null;
        }
        return value;
    }

    _setValue(value) {
        if (value === undefined) return;

        const {
            field
        } = this.props.arg;
        var preValue = this.state.value;

        if (field.indexOf("-") > 0) {//区间，但是分别绑定两个字段
            let fields = field.split("-");
            if (!Array.isArray(value) && fields.length != value.length) return;
            var that = this;
            fields.forEach((item, index) => {
                if (typeof (value[index]) != "undefined") {
                    preValue[index] = that.__reductionSpecialCharacters(value[index]);
                }
            });
        } else {
            preValue = value === null ? null : this.__reductionSpecialCharacters(value);
        }

        let displaytype = _.get(this.props.arg, "displaytype", "");
        if (displaytype === "autocomplete") {
            this.setState({ value: preValue, selectedValue: preValue }, () => {
                super.handleEvent(null, { type: "change", source: "", target: field }, field, preValue);
            });
        } else {
            this.setState({ value: preValue }, () => {
                super.handleEvent(null, { type: "change", source: "", target: field }, field, preValue);
            });
        }
    }
    _getValue() {
        const {
            field
        } = this.props.arg;
        const {
            value
        } = this.state;
        const that = this;

        if (value === undefined || value === null) return null;

        let retValue = [];

        if (field.indexOf("-") > 0) {//区间，但是分别绑定两个字段
            let fields = field.split("-");
            fields.forEach((item, index) => {
                if (typeof (value[index]) != "undefined" && value[index] !== null) {
                    retValue.push({ field: fields[index], value: that.__handleSpecialCharacters(value[index]) });
                }
            });
        } else {
            retValue.push({ field: field, value: that.__handleSpecialCharacters(value) });
        }

        return retValue;
    }
    _check() {
        const {
            field,
            labelname
        } = this.props.arg;
        let messageList = check(this.props.arg, this.__handleSpecialCharacters(this.state.value));

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
            tip
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
            page
        } = this.props;

        const {
            field,
            formattertype,
            require,
            placeholder = "",
            server,
        } = this.props.arg;
        const {
            error,
            errormsg,
        } = this.state;

        let displaytype = _.get(this.props.arg, "displaytype", "");
        if (formattertype === "n") { // 仅为了兼容以前的代码，该属性不再适用
            displaytype = "number";
        }
        let style = this.__getStyle();
        if (field.indexOf("-") > 0) { // 区间模式
            let fields = field.split("-");
            let controlstyle = _.extend({ textAlign: 'right' }, style.controlstyle);

            if (displaytype === 'number' || displaytype === 'money') {
                let min = _.get(this.props.arg, "options.min", undefined);
                let max = _.get(this.props.arg, "options.max", undefined);
                let precision = _.get(this.props.arg, "options.precision", undefined);
                return this.__renderTemplete(style, <Input.Group compact style={style.groupstyle}>
                    <InputNumber disabled={!!this.props.disabled} value={this.state.value[0]} min={min} max={max} precision={precision}
                        onChange={(value) => this.__handleChange(null, [fields[0], null], value)}
                        style={controlstyle} placeholder={placeholder} />
                    <Input style={{ width: 30, borderLeft: 0, pointerEvents: 'none', backgroundColor: '#fff' }} placeholder="~" disabled />
                    <InputNumber disabled={!!this.props.disabled} value={this.state.value[1]} min={min} max={max} precision={precision}
                        onChange={(value) => this.__handleChange(null, [null, fields[1]], value)}
                        style={controlstyle} placeholder={placeholder} />
                </Input.Group>);
            } else if (displaytype == "slider") {
                let min = _.get(this.props.arg, "options.min", undefined);
                let max = _.get(this.props.arg, "options.max", undefined);
                let length = _.get(this.props.arg, "options.length", undefined);
                let value = this.state.value ? this.state.value : [0, 0];
                return this.__renderTemplete(style,
                    <Slider disabled={!!this.props.disabled} min={min} max={max} value={value} defaultValue={this.state.value} range
                        step={length} onChange={(value) => this.__handleChange(null, this.props.arg.field, value)} />);

            } else {
                return this.__renderTemplete(style,
                    <Input.Group compact style={style.groupstyle}>
                        <Input disabled={!!this.props.disabled} value={this.state.value[0]}
                            onChange={(e) => this.__handleChange(e, [fields[0], null], e.target.value)}
                            style={controlstyle} placeholder={placeholder} />
                        <Input style={{ width: 30, borderLeft: 0, pointerEvents: 'none', backgroundColor: '#fff' }} placeholder="~" disabled />
                        <Input disabled={!!this.props.disabled} value={this.state.value[1]}
                            onChange={(e) => this.__handleChange(e, [null, fields[1]], e.target.value)}
                            style={controlstyle} placeholder={placeholder} />
                    </Input.Group>);
            }
        } else if (this.props.arg.multiple) {//多行为textarea

            let rows = _.get(this.props.arg, "options.rows", 0);
            let minRows = _.get(this.props.arg, "options.min", rows === 0 ? 2 : rows);
            let maxRows = _.get(this.props.arg, "options.max", rows === 0 ? 4 : rows);

            let maxLength = _.get(this.props.arg, "rules.maxlength", null);
            // 展示剩余字数0/1000
            let showCount = _.get(this.props.arg, "options.showCount", maxLength !== null);
            let config = { autoSize: { minRows: minRows, maxRows: maxRows } };
            let controlstyle = style.controlstyle;

            return this.__renderTemplete(style,
                <>
                    <Input.TextArea disabled={!!this.props.disabled} {...config} value={this.state.value}
                        style={controlstyle}
                        onChange={(e) => this.__handleChange(e, this.props.arg.field, e.target.value)}
                        placeholder={placeholder}
                        maxLength={maxLength} />
                    {showCount ? <div className='textCount'>{this.state.value ? `${this.state.value.toString().length}/${maxLength}` : `0/${maxLength}`}</div> : null}
                </>);
        } else { // 普通输入框
            let min = _.get(this.props.arg, "options.min", undefined);
            let max = _.get(this.props.arg, "options.max", undefined);
            let controlstyle = style.controlstyle;
            if (displaytype == "password") {
                return this.__renderTemplete(style,
                    <Input.Password disabled={!!this.props.disabled} value={this.state.value}
                        style={controlstyle}
                        onChange={(e) => this.__handleChange(e, this.props.arg.field, e.target.value)}
                        placeholder={placeholder} />);
            } else if (displaytype == "number" || displaytype === 'money') {
                let precision = _.get(this.props.arg, "options.precision", undefined);
                return this.__renderTemplete(style,
                    <InputNumber disabled={!!this.props.disabled} value={this.state.value} min={min} max={max} precision={precision}
                        style={controlstyle}
                        onChange={(value) => this.__handleChange(null, this.props.arg.field, value)}
                        onBlur={(e) => this.__handleBlur(e, this.props.arg.field, e.target.value)}
                        placeholder={placeholder} />);
            } else if (displaytype == "rate") {
                return this.__renderTemplete(style,
                    <Rate disabled={!!this.props.disabled} value={this.state.value} count={max} defaultValue={this.state.value}
                        onChange={(value) => this.__handleChange(null, this.props.arg.field, value)} />);
            } else if (displaytype == "slider") {
                let length = _.get(this.props.arg, "options.length", undefined);
                let value = this.state.value ? this.state.value : 0;
                return this.__renderTemplete(style,
                    <Slider disabled={!!this.props.disabled} min={min} max={max} value={value} defaultValue={this.state.value}
                        step={length} onChange={(value) => this.__handleChange(null, this.props.arg.field, value)} />);

            } else if (displaytype == "autocomplete") {
                let {
                    data,
                    value,
                    autocompletesearchvalue,
                    selectedValue,
                } = this.state;
                const emptyText = _.get(this.props.arg, "options.empty", "");

                const valuefield = _.get(this.props.arg, "options.valuefield", "value");
                const textfield = _.get(this.props.arg, "options.textfield", "text");

                // 如果valuefield为null，则该选项不能选中
                const options = data.map(d => <Select.Option disabled={d[valuefield] === null} key={d[valuefield]} value={d[valuefield]}>{d[textfield] ? d[textfield] : ""}</Select.Option>);
                return this.__renderTemplete(style,
                    <Select
                        showSearch
                        value={(!data || data.length === 0) ? value : selectedValue}
                        placeholder={placeholder}
                        style={style.controlstyle}
                        defaultActiveFirstOption={false}
                        showArrow={false}
                        filterOption={false}
                        onSearch={this.__handleAutoCompleteSearch}
                        onChange={(value) => this.__handleChange(null, null, value)}
                        notFoundContent={!_.isEmpty(autocompletesearchvalue) ? <span dangerouslySetInnerHTML={{ __html: emptyText }} /> : null}
                    >
                        {options}
                    </Select>);
            } else {
                let inputConfig =
                    server && server.page ? {
                        addonAfter: <Icon type="plus" onClick={() => { this.setState({ tablemodalVisible: true }) }} style={{ marginLeft: "8px" }} />
                    } : null;

                return this.__renderTemplete(style,
                    <><Input
                        {...inputConfig}
                        disabled={!!this.props.disabled}
                        value={this.state.value}
                        style={controlstyle}
                        onChange={(e) => this.__handleChange(e, this.props.arg.field, e.target.value)}
                        onBlur={(e) => this.__handleBlur(e, this.props.arg.field, e.target.value)}
                        placeholder={placeholder} />
                        {
                            server && server.page ?
                                <FormTableModal visible={this.state.tablemodalVisible} handleClose={(flag) => { this.setState({ tablemodalVisible: flag }) }} handleEvent={this.__getTableData} parent={page && page.control} page={server.page} arg={this.props.arg} />
                                : null
                        }
                    </>);
            }
        }
    }

    __renderDisplay = () => { // 展示模式
        let style = this.__getStyle();
        const {
            field,
            formattertype,
        } = this.props.arg;

        let displaytype = _.get(this.props.arg, "displaytype", "");
        if (formattertype === "n") { // 仅为了兼容以前的代码，该属性不再适用
            displaytype = "number";
        }

        if (field.indexOf("-") > 0) {
            if (displaytype === 'money') {
                let precision = _.get(this.props.arg, "options.precision", 2);
                return this.__renderTemplete(style, <div className="displaycontent" style={style.style}>{this.state.value.map(v => this.tool.format.money(v, precision)).join("~")}</div>);
            } else {
                return this.__renderTemplete(style, <div className="displaycontent" style={style.style}>{this.state.value.join("~")}</div>);
            }
        } else {
            if (displaytype === "rate") {
                let max = _.get(this.props.arg, "options.max", 5);
                return this.__renderTemplete(style, <div className="displaycontent" style={style.style}><Rate disabled value={this.state.value} count={max} /></div>);
            }
            const clickEvent = _.get(this.props.arg, "event.click", null);
            const value = displaytype === 'money' ? this.tool.format.money(this.state.value, _.get(this.props.arg, "options.precision", 2)) : this.state.value;
            if (clickEvent) {
                return this.__renderTemplete(style, <div className="displaycontent link" style={style.style} onClick={(e) => this.__displayClick()}>{value}</div>);
            } else {
                return this.__renderTemplete(style, <div className="displaycontent" style={style.style}>{value}</div>);
            }
        }
    }

    __displayClick = () => {
        super.handleEvent(e, { type: "click", source: this.props.arg.field, target: this.props.arg.field }, this.props.arg.field);
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
        let className = _.get(this.props.arg, "layout.grid.direction", "") === "v" ? "vformfield forminput" : "formfield forminput";
        if ((child && child.length > 0) || ref) {

        } else {
            className += ' formflex';
        }

        let displaycontentStyle = this.__convertStyle(style);

        if (error) {
            className += " has-error";
        }
        if (normal == "") { //为空表示不是固定布局
            let controlstyle;
            let width = _.get(this.props.arg, "style.width", ""); // 默认为230
            if (width !== "") {
                controlstyle = { width: width + "px" };
            } else {
                if (field.indexOf("-") > 0) {
                    controlstyle = { flex: _.get(this.props.arg, "layout.grid.col.innerflex", 1) };
                } else {
                    controlstyle = { flex: _.get(this.props.arg, "layout.grid.col.innerflex", 2) };
                }
            }

            return {
                contentstyle: { className: className },
                labelStyle: labelStyle,
                style: displaycontentStyle,
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

    __handleSpecialCharacters(value) { // 处理输入框中特殊字符%,+,&,#,',"成ASCII
        if (value && typeof (value) == "string" && !this.props.arg.unencode)
            value = value.replace(/%/g, "%25").replace(/\+/g, '%2B').replace(/&/g, "%26").replace(/#/g, "%23").replace(/\'/g, "%27").replace(/\"/g, "%22");
        return value;
    }

    __reductionSpecialCharacters(value) {
        if (value && typeof (value) == "string" && !this.props.arg.unencode)
            value = value.replace(/%25/g, "%").replace(/%2B/g, '+').replace(/%26/g, "&").replace(/%23/g, "#").replace(/%27/g, "'").replace(/%22/g, "\"");
        return value;
    }

    __handleChange = (e, items, inputValue) => {
        const {
            field,
            displaytype,
            rules
        } = this.props.arg;

        var prevalue = this.state.value;
        // 合成事件，去除多次调用onchange时的waring
        if (e) e.persist();
        if (rules && rules.maxlength) { // 自动截取
            inputValue = inputValue.substring(0, rules.maxlength);
        }

        if (field.indexOf("-") > 0) { // 区间，但是分别绑定两个字段
            if (Array.isArray(items)) { // 仅更换一个值
                items.forEach((item, index) => {
                    if (item !== null) {
                        prevalue[index] = inputValue;
                    }
                });
            } else { // 直接更换所有数据
                prevalue = inputValue;
            }
            this.setState({ value: prevalue }, () => {
                super.handleEvent(e, { type: "change", source: field, target: field }, field, prevalue.map(v => this.__reductionSpecialCharacters(v)));
            });
        } else {
            if (displaytype === "autocomplete") {
                const { data } = this.state;
                const valuefield = _.get(this.props.arg, "options.valuefield", "value");
                const textfield = _.get(this.props.arg, "options.textfield", "text");
                if (data && data.length > 0) {
                    const curObj = data.find(d => d[valuefield] === inputValue);
                    if (curObj) {
                        let curText = curObj[textfield];
                        this.setState({ value: curText, selectedValue: inputValue }, () => {
                            super.handleEvent(e, { type: "change", source: field, target: field }, field, this.__reductionSpecialCharacters(curText), curText, curObj);
                        });
                    }
                } else {
                    this.setState({ value: inputValue }, () => {
                        super.handleEvent(e, { type: "change", source: field, target: field }, field, this.__reductionSpecialCharacters(inputValue));
                    });
                }

            } else {
                this.setState({ value: inputValue }, () => {
                    super.handleEvent(e, { type: "change", source: field, target: field }, field, this.__reductionSpecialCharacters(inputValue));
                });
            }
        }
    }

    __handleBlur = (e, items, inputValue) => {
        this.setState({ value: inputValue }, () => {
            super.handleEvent(e, { type: "blur", source: this.props.arg.field, target: this.props.arg.field }, this.props.arg.field, inputValue);
        });
    }

    __handleChildEvent = (event, field, value, text, valueObje) => {
        super.handleEvent(null, event, field, value, text, valueObje);
    }

    // 弹框赋回给select
    __getTableData = (event, field, tableValue, tableText, tableValueObj) => {

        const valuefield = _.get(this.props.arg, "options.valuefield", "value");

        let value = [];
        if (tableValueObj && _.isArray(tableValueObj) && tableValueObj.length > 0) {
            _.forEach(tableValueObj, o => {
                value.push(o[valuefield]);
            });
        }
        const curFiled = this.props.arg.field;
        this.setState({ value: value.join() }, () => {
            super.handleEvent(null, { type: "change", source: curFiled, target: curFiled }, curFiled, value.join(), tableValueObj[curFiled], tableValueObj);
        });
    }

    // 自动查询
    __handleAutoCompleteSearch = value => {
        if (value) {
            this.__handleAutoCompleteFetch(value, (data) => {
                this.setState({ data });
            });
        } else {
            if (this.state.timeout) {
                clearTimeout(this.state.timeout);
                this.state.timeout = null;
                this.state.autocompletesearchvalue = value;
            }
            this.setState({ data: [] });
        }
    }

    __handleAutoCompleteFetch = (value, callback) => {
        if (this.state.timeout) {
            clearTimeout(this.state.timeout);
            this.state.timeout = null;
        }
        this.state.autocompletesearchvalue = value;

        this.state.timeout = setTimeout(() => {
            let curValue = this.state.autocompletesearchvalue;
            let ajaxObj = _.extend({}, _.get(this.props.arg, "server", null));
            let getParam = _.get(ajaxObj, "getParam", null);
            if (getParam && _.isFunction(getParam)) {
                ajaxObj.getParam = function () {
                    return getParam(curValue);
                }
            }

            ajaxObj.dataComplete = function (data) {
                if (curValue === value) {
                    if (data && data.length > 0) {
                        callback(data);
                    } else {
                        callback([]);
                    }
                }
            }
            this.tool.ajaxHandler(ajaxObj);
        }, 1000);
    }
}


export default FormInput
