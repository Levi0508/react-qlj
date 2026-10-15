import React, { Component } from 'react';

import { Row, Col, Tabs, message,  } from 'antd';

import FormBaseComponent from './FormBaseComponent';
import FormInput from './FormInput';
import FormLabel from './FormLabel';
import FormSelect from './FormSelect';
import FormDeptSelect from './FormDeptSelect';
import FormStaffSelect from './FormStaffSelect';
import FormTable from './FormTable';
import FormDate from './FormDate';
import FormButton from './FormButton';
import FormDivider from './FormDivider';
import FormDisplay from './FormDisplay';
import FormUpload from './FormUpload';

import linkRequest from '../../utils/linkRequest';

import Tool from './Tool';

import '../styles.less';

import _, { fromPairs } from 'lodash';


class QueryForm extends React.Component {

    static components = {};

    constructor(props) {
        super(props);

        [{ key: "label", value: FormLabel }, { key: "input", value: FormInput }
            , { key: "select", value: FormSelect }, { key: "date", value: FormDate }
            , { key: "dept", value: FormDeptSelect }, { key: "staff", value: FormStaffSelect }
            , { key: "button", value: FormButton }, { key: "divider", value: FormDivider }
            , { key: "table", value: FormTable }, { key: "display", value: FormDisplay }
            , { key: "upload", value: FormUpload}
        ].forEach(c => {
            QueryForm.registerComponent(c.key, c.value);
        });

        const {
            page,
            fields,
            form,
            layout,
            data,
        } = this.__init(props);

        this.tool = new Tool(this);
        this.parent = this.props.parent;

        this.state = {
            selectedValues: {},
            refs: {},
            page,
            form,
            layout,
            fields,
            data,
            hiddenrows: [],
        };
    }

    static registerComponent(type, component) {
        QueryForm.components[type] = component;
    }

    componentDidMount() {
        if(this.props.onRef) //需要对外声明被调用
            this.props.onRef(this);
        if(this.props.onepage)
            this.page = this.props.onepage;

        this.__initServerData(()=> {
            const init = _.get(this.state, "form.init", null);
            const initdata = _.get(this.state, "page.initdata", null);
            if(init && _.isFunction(init)) {
                try {
                    init.call(this, initdata);
                } catch(ex) { console.log(ex); }
            }
        });
    }

    componentWillReceiveProps(nextProps) {
        if(!_.isEqual(nextProps.page, this.state.page)) {
            const {
                page,
                fields,
                form,
                layout,
                data,
            } = this.__init(nextProps);

            this.setState({page, form, layout, fields, data, }, () => {
                this.__initServerData();
            });
        }
    }

    _onRef = (ref, field) => {
        this.state.refs[field] = ref;
    }

    __init = (props) => {
        let page = null;
        let fields = [];
        let form = null;
        let layout = null;
        let data = null;

        page = props.page;

        if(page && page.form) {
            form = page.form;

            if(page.form.tabs) {
                if(_.isArray(page.form.tabs) && page.form.tabs.length > 0) {
                    page.form.tabs.forEach((t, index) => {
                        fields = fields.concat(page.form.fields[index]||[]);
                    })
                }
            } else {
                fields = page.form.fields;
            }

            layout = {
                grid: {
                    row: {
                        gutter: _.get(page, "form.layout.grid.row.gutter", [24, 8])
                    },
                    col: {
                        span: _.get(page, "form.layout.grid.col.span", 8)
                    },
                    direction: _.get(page, "form.layout.grid.direction", "h")
                }
            };

            page.control = this;

            data = form.data && form.data.data && (_.isArray(form.data.data) ? (form.data.data.length > 0 ? form.data.data[0] : null) : form.data.data);
        }

        return {page, fields, form, layout, data, };
    }

    // 加载数据字典
    // 从后台初始化数据
    // 加载已保存数据
    __initServerData = (func) => {
        const {
            page,
            fields,
        } = this.state;

        if (!page || !page.form) return;

        var promisesObj = [];

        if (page.form.data && page.form.data.urlType) {
            let relurlType = "";
            let url = _.get(page, "form.data.url", null);
            let formAjaxObj = {};
            if (typeof (page.form.data.urlType) == "function") {
                relurlType = page.form.data.urlType.call(this);
            } else {
                relurlType = page.form.data.urlType;
            }

            if (page.form.data.getParam) {
                if (typeof (page.form.data.getParam) === "function") {
                    formAjaxObj = page.form.data.getParam.call(this, formAjaxObj);
                } else {
                    formAjaxObj = page.form.data.getParam;
                }
            }
            promisesObj.push({ url: url, urlType: relurlType, ajaxObj: formAjaxObj });
        }

        // 检查是否有字典项
        fields.forEach(f => {
            if (f.server && f.server.urlType && !f.server.lazy) { // lazy的话就是懒加载，鼠标放上去再加载
                let p = promisesObj.find(t => t.urlType === f.server.urlType);
                if (p) {
                    if (f.server.key) {
                        if (p.ajaxObj) {
                            if (p.ajaxObj.dictCodes.findIndex(d => d === f.server.key) < 0)
                                p.ajaxObj.dictCodes.push(f.server.key);
                        } else {
                            p.ajaxObj = { dictCodes: [f.server.key] };
                        }
                    }
                } else {
                    p = { urlType: f.server.urlType };
                    if(f.server.url) {
                        p.url = f.server.url;
                    }
                    if (f.server.key) {
                        p.ajaxObj = { dictCodes: [f.server.key] };
                    } else if (f.server.getParam) {
                        if (typeof (f.server.getParam) === "function") {
                            p.ajaxObj = f.server.getParam.call(this, {});
                        } else {
                            p.ajaxObj = f.server.getParam;
                        }
                    }
                    promisesObj.push(p);
                }
            }
        });

        const promises = promisesObj.map(p => {
            return linkRequest(p.urlType, p.ajaxObj, p.url);
        });

        Promise.all(promises).then(values => {
            var valueData = {};
            var initData = {};

            var flag = false;  // 是否需要改变控件

            if (page.form.data && page.form.data.urlType) {
                if (values.length > 0 && values[0].State === 0 && values[0].Data.length > 0) {
                    valueData = values[0].Data;
                    if (page.form.data.dataComplete) {
                        const retVal = page.form.data.dataComplete.call(this, valueData);
                        if(retVal !== undefined) {
                            valueData = retVal;
                        }
                    }
                }
            }

            values.forEach((v, i) => {
                promisesObj[i].data = v.State === 0 ? v.Data : null;
            });

            fields.forEach(field => {
                const urlType = _.get(field, "server.urlType", "");

                const key = _.get(field, "server.key", ""); // 字典
                const dataKey = _.get(field, "server.value", ""); // 赋值
                let valueKey = "";
                let textKey = "";
                if (_.isString(dataKey)) {
                    valueKey = _.get(field, "server.value.valuefield", dataKey);
                } else {
                    valueKey = _.get(field, "server.value.valuefield", "");
                    textKey = _.get(field, "server.value.textfield", "");
                }

                // 字典初始化
                const promisesData = promisesObj.find(d => d.urlType === urlType);
                var dictData = null;
                if (promisesData && promisesData.data) {
                    dictData = promisesData.data;
                    // 如果由dataComplete，则使用该方法返回的作为数据源
                    if (field.server && field.server.dataComplete && typeof (field.server.dataComplete) === "function") {
                        const retData = field.server.dataComplete.call(field, dictData);
                        if (retData !== 'undefined') {
                            field.data = retData;
                            flag = true;
                        }
                    } else if (key) {
                        if (_.isArray(dictData)) { // 数组模式，遍历找到所有的字典
                            let data = [];
                            dictData.forEach(d => {
                                if (d.dictCode === key) {
                                    data.push({ value: d.itemVal, text: d.itemText, parent: d.parentItemVal });
                                }
                            });
                            if (data.length > 0) {
                                field.data = data;
                                flag = true;
                            }
                        } else if (_.isObject(dictData) && dictData[key]) { // 单个对象模式，直接赋值
                            field.data = dictData[key];
                            flag = true;
                        }
                    } else if (Array.isArray(dictData)) {
                        // 直接取值
                        field.data = dictData;
                        flag = true;
                    }
                }

                if (field.fieldtext) { // 更新为对象模式
                    const value = _.get(valueData, field.field, _.get(dictData, valueKey, null));
                    if (value !== null) {
                        initData[field.field] = {};
                        initData[field.field].value = value;
                        initData[field.field].text = _.get(valueData, field.fieldtext, _.get(dictData, textKey, value));
                    }
                } else {
                    if (field.field.indexOf('-') > 0) { //多个字段
                        field.field.split('-').forEach(sf => {
                            const value = _.get(valueData, sf, _.get(dictData, valueKey, null));
                            if (value !== null) {
                                initData[sf] = value;
                            }
                        });
                    } else {
                        const value = _.get(valueData, field.field, _.get(dictData, valueKey, null));
                        if (value !== null) {
                            initData[field.field] = value;
                        }
                    }
                }
            });

            if (flag) {
                this.setState({ page, fields }, () => {
                    this.call("setValue", initData);
                    if(func) func();
                });
            } else {
                this.call("setValue", initData);
                if(func) func();
            }
        });
    }

    __handleEvent = (event, field, value, text, object, arg) => {
        if (this.props.handleEvent) this.props.handleEvent(event, field, value, text, object, arg);
        const {
            page,
            fields,
        } = this.state;

        const item = fields.find(f=>f.field === field);
        if(!item) return;

        if (event && event.type === "change") {
            if (item && item.trigger && item.trigger.length > 0) {
                var valueObj = null;
                var flag = false;  // 是否需要改变控件
                item.trigger.forEach(t => {
                    fields.forEach(f => {
                        if (f.field === t.target || (f.group !== undefined && f.group === t.targetGroup)) {
                            const evalValue = t.condition.replace(/\$self.value/g, value).replace(/\$self.text/g, text);
                            if (t.type === "value") {
                                if (f.edit) {
                                    if (valueObj === null) valueObj = {};
                                    valueObj[f.field] = evalValue;
                                }
                            } else {
                                f[t.type] = eval(evalValue);
                                flag = true;
                            }
                        }
                    });
                });
                if (flag) {
                    this.setState({ page, fields }, () => {
                        if (valueObj) {
                            this.call("setValue", valueObj);
                        }
                    });
                } else {
                    if (valueObj) {
                        this.call("setValue", valueObj);
                    }
                }
            }
        }

        if (item.event && item.event[event.type]) {
            if(_.isFunction(item.event[event.type])) {
                item.event[event.type].call(this, event, field, value, text, object);
            } else if(_.isString(item.event[event.type])) {
                if(page.form && page.form.functions[item.event[event.type]] && _.isFunction(page.form.functions[item.event[event.type]])) {
                    page.form.functions[item.event[event.type]].call(this, event, field, value, text, object);
                }
            }
        }
    }

    call = (func, ...values) => {
        if(typeof func !== 'string' || func.length === 0) return null;
        const thisFunc = this[`_${func}`] || this[func];    // 兼容非下划线开头的方法调用
        if(typeof thisFunc !== 'function') return null;
        try {
            // return thisFunc(value);
            return thisFunc.call(this, ...values);  // 扩展调用方法接收参数的数量
        } catch(e) {
            return null;
        }
    }

    callSync = (func, value) => {
        const thisFunc = this[`_${func}`];
        if(typeof thisFunc !== 'function') return null;
        try {
            // return thisFunc(value);
            return thisFunc.call(this, value);
        } catch(e) {
            return null;
        }
    }

    callFunc = (func, ...values) => {
        if(typeof func !== 'string' || func.length === 0) return null;
        const {
            page,
        } = this.state;
        if(!page || !page.form || !page.form.functions || !_.isObject(page.form.functions)) return null;
        const thisFunc = page.form.functions[`${func}`];
        if(typeof thisFunc !== 'function') return null;
        try {
            // return thisFunc(value);
            return thisFunc.call(this, ...values);  // 扩展调用方法接收参数的数量
        } catch(e) {
            return null;
        }
    }

    _submit = (extra) => {
        const {
            page,
        } = this.state;

        if (!page.form.submit || !page.form.submit.urlType) {
            return Promise.reject(new Error('未定义提交'));
        }

        const errlist = this.call("check");
        if(errlist && errlist.length > 0) {
            return Promise.reject(new Error('表单验证失败'));
        }

        let param = this.call("getValue");
        if (page.form.submit.getParam) {
            if(_.isFunction(page.form.submit.getParam)) {
                param = page.form.submit.getParam.call(this, param);
            } else if(_.isObject(page.form.submit.getParam)) {
                param = page.form.submit.getParam;
            }
        }

        const {
            urlType,
            dataComplete,
            after,
        } = page.form.submit;

        const url = _.get(page.form.submit, "url", "");

        return linkRequest(urlType, param, url)
            .then((data) => {

                if(after) {
                    let afterData = after.call(this, data);
                    if(afterData !== undefined) {
                        data = afterData;
                    }
                }

                if (data && data.State === 0) {
                    if (dataComplete) dataComplete.call(this, data.Data, data.Page, data);
                    return Promise.resolve(data);
                }

                return Promise.reject(Object.assign({}, {
                  status: (data && data.State) || -1,
                  statusText: !data ? "出现错误" : (data.ErrMsg || "")
                }));
            });
    }
    _changeForm(actions) {
        if(actions == null) return;
        var that = this;
        Object.keys(actions).forEach((actionKey) => {
            if(that["_" + actionKey]) {
                that["_" + actionKey].call(that, actions[actionKey]);
            }
        })
    }
    _toggle(config) {//显示隐藏
        if(config == null) {//显示隐藏全部

        } else {
            if(typeof(config["rows"]) != "undefined") {//隐藏某行
                if(typeof(config["rows"]) == "number" || Array.isArray(config["rows"])) {//第几行
                    let rows = config["rows"];
                    if(typeof(config["rows"]) == "number") {
                        rows = [config["rows"]];
                    }
                    let hiddenrows = this.state.hiddenrows;
                    rows.forEach((row) => {
                        let flag = false;
                        hiddenrows.forEach((hrow, hindex) => {
                            if(hrow == row) {
                                flag = true;
                                hiddenrows.splice(hindex, 1);
                                return;
                            }
                        });
                        if(!flag) {
                            hiddenrows.push(row);
                        }
                    });
                    this.setState({hiddenrows : hiddenrows});
                }
            }
        }
    }

    _check = () => {
        const {
            refs,
            page,
        } = this.state;
        let checklist = [];

        Object.keys(refs).forEach(refField => {
            let retCheck = refs[refField].call("check");
            if(!retCheck) return;
            if(Array.isArray(retCheck) && retCheck.length > 0) {
                checklist = checklist.concat(retCheck)
            } else {
                checklist.push(retCheck);
            }
        });

        // 加载外部的验证方法
        if (page.form.submit && page.form.submit.check) {
            const selectedValues = this._getValue();
            let customChecklist = page.form.submit.check.call(this, selectedValues);
            if (_.isArray(customChecklist) && customChecklist.length > 0) {
                checklist = checklist.concat(customChecklist);
            }
        }

        return checklist;
    }

    _setValue = (data) => {
        const {
            fields,
        } = this.state;

        var that = this;
        var flag = false;

        function setValue(itemname) {
            let value = undefined;
            let item = null;
            if(_.isString(itemname)) {
                item = fields.find(f=>f.field === itemname);
            } else if(_.isObject(itemname)) {
                item = itemname;
            }
            if(!item) return;

            if(item.field.indexOf("-") > 0) {
                let cfields = item.field.split("-");
                cfields.forEach((citem, cindex) => {
                    if(data[citem] !== undefined) {//data存在该值
                        if(cfields.length > 1) {//区间模式
                            if(value === undefined) {
                                value = [];
                            }
                            value[cindex] = data[citem];
                        } else {//单字段模式
                            value = data[citem];
                        }
                        that.state.selectedValues[item.field] = data[citem];
                    }
                })
            } else {
                that.state.selectedValues[item.field] = data[item.field];
                if(item.fieldtext && data[item.fieldtext]) {
                    that.state.selectedValues[item.fieldtext] = data[item.fieldtext];
                    value = {text: data[item.fieldtext], value: data[item.field]};
                } else {
                    value = data[item.field];
                }
            }

            if(value !== undefined) {
                if(that.state.refs && that.state.refs[item.field]) {
                    that.state.refs[item.field].call("setValue", value);
                } else {
                    flag = true;
                    item.defval=value;
                }
            }
        }

        fields.forEach(function (item, index) {
            if(!item.field) return;
            setValue(item);
            if(item.child && item.child.length > 0) {
                item.child.forEach(citem => {
                    setValue(citem);
                });
            }
        });
        if(flag) {
            this.setState({fields});
        }
    }

    // 返回：call("getValue")
    // {"minstkbal":"", "maxstkbal":["",""]}
    _getValue() {
        const {
            page
        } = this.state;
        var selectedValues = {};
        var selectedValueObjs = {};
        var refs = this.state.refs;
        Object.keys(refs).forEach(refField => {
            if(refs[refField].call) {
                let value = refs[refField].call("getValue");
                if(value) {
                    selectedValueObjs[refField] = value;
                    if(Array.isArray(value)) {
                        value.forEach(valueItem => {
                            selectedValues[valueItem.field] = valueItem.value;
                        });
                    } else {
                        selectedValues[value.field] = value.value;
                    }
                }
            }
        });

        if(page.form.getParam && typeof(page.form.getParam) == "function") {
            selectedValues = page.form.getParam.call(page, selectedValues, selectedValueObjs);
        }
        this.state.selectedValues = selectedValues;
        return selectedValues;
    }

    // 修改表单
    _setField = (field) => {
        const {
            page,
            fields
        } = this.state;

        if (_.isArray(field)) {
            fields.forEach(f => {
                let index = field.findIndex(t => t.field === f.field);
                if (index >= 0) {
                    _.extend(f, field[index]);
                }
            });
            this.setState({ page, fields });
        } else if (_.isObject(field)) {
            let index = fields.findIndex(f => f.field === field.field);
            if (index >= 0) {
                _.extend(fields[index], field);
                this.setState({ page, fields });
            }
        }
    }

    _getField = (field) => {
        const {
            page,
            fields
        } = this.state;

        return fields.find(f=>f.field === field);
    }

    _getControl = (field) => {
        const {
            refs,
        } = this.state;

        return refs && refs[field];
    }

    getControlRender(index, item) {
        const {
            page,
            layout,
            data,
        } = this.state;

        if (typeof (item.type) == "string") {//系统控件或者html标签
            _.forEach(QueryForm.components, (component, key) => {
                if (key == item.type) {
                    item.control = component;
                    if (!item.field) item.field = item.type + index;
                    return;
                }
            });
        } else {//自定义对象

        }
        if (!item.control) return null;

        let itemlayout = _.cloneDeep(layout);
        if(_.isObject(item.layout)) item.layout = _.extend(itemlayout, item.layout);
        else item.layout = itemlayout;

        let itemlabelStyle = _.get(page, "form.labelStyle", {});
        if(_.isObject(item.labelStyle)) item.labelStyle = _.extend({}, itemlabelStyle, item.labelStyle );
        else item.labelStyle = itemlabelStyle;

        //调整内部布局
        if (item.layout.grid.col.span > this.state.layout.grid.col.span) {
            item.layout.grid.col.innerflex = parseInt(24 / this.state.layout.grid.col.span) * 3 - 1;
        }

        if(data && data[item.field] !== undefined && data[item.field] !== null) {
            item.defval = data[item.field];
        }

        return item;
    }

    getCombinationControlRender(index, item) {
        if (!item.child || !_.isArray(item.child) || item.child.length === 0) return null;

        const {
            page,
            fields,
        } = this.state;

        return item.child.map(itemname => {
            let citem = fields.find(f => f.field === itemname);
            if (!citem) return null;
            citem = this.getControlRender(index, citem);
            if (!citem) return null;
            let edit = _.get(citem, "edit", true);
            return React.createElement(citem.control, {
                key: citem.field,
                page: page,
                arg: citem,
                edit: edit,
                hidden: !!citem.hidden,
                disabled: citem.disabled,
                onRef: this._onRef,
                handleEvent: this.__handleEvent
            });
        }).filter(citem => !!citem);
    }

    getRender(index, item, layout) {
        const {
            page
        } = this.state;

        item = this.getControlRender(index, item);
        if (!item) return null;
        let edit = _.get(page, "form.edit", _.get(item, "edit", true));

        if (item.ref) return null; // 已经放于别的控件内部，此处不展示

        const controlProps = {

            key: item.field,
            page: page,
            arg: item,
            edit: edit,
            hidden: !!item.hidden,
            disabled: item.disabled,
            onRef: this._onRef,
            handleEvent: this.__handleEvent
        };

        return (
            <Col
                key={item.field}
                span={item.layout.grid.col.span}
                style={{ display: !!item.hidden ? "none" : "" }}
            >
                <item.control {...controlProps} />
                {this.getCombinationControlRender(index, item)}
            </Col>
        );
    }

    getRowRender(hidden, index, childContent) {
        if(!hidden) {
            return <Row key={index}>{childContent}</Row>;
        } else {
            return <Row style={{display: "none"}} key={index}>{childContent}</Row>;
        }
    }

    getFormRender(that, page, fields, hiddenrows) {
        if(!fields || !_.isArray(fields) || fields.length === 0) return null;

        let content = [];
        var lowIndex = 0;

        fields.forEach(function (item, index) {
            if (index >= lowIndex) {
                let childContent = [];
                let comp = null;
                let span = 0;
                for (let i = index; i < fields.length; i++) {
                    if (fields[i].ref) continue;
                    if (i > lowIndex && !!fields[i].newline) {
                        lowIndex = i;
                        break;
                    }
                    span += _.get(fields[i],"layout.grid.col.span",_.get(page, "form.layout.grid.col.span", 12));
                    if(span > 24) { // 如果超过24，就换一行
                        lowIndex = i;
                        break;
                    }
                    if (i == fields.length - 1) {
                        comp = that.getRender(i, fields[i]);
                        if(comp != null)
                            childContent.push(comp);
                        lowIndex = i + 1;
                        break;
                    }
                    comp = that.getRender(i, fields[i]);
                    if(comp != null)
                        childContent.push(comp);
                    if (i == fields.length - 1) {
                        lowIndex = i + 1;
                    }
                }
                if(!hiddenrows || hiddenrows.length == 0 || hiddenrows.indexOf(content.length) < 0) {
                    content.push(that.getRowRender(false, index, childContent));
                } else {
                    content.push(that.getRowRender(true, index, childContent));
                }
            }
        });
        return content;
    }

    render() {
        const {
            page,
            fields,
            hiddenrows,
        } = this.state;

        if(!page || !fields) return null;

        var that = this;

        var tabs = _.get(page, "form.tabs", null);

        const formclass = _.get(page, "form.class", "");

        let content;
        if(formclass.indexOf("print") < 0 && tabs !== null) { // tabs 模式 并且不是打印
            content =   <Tabs defaultActiveKey="0">
                        {
                            tabs.map((tabname, index) => {
                                return <Tabs.TabPane forceRender={true} tab={tabname} key={index}>
                                    {that.getFormRender(that, page, page.form.fields[index], hiddenrows)}
                                </Tabs.TabPane>
                            })
                        }
                        </Tabs>;
        } else {
            content = that.getFormRender(that, page, fields, hiddenrows);
        }

        return  <div className={"queryform " + formclass}>
                    {content}
                </div>;
    }
}

export default QueryForm
