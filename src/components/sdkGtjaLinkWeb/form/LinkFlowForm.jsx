import { Row, Col, message, Modal } from 'antd';

import React, { Component } from 'react';
import FormBaseComponent from './reactframework/FormBaseComponent';
import FormInput from './reactframework/FormInput';
import FormLabel from './reactframework/FormLabel';
import QueryForm from './reactframework/QueryForm';
import FormSelect from './reactframework/FormSelect';
import FormDate from './reactframework/FormDate';
import FormButton from './reactframework/FormButton';
import FormDeptSelect from './reactframework/FormDeptSelect';
import FormStaffSelect from './reactframework/FormStaffSelect';
import FormDivider from './reactframework/FormDivider';
import FormTable from './reactframework/FormTable';
import FormUpload from './reactframework/FormUpload';
import FormDisplay from './reactframework/FormDisplay';
import LinkFlowTable from './LinkFlowTable';
import formActions from './formActions';
import TimeLine from './custom/TimeLine';

import FlowNum from './linkFlow/FlowNum';

import { withFlowContext } from '../flow/LinkFlowContext';
import * as flowServices from '../services/flow/flow';

import './styles.less';

import _, { fromPairs, padEnd } from 'lodash';

import baseActions from '../flow/actions/baseActions';

import linkRequest from '../utils/linkRequest';

/**
 * 事件监听器，通过formRef.current.registerEventListener注册事件
 * [eventType]: listeners=[(eventType, eventData)=>{}]
 * eventType: 事件类型
 * eventData: 事件值
 * 表单值发生变更：     eventType='change' eventData={field, value}
 * 表单初始值获取完毕： eventType='initData' eventData=initData
 */
const eventListeners = {};

class LinkFlowForm extends QueryForm {

    static components = {};

    constructor(props) {
        super(props);

        [{ key: "label", value: FormLabel }, { key: "input", value: FormInput }
            , { key: "select", value: FormSelect }, { key: "date", value: FormDate }
            , { key: "dept", value: FormDeptSelect }, { key: "staff", value: FormStaffSelect }
            , { key: "button", value: FormButton }, { key: "divider", value: FormDivider }
            , { key: "flownum", value: FlowNum }, { key: "table", value: LinkFlowTable }
            , { key: "display", value: FormDisplay }, { key: "timeline", value: TimeLine }
            , { key: "upload", value: FormUpload}
        ].forEach(c => {
            LinkFlowForm.registerComponent(c.key, c.value);
        });

        this.state = {
            selectedValues: {}, // 表单值
            refs: {},
            selfData: {}, // 用于存放临时数据，可以和page定义属性进行交互
            formLayout: "", // 表单定义
            page: null,
            fields: [],
            hiddenrows: [],
            layout: null,
        };
    }

    static registerComponent(type, component) {
        LinkFlowForm.components[type] = component;
    }

    componentDidMount() {
        if (this.props.onRef)
            this.props.onRef(this)//需要对外声明被调用

        const { flowDispatcher } = this.props;
        if (flowDispatcher) {
            Object.keys(formActions).map(actionKey => {
                flowDispatcher.registerAction(actionKey, formActions[actionKey]);
            });
        }
    }

    componentWillReceiveProps(nextProps) {

        const nextIdsProps = _.pick(nextProps, ['piid', 'tiid']);
        const thisIdsProps = _.pick(this.props, ['piid', 'tiid']);
        if (!nextIdsProps.tiid) nextIdsProps.tiid = null;
        if (!thisIdsProps.tiid) thisIdsProps.tiid = null;
        if (!_.isEqual(nextIdsProps, thisIdsProps)) { // 提交后刷新
            const {
                page, fields, layout
            } = this.state;
            this.__initServerForm(nextProps, page, fields, layout);
        } else if (nextProps.template && nextProps.template.formLayout && !_.isEqual(this.state.formLayout, nextProps.template.formLayout)) {
            // 初始化页面
            try {
                const page = eval('(' + nextProps.template.formLayout + ')');
                if (!page && !page.form) return;

                page.control = this;

                const tabs = _.get(page, "form.tabs", null);
                let fields = [];

                const { contentType } = nextProps;
                let formClass = _.get(page, "form.class", "");

                if (contentType && contentType === "print") {
                    page.form.class = formClass + " print";
                }

                if (tabs && _.isArray(tabs)) {
                    tabs.forEach((tab, index) => {
                        fields = fields.concat(page.form.fields[index] || []);
                    });
                } else {
                    fields = page.form.fields;
                }
                const layout = {
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
                if (fields && _.isArray(fields) && fields.length > 0) {
                    fields.forEach(field => {
                        const todoTitleFlag = _.get(field, "flowoption.isTitle", false);
                        if (todoTitleFlag) {
                            page.form.todoTitleField = field.field;
                            if(!field.style) {
                                field.style = { fontWeight: "bold" };
                            }
                            if(!field.labelStyle) {
                                field.labelStyle = { fontWeight: "bold" };
                            }
                        }
                        const zwFlag = _.get(field, "flowoption.isZW", false);
                        if (zwFlag) {
                            page.form.zwField = field.field;
                            field.hidden = true;
                            field.unencode = true;
                        }

                        if (field.type === "flownum") {
                            const whFlag = _.get(field, "flowoption.isWH", true);
                            if (whFlag) {
                                page.form.flowNumField = field.field;
                            }
                        }
                        const deptFlag = _.get(field, "flowoption.isDept", false);
                        if (deptFlag) {
                            page.form.deptField = field.field;
                        }
                    });
                }

                // 重载提交
                const clickSubmit = _.get(page, "extra.submitConfirm", null);
                if (clickSubmit) {
                    flowDispatcher.registerAction("clickSubmit", ({ payload }, { getState, setState, dispatch, setStateSilence }) => {
                        if (clickSubmit && typeof (clickSubmit) === "function") {
                            const config = clickSubmit.call(this, null);// 返回{title:"",content:""}
                            if (!config) return baseActions.clickSubmit({ payload }, { getState, setState, dispatch, setStateSilence });
                            const modalType = _.get(config, "type", "confirm");
                            if (modalType === "confirm") {
                                const pickConfig = _.omit(config, ["type", "onOk", "onCancel"]);
                                const onOk = _.get(config, "onOk", null);
                                Modal.confirm({
                                    ...pickConfig,
                                    onOk: () => {
                                        if (onOk && _.isFunction(onOk)) {
                                            try {
                                                onOk.call(this);
                                            } catch (ex) { console.log(ex); }
                                        }
                                        baseActions.clickSubmit({ payload }, { getState, setState, dispatch, setStateSilence });
                                    }
                                });
                            } else if (modalType === "info" || modalType === "success" || modalType === "error" || modalType === "warning") {
                                Modal[modalType](config);
                            }
                        }
                    })
                }

                // 重载确认提交
                const completeTask = _.get(page, "extra.completeTask", null);
                if (completeTask || page.form.flowNumField) {
                    flowDispatcher.registerAction("completeTask", ({ payload }, { getState, setState, dispatch }) => {
                        if (completeTask && typeof (completeTask) === "function") {
                            return dispatch('getCompleteTaskParams').then(completeTaskParams => {
                                const errlist = completeTask.call(this, completeTaskParams, { payload }, { getState, setState, dispatch });
                                if (errlist && !_.isEmpty(errlist)) {
                                    let errmsg = "";
                                    if (_.isArray(errlist)) {
                                        errmsg = errlist.map(e => _.isString(e) ? e : e.message).join("<br />");
                                    } else if (_.isString(errlist)) {
                                        errmsg = errlist;
                                    }
                                    if (!_.isEmpty(errmsg))
                                        message.warn(errmsg);
                                    return Promise.reject(null);
                                }
                            }).then(() => {
                                // 提交自动绑定文号
                                if (page.form.flowNumField) {
                                    return this.__autobindFlowNum({ payload }, { getState, setState, dispatch });
                                } else {
                                    return baseActions.completeTask({ payload }, { getState, setState, dispatch });
                                }
                            });
                        } else {
                            // 提交自动绑定文号
                            if (page.form.flowNumField) {
                                return this.__autobindFlowNum({ payload }, { getState, setState, dispatch });
                            } else {
                                return baseActions.completeTask({ payload }, { getState, setState, dispatch });
                            }
                        }
                    })
                }

                // 不要做过多的state属性设置
                this.setState({ formLayout: nextProps.template.formLayout }, () => {
                    // 在初始化数据之后再进行属性设置
                    this.__initServerForm(nextProps, page, fields, layout, true);
                });
            } catch (e) {
                console.log("加载后台模板失败：", e);
            }
        }
    }

    call = (func, ...values) => {
        if (typeof func !== 'string' || func.length === 0) return null;
        const thisFunc = this[`_${func}`] || this[func];    // 兼容非下划线开头的方法调用
        if (typeof thisFunc !== 'function') return null;
        try {
            // return thisFunc(value);
            return thisFunc.call(this, ...values);  // 扩展调用方法接收参数的数量
        } catch (e) {
            return null;
        }
    }

    __autobindFlowNum = ({ payload }, { getState, setState, dispatch }) => {
        const {
            curNode
        } = this.props;
        const {
            page,
            fields,
        } = this.state;

        if (page.form.flowNumField) {
            const field = fields.find(f => f.field === page.form.flowNumField);

            if (field && (field.edit === true || field.edit === undefined)) {
                const auto = _.get(field, "flowoption.auto", true);
                if (auto) {
                    const param = _.pick(this.props, ["piid", "tiid"]);
                    param.ruleCode = _.get(field, "flowoption.ruleCode", "");
                    if (!param || !param.piid || !param.tiid || !param.ruleCode) {
                        message.warn(`未获取到生成文号必要参数`);
                        return Promise.resolve(null);
                    }

                    return linkRequest("FLOW_MAINFORM_U0005", param).then((result) => {
                        if (result.State === 0) {
                            return baseActions.completeTask({ payload }, { getState, setState, dispatch });
                        } else {
                            message.warn(`生成文号错误：${result.ErrMsg}`);
                            return Promise.resolve(null);
                        }
                    });
                }
            }
        }
        return baseActions.completeTask({ payload }, { getState, setState, dispatch });
    }

    // 加载表单可编辑权限
    __initServerForm = (props, page, fields, layout, serverDataFlag) => {
        if (page === null) return;

        const {
            flowCode,
            flowVer,
            curNode,
            setState,
            setStateSilence,
            dispatch,
            contentType,
            checkAuth, // 强制不判断权限
        } = props;

        if (!flowCode || !flowVer) return;

        const ajaxObj = {
            flowCode,
            flowVer,
            nodeCode: curNode.nodeCode
        };

        const that = this;
        Promise.all([
            flowServices.submitFlowForm("FLOW_FORM_Q0001", ajaxObj),
            flowServices.submitFlowForm("FLOW_FORM_Q0003", ajaxObj)
        ]).then(values => {
            if (values && values.length == 2 && values[0].success && values[1].success) {

                // 主表单权限
                values[0].Data.forEach(group => {
                    let {
                        display,
                        editable,
                        groupFlag,
                    } = group;

                    if (!page.form.id && group.multiline === "0") { // 只有一个主表单（非多行）
                        page.form.id = groupFlag;
                    }

                    if (page.form.id === groupFlag) { // 主表单
                        if(checkAuth === false) { // 强制不判断权限
                            editable = "1";
                        } else {
                            // 0 起草，1待办，2-4：已办、待阅、已阅
                            if (curNode.personType !== "0" && curNode.personType !== "1") {
                                editable = "0";
                            }
                        }

                        if (display === "1" && editable === "1") {
                            setStateSilence({ groupFlag });
                        }

                        page.form.display = (display === "1");
                        page.form.editable = (!contentType || contentType !== "print") && (editable === "1");

                        // 设置表单域编辑状态为true，用户在提交点击提交时就会触发表单、附件的校验，以及表单的提交操作
                        setStateSilence({ isEdit: page.form.editable });
                        return false;
                    }
                });

                // 子表单的权限
                values[0].Data.forEach(group => {
                    let {
                        groupFlag,
                    } = group;

                    if (group.multiline !== "0") { // 多行子表
                        let f = fields.find(f => f.type === "table" && _.get(f, "grid.id", "") === groupFlag);
                        if (f) {
                            const {
                                deleteRow,  // 删除
                                pluggable,  // 新增
                                editable,   // 修改
                            } = group;
                            if (deleteRow !== "1") {
                                if (f.grid.operate && f.grid.operate.delete) {
                                    delete f.grid.operate.delete;
                                }
                            }
                            if (pluggable !== "1") {
                                if (f.grid.operate && f.grid.operate.add) {
                                    delete f.grid.operate.add;
                                }
                            }
                            if (editable !== "1") {
                                if (f.grid.operate && f.grid.operate.edit) {
                                    delete f.grid.operate.edit;
                                }
                            }

                            if (!page.form.editable) {
                                f.edit = page.form.editable;
                            } else if (!('edit' in f)) {
                                if (deleteRow === "1" || pluggable === "1" || editable === "1")
                                    f.edit = true;
                            }
                        }
                    }
                });

                // 主表单字段和子表单字段的权限
                values[1].Data.forEach(d => {
                    if (d.groupFlag === page.form.id) { // 主表单
                        const field = fields.find(f => f.field && f.field.indexOf('-') > 0 ? (f.field.indexOf('-' + d.formelFlag) > 0 || f.field.indexOf(d.formelFlag + '-') > 0) : f.field === d.formelFlag);
                        if (field) {
                            if (!('hidden' in field)) {// 如果表单里定义了隐藏，那就以表单配置为准
                                field.hidden = d.display === "0" ? true : false;
                            }
                            if (!('edit' in field)) { // 不判断权限的话，就设置为可编辑
                                field.edit = checkAuth === false ? true : !page.form.editable ? false : d.editable === "0" ? false : true;
                            }
                            if (!('require' in field)) {
                                field.require = d.notnull === "1" ? true : false;
                            }

                            if (field.field === page.form.zwField) {
                                dispatch({
                                    type: 'save',
                                    payload: { editorArg: field },
                                });
                            } else if (field.field === page.form.deptField) {
                                if (curNode.personType !== "0") { // 仅起草才能修改部门控件，因为该控件与路经有关
                                    field.edit = false;
                                }
                            }
                        }
                    } else { // 子表单
                        const field = fields.find(f => f.type === "table" && f.grid.id === d.groupFlag);
                        if (field && field.grid && field.grid.columns && field.grid.columns.length > 0) {
                            _.each(field.grid.columns, (column, index) => {
                                if (_.isArray(column)) {
                                    _.each(column, (c, i) => {
                                        if (c.field === d.formelFlag) {
                                            if (!('hidden' in c)) {// 如果表单里定义了隐藏，那就以表单配置为准
                                                c.hidden = d.display === "0" ? true : false;
                                            }
                                            if (!('edit' in c)) {
                                                c.edit = !page.form.editable ? false : !field.edit ? false : d.editable === "0" ? false : true;
                                            }
                                            if (!('require' in c)) {
                                                c.require = d.notnull === "1" ? true : false;
                                            }
                                        }
                                    });
                                } else if (column.field === d.formelFlag) {
                                    if (!('hidden' in column)) {// 如果表单里定义了隐藏，那就以表单配置为准
                                        column.hidden = d.display === "0" ? true : false;
                                    }
                                    if (!('edit' in column)) {
                                        column.edit = !page.form.editable ? false : !field.edit ? false : d.editable === "0" ? false : true;
                                    }
                                    if (!('require' in column)) {
                                        column.require = d.notnull === "1" ? true : false;
                                    }
                                }
                            });
                        }
                    }
                });

                // 可以进行渲染了
                that.setState({ page, fields, layout }, () => {
                    setState({ isFormInit: true });
                    if (serverDataFlag) that.__initServerData(props);
                });
            }
        });
    }
    // 加载数据字典
    // 从后台初始化数据
    // 加载已保存数据
    __initServerData = (props) => {
        const {
            page,
            fields,
        } = this.state;

        const {
            piid,
            tiid,
            editorRef,
            setState,
            dispatch,
        } = props;

        if (!page || !page.form) return;

        var promisesObj = [];

        if (piid) {
            let formAjaxObj = _.pick(props, ["piid", "tiid"]);
            formAjaxObj.groupFlag = _.get(page, "form.id");
            promisesObj.push({ urlType: "FLOW_MAINFORM_Q0001", ajaxObj: formAjaxObj }) // 如果有piid，则从服务端加载数据
        } else if (page.form.data && page.form.data.urlType) {
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
            promisesObj.push({ url: url, urlType: relurlType, ajaxObj: formAjaxObj }) // 如果有piid，则从服务端加载数据
        }

        // 检查是否有字典项
        fields.forEach(f => {
            if (f.server && f.server.urlType && !f.server.lazy) { // lazy的话就是懒加载，鼠标放上去再加载
                let p = promisesObj.find(t => t.url === f.server.url && t.urlType === f.server.urlType);

                // 如果是有key/value，就合并起来，其他的话就单独发送请求
                if (p && (f.server.key || f.server.value)) {
                    if(f.server.key) {
                        if (p.ajaxObj) {
                            if (p.ajaxObj.dictCodes.findIndex(d => d === f.server.key) < 0)
                                p.ajaxObj.dictCodes.push(f.server.key);
                        } else {
                            p.ajaxObj = { dictCodes: [f.server.key] };
                        }
                    }
                } else {
                    p = { url: f.server.url, urlType: f.server.urlType };
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
            if (p.url) return linkRequest(p.urlType, p.ajaxObj, p.url);
            return flowServices.submitFlowForm(p.urlType, p.ajaxObj)
        });

        Promise.all(promises).then(values => {
            var valueData = {}; // 根据piid获取的数据
            var initData = {}; // 根据piid生成的初始数据对象

            if (piid || (page.form.data && page.form.data.urlType)) {
                if (values.length > 0 && values[0].State === 0 && values[0].Data.length > 0) {
                    // 如果有piid，那values[0] 就是服务端数据
                    if (piid) {
                        valueData = values[0].Data[0];
                        const { SYS_GUID } = valueData;
                        page.form["SYS_GUID"] = SYS_GUID;
                        const newFlowState = { SYS_GUID };

                        if (valueData[page.form.zwField]) {
                            if (editorRef && editorRef.current) {
                                editorRef.current.setValue(valueData[page.form.zwField]);
                            }
                        }
                        setState(newFlowState);
                    } else {
                        if (page.form.data.dataComplete) {
                            try {
                                page.form.data.dataComplete.call(this, values[0].Data);
                            } catch (e) { console.error(e) };
                        }
                    }
                }
            }

            var flag = false;  // 是否需要改变控件

            values.forEach((v, i) => {
                promisesObj[i].data = v.State === 0 ? v.Data : null;
            });

            fields.forEach(field => {
                const url = _.get(field, "server.url", undefined);
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
                var dictData = null;
                let promisesData = null;
                if (field.server && field.server.getParam) {
                    let ajaxObj = {};
                    if (typeof (field.server.getParam) === "function") {
                        ajaxObj = field.server.getParam.call(this, {});
                    } else {
                        ajaxObj = field.server.getParam;
                    }
                    promisesData = promisesObj.find(d => d.url === url && d.urlType === urlType && _.isEqual(d.ajaxObj, ajaxObj));
                } else {
                    promisesData = promisesObj.find(d => d.url === url && d.urlType === urlType);
                }

                if (promisesData && promisesData.data) {
                    dictData = promisesData.data;
                    // 如果由dataComplete，则使用该方法返回的作为数据源
                    if (field.server && field.server.dataComplete && typeof (field.server.dataComplete) === "function") {
                        const retData = field.server.dataComplete.call(field, dictData);
                        if (retData !== 'undefined') {
                            dictData = retData;
                        }
                    }

                }

                if (_.isArray(dictData)) { // 数组模式，遍历找到所有的字典
                    let data = [];
                    if(key) {
                        dictData.forEach(d => {
                            if (d.dictCode === key) {
                                data.push({ value: d.itemVal, text: d.itemText, parent: d.parentItemVal });
                            }
                        });
                    } else {
                        data = dictData.slice();
                    }

                    if (data.length > 0) {
                        field.data = data;
                        flag = true;
                    }
                } else if (_.isObject(dictData) && key && dictData[key]) { // 单个对象模式，直接赋值
                    field.data = dictData[key];
                    flag = true;
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

                if (field.field === page.form.zwField) {
                    let caption = _.get(field, "flowoption.caption", "");
                    if (caption) {
                        let rep = /\${(.+)}/g.exec(caption);
                        if (rep && rep[1]) {
                            field.flowoption.captionName = field.flowoption.caption.replace("${" + rep[1] + "}", initData[rep[1]] || "");
                            if (field.flowoption.captionName)
                                field.flowoption.captionName = field.flowoption.captionName.replace(/%25/g, "%").replace(/%2B/g, '+').replace(/%26/g, "&").replace(/%23/g, "#").replace(/%27/g, "'").replace(/%22/g, "\"");
                        }
                    }
                    field.defval = initData[field.field];
                    dispatch({
                        type: 'save',
                        payload: { editorArg: field },
                    });
                }
            });

            if (flag) {
                this.setState({ page, fields }, () => {
                    if (page.form.flowdata && page.form.flowdata.dataComplete && typeof (page.form.flowdata.dataComplete) === "function") {
                        // 通过dataComplete方法更新initData，如dataComplete没有返回则取原值
                        initData = page.form.flowdata.dataComplete.call(this, initData) || initData;
                    }
                    if (page.form.deptField) {
                        if (initData[page.form.deptField]) {
                            const _deptField = fields.find(f => f.field === page.form.deptField);
                            dispatch({
                                type: 'save',
                                payload: { draftDeptCode: initData[page.form.deptField], draftDeptName: initData[_deptField.fieldtext] },
                            });
                        } else {
                            const _deptList = this.call("getValue", page.form.deptField);
                            if (_deptList && _deptList.length === 2) {
                                dispatch({
                                    type: 'save',
                                    payload: { draftDeptCode: _deptList[0].value, draftDeptName: _deptList[1].value },
                                });
                            }
                        }
                    }
                    if (!piid && page.form.data && page.form.data.urlType) {
                        if (values.length > 0 && values[0].State === 0 && values[0].Data.length > 0) {
                            if (page.form.data.dataComplete) {
                                page.form.data.dataComplete.call(this, values[0].Data);
                            }
                        }
                    }
                    this.call("setValue", initData);

                });
            } else {
                if (page.form.flowdata && page.form.flowdata.dataComplete && typeof (page.form.flowdata.dataComplete) === "function") {
                    initData = page.form.flowdata.dataComplete.call(this, initData) || initData;
                }
                if (page.form.deptField) {
                    if (initData[page.form.deptField]) {
                        const _deptField = fields.find(f => f.field === page.form.deptField);
                        dispatch({
                            type: 'save',
                            payload: { draftDeptCode: initData[page.form.deptField], draftDeptName: initData[_deptField.fieldtext] },
                        });
                    } else {
                        const _deptList = this.call("getValue", page.form.deptField);
                        if (_deptList && _deptList.length === 2) {
                            dispatch({
                                type: 'save',
                                payload: { draftDeptCode: _deptList[0].value, draftDeptName: _deptList[1].value },
                            });
                        }
                    }
                }
                if (!piid && page.form.data && page.form.data.urlType) {
                    if (values.length > 0 && values[0].State === 0 && values[0].Data.length > 0) {
                        if (page.form.data.dataComplete) {
                            page.form.data.dataComplete.call(this, values[0].Data);
                        }
                    }
                }
                this.call("setValue", initData);
            }
            this.triggerEvent('initDataComplete', this.call('getValue'));
        });
    }

    _check = async (type) => {
        const {
            page,
            fields,
        } = this.state;

        if (page.form.submit && page.form.submit.before){
            let beforeObj = await page.form.submit.before.call(this);
            if(beforeObj === undefined) {

            } else if (_.isObject(beforeObj)) {
                if (beforeObj.State !== 0) {
                    return;
                }
            } else if(beforeObj === false){
                return;
            }
        }

        const {
            editorRef,
        } = this.props;

        let checklist = [];
        var refs = this.state.refs;

        fields.forEach(field => {
            if (field.field && refs[field.field]) { // 如果已经加载了该控件就使用控件的验证
                let retCheck = refs[field.field].call("check");
                if (!retCheck) return;
                if (Array.isArray(retCheck) && retCheck.length > 0) {
                    checklist = checklist.concat(retCheck)
                } else {
                    checklist.push(retCheck);
                }
            } else { // 如果没有加载该控件，就只验证require
                if (!!field.require && !field.hidden) {
                    if (field.defval === undefined || field.defval === null) {
                        checklist.push({ field: field.field, labelname: field.labelname, message: `请输入${field.labelname}` });
                    }
                }
            }
        });

        if (page.form.zwField) {
            const field = fields.find(f => f.field === page.form.zwField);
            if (field && field.require) {
                if (editorRef && editorRef.current) { // 如果已经加载了，就从控件里面获取
                    const value = editorRef.current.getValue();
                    if (!value) {
                        checklist.push({ field: field.field, labelname: field.labelname, message: `请填写${field.labelname}` });
                    }
                } else { // 否则就取defval里面的数据
                    if (!field.defval)
                        checklist.push({ field: field.field, labelname: field.labelname, message: `请填写${field.labelname}` });
                }
            }
        }

        // 加载外部的验证方法
        if (page.form.submit && page.form.submit.check) {
            const selectedValues = this._getValue();
            let customCheckObj = await page.form.submit.check.call(this, selectedValues, type);
            if (_.isArray(customCheckObj) && customCheckObj.length > 0) {
                checklist = checklist.concat(customCheckObj);
            } else if (_.isObject(customCheckObj)) {
                if (customCheckObj.State === 0 && _.isArray(customCheckObj.Data)) {
                    checklist = checklist.concat(customCheckObj.Data);
                } else if (customCheckObj.State === 0 && _.isArray(customCheckObj.Data)) {
                    checklist = checklist.concat({ message: customCheckObj.ErrMsg || "请求异常" });
                }
            }
        }

        return checklist;
    }

    _setValue = (data) => {
        const {
            page,
            fields,
        } = this.state;
        let {
            formValue,
        } = this.props;

        const {
            editorRef,
            dispatch,
            setStateSilence,
        } = this.props;

        var that = this;
        var flag = false;

        function setValue(itemname) {
            let value = undefined;
            let item = null;
            if (_.isString(itemname)) {
                item = fields.find(f => f.field === itemname);
            } else if (_.isObject(itemname)) {
                item = itemname;
            }
            if (!item) return;

            if (item.field.indexOf("-") > 0) {
                let cfields = item.field.split("-");
                cfields.forEach((citem, cindex) => {
                    if (data[citem] !== undefined) {//data存在该值
                        if (cfields.length > 1) {//区间模式
                            if (value === undefined) {
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
                if (item.fieldtext && data[item.fieldtext]) {
                    that.state.selectedValues[item.fieldtext] = data[item.fieldtext];
                    value = { text: data[item.fieldtext], value: data[item.field] };
                } else {
                    value = data[item.field];
                }
            }

            if (value !== undefined) {
                if (item.field === page.form.zwField) {
                    if (editorRef && editorRef.current) {
                        editorRef.current.setValue(value);
                    } else {
                        item.defval = value;
                        dispatch({
                            type: 'save',
                            payload: { editorArg: item },
                        });
                    }
                } else {
                    if (that.state.refs && that.state.refs[item.field]) {
                        that.state.refs[item.field].call("setValue", value);
                    } else {
                        flag = true;
                        item.defval = value;
                    }
                }
            }
        }

        fields.forEach(function (item, index) {
            if (!item.field) return;
            setValue(item);
            if (item.child && item.child.length > 0) {
                item.child.forEach(citem => {
                    setValue(citem);
                });
            }
        });

        formValue = _.extend(formValue, data);
        if(setStateSilence) {
            setStateSilence({formValue});
        }

        if (flag) {
            this.setState({ fields });
        }
    }

    // 需要返回所有的数据，即使该控件未加载
    _getValue(control) {
        var refs = this.state.refs;
        if (control) { // 获取指定控件的值
            if (refs[control] && refs[control].call) {
                return refs[control].call("getValue");
            }
            return null;
        } else { // 获取全部控件的值
            const {
                page,
                fields,
                refs,
            } = this.state;
            const {
                editorRef,
                editorArg,
            } = this.props;
            var selectedValues = {};
            var selectedValueObjs = {};

            Object.keys(refs).forEach(refField => {
                if (refs[refField].call) {
                    let value = refs[refField].call("getValue");
                    if (value !== undefined) {
                        selectedValueObjs[refField] = value;
                        if (Array.isArray(value)) {
                            value.forEach(valueItem => {
                                selectedValues[valueItem.field] = valueItem.value;
                            });
                        } else if (value === null) {
                            selectedValues[refField] = null;
                        } else {
                            selectedValues[value.field] = value.value;
                        }
                    }
                }
            });

            if (page.form.zwField) {
                if (editorRef && editorRef.current) {
                    selectedValues[page.form.zwField] = editorRef.current.getValue();
                } else if (editorArg && editorArg.defval) {
                    selectedValues[page.form.zwField] = editorArg.defval;
                }
            }

            // 加载外部的获取提交参数方法
            if (page.form.getParam) {
                let customChecklist = page.form.check.call(page, selectedValues, selectedValueObjs);
                if (_.isObject(customChecklist)) {
                    selectedValues = customChecklist;
                }
            }

            this.state.selectedValues = selectedValues;
            return selectedValues;
        }

    }

    // 获取控件对象
    _getControl = (field) => {
        const {
            refs,
        } = this.state;

        return refs && refs[field];
    }
    // getValue, setValue
    // check
    // submit
    _submit = async (submitObj) => {
        const {
            piid,
            tiid
        } = this.props;

        if (!piid) {
            console.log("LinkFlowForm:submit:缺少piid，无法提交");
            return "缺少piid，无法提交";
        }
        const {
            page,
        } = this.state;

        if (page.form && page.form.editable) { //只有在可编辑状态下才可以提交
            const {
                type,
            } = submitObj;
            if (type === "save") await this.call("check", type); // 如果是save的话，只是校验一下，感觉好奇怪哦

            let selectData = this._getValue();
            return this.__psubmit(submitObj, _.assign(selectData, { piid: piid, tiid: tiid, groupFlag: page.form.id, guid: page.form["SYS_GUID"] }));
        } else {
            console.log("当前不可编辑，不需要提交");
            return true;
        }
    }
    __psubmit = async (submitObj, submitData) => {
        const { setState, contentType } = this.props;
        const {
            page,
            fields,
            refs,
        } = this.state;
        const {
            type, // submit/save
        } = submitObj;

        if (!page.form.submit) {
            page.form.submit = {};
        }
        if (!page.form.submit.urlType) {
            // FLOW_MAINFORM_U0006 后台不校验必填
            // FLOW_MAINFORM_U0007 后台检验
            // FLOW_MAINFORM_U0010 运维保存表单相关功能
            if (contentType && contentType === "devop") {
                page.form.submit.urlType = "FLOW_MAINFORM_U0010";
            } else {
                page.form.submit.urlType = type === "submit" ? "FLOW_MAINFORM_U0007" : 'FLOW_MAINFORM_U0006';
            }
        }
        if (!page.form.submit.getParam) {
            page.form.submit.getParam = function (data) { return data; }
        }
        if (!page.form.submit.dataComplete) {
            page.form.submit.dataComplete = function (data) {
                const SYS_GUID = data["SYS_GUID"];
                page.form["SYS_GUID"] = SYS_GUID;
                setState({ SYS_GUID });
            }
        }

        const {
            urlType,
            getParam,
            dataComplete,
        } = page.form.submit;

        if (getParam) {
            submitData = getParam.call(this, submitData);
        }

        let relurlType = "";
        if (urlType && typeof (urlType) == "function") {
            relurlType = urlType.call(this, submitData, this.state.selfData);
        } else {
            relurlType = urlType;
        }

        var that = this;

        const promises = [];
        promises.push(flowServices.submitFlowForm(relurlType, submitData));

        const tables = [];
        fields.forEach(field => {
            if (field.type === "table" && field.edit === true) {
                const edit = _.get(field, "grid.operate.batchedit", null); // 只有批量提交才使用这种方式，否则不会主动提交
                if (edit !== null && refs[field.field]) { // 如果设置了批量，那就批量提交
                    const editData = refs[field.field].call("getData");
                    if (editData) {
                        var formList = [];
                        _.each(editData, row => {
                            let r = _.extend({}, row);
                            if (r.SYS_GUID && r.SYS_GUID.indexOf("__id__") === 0) delete r.SYS_GUID;
                            formList.push(r);
                        });
                        if (formList && formList.length > 0) {
                            const tableparam = _.extend(_.pick(_.get(field, "flowoption", {}), ["piid", "tiid"]), { formList, groupFlag: field.grid.id || "" });
                            if (contentType && contentType === "devop") {
                                promises.push(flowServices.submitFlowForm('FLOW_MAINFORM_U0010', tableparam));
                            } else {
                                promises.push(flowServices.submitFlowForm(type === "submit" ? "FLOW_MAINFORM_U0009" : 'FLOW_MAINFORM_U0008', tableparam));
                            }

                            tables.push(field);
                        }
                    }
                }
            }
        });

        const values = await Promise.all(promises);

        if (values[0].State === 0) {
            let data = values[0].Data;
            if (_.isArray(data) && data.length > 0) {
                if (dataComplete) {
                    dataComplete.call(that, data[0]);
                }
            } else {
                if (dataComplete) {
                    dataComplete.call(that, data);
                }
            }
        }

        if (tables.length > 0 && tables.length === values.length - 1) {
            for (let i = 1; i < values.length; i++) {
                if (values[i].State === 0) {
                    if (refs[tables[i - 1].field]) {
                        const editData = refs[tables[i - 1].field].call("getData");
                        if (editData.length === values[i].Data.length) {
                            _.each(editData, (row, index) => {
                                row.SYS_GUID = values[i].Data[index].SYS_GUID;
                            });

                            refs[tables[i - 1].field].call("setDataAndEdit", editData);
                        }
                    }
                }
            }
        }

        return new Promise((resolve) => resolve(values.filter(v => v.State !== 0).length > 0 ? "审批单保存失败" : true));
    }

    // 临时保存数据
    _saveData = (data) => {
        const {
            setStateSilence
        } = this.props;

        if (data.todoTitle && setStateSilence) {
            setStateSilence({ todoTitle: data.todoTitle });
        }

        Object.assign(this.state.selfData, data);
    }

    // 获取流程属性
    _getFlowValue = (propname) => {
        if (propname) return this.props[propname];
        return this.props;
    }

    // 修改流程属性
    _setFlowValue = (data) => {
        const {
            setState
        } = this.props;

        if (setState) {
            setState(data);
        }
    }

    // 修改表单
    _setField = (field) => {
        const {
            page,
            fields
        } = this.state;

        if (_.isArray(field)) {
            fields.forEach(f => {

                let index = field.findIndex(t => t.field === f.field || (f.group && t.group === f.group));
                if (index >= 0) {
                    _.extend(f, field[index]);
                }
            });
            this.setState({ page, fields });
        } else if (_.isObject(field)) {
            let index = fields.findIndex(t => t.field === field.field || (field.group && t.group === field.group));
            if (index >= 0) {
                _.extend(fields[index], field);
                this.setState({ page, fields });
            }
        }
    }

    // 执行流程方法，例如clickSave clickSubmit clickPublish等
    callFlow = (func, payload) => {
        if (typeof func !== 'string' || func.length === 0) return null;
        const {
            dispatch,
        } = this.props;
        try {
            return dispatch({
                type: func,
                payload: payload,
            });
        } catch (e) {
            return null;
        }
    }

    __handleEvent = (event, field, value, text, object) => {
        if (this.props.handleEvent) this.props.handleEvent(event, field, value, text, object);
        var {
            page,
            fields,
        } = this.state;
        const {
            form
        } = page;
        const {
            setStateSilence,
            dispatch,
        } = this.props;

        var item = fields.find(f => f.field === field);
        if (!item) return;

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
            if (_.isFunction(item.event[event.type])) {
                item.event[event.type].call(this, event, field, value, text, object);
            } else if (_.isString(item.event[event.type])) {
                if (page.form && page.form.functions[item.event[event.type]] && _.isFunction(page.form.functions[item.event[event.type]])) {
                    page.form.functions[item.event[event.type]].call(this, event, field, value, text, object);
                }
            }
        }

        if (event.source === event.target) { // 页面自动赋值不算
            if (item.type === "flownum") {
                dispatch({
                    type: 'clickSave',
                });
            } else if (field === form.deptField) { // 起草路径
                dispatch({
                    type: 'updateDraftDepart',
                    payload: { draftDeptCode: value, draftDeptName: text },
                });
            }
        }

        if (field === form.todoTitleField) { // 待办标题
            if (!!item.edit && event && setStateSilence) {
                // 通过赋值或者失去焦点，修改页面标题
                if (event.source !== event.target || event.type === "blur") {
                    const zwField = fields.find(f => f.field === form.zwField);
                    if (zwField && zwField.flowoption && zwField.flowoption.caption) {
                        let rep = /\${(.+)}/g.exec(zwField.flowoption.caption);
                        if (rep && rep[1] && rep[1] === field) {
                            zwField.flowoption.captionName = zwField.flowoption.caption.replace("${" + rep[1] + "}", value || "");
                            zwField.flowoption.captionName = zwField.flowoption.captionName.replace(/%25/g, "%").replace(/%2B/g, '+').replace(/%26/g, "&").replace(/%23/g, "#").replace(/%27/g, "'").replace(/%22/g, "\"");
                            this._setField(zwField);
                        }
                    }
                    setStateSilence({ todoTitle: value });
                }
            }
        }

        // 尝试触发注册的事件监听器
        this.triggerEvent(event.type, { field, value, object });
    }

    getControlRender(index, item) {
        const {
            page,
            layout,
        } = this.state;
        const {
            flowCode,
            piid,
            tiid,
        } = this.props;

        if (typeof (item.type) == "string") {//系统控件或者html标签
            _.forEach(LinkFlowForm.components, (component, key) => {
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
        if (_.isObject(item.layout)) item.layout = _.extend(itemlayout, item.layout);
        else item.layout = itemlayout;

        let itemlabelStyle = _.get(page, "form.labelStyle", {});
        if (_.isObject(item.labelStyle)) item.labelStyle = _.extend({}, itemlabelStyle, item.labelStyle);
        else item.labelStyle = itemlabelStyle;

        //调整内部布局
        if (item.layout.grid.col.span > this.state.layout.grid.col.span) {
            item.layout.grid.col.innerflex = parseInt(24 / this.state.layout.grid.col.span) * 3 - 1;
        }

        if (item.flowoption) {
            item.flowoption.flowCode = flowCode;
            item.flowoption.piid = piid;
            item.flowoption.tiid = tiid;
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

    getRender(index, item) {
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
            draggable: this.props.draggable,
            onDragStart: (e, item) => this.dragItem(e, item),
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
        if (!hidden) {
            return <Row key={index}>{childContent}</Row>;
        } else {
            return <Row style={{ display: "none" }} key={index}>{childContent}</Row>;
        }
    }

    // 开始拖动，设置保存数据为初始对象属性的string
    dragItem = (e, item) => {
        e.dataTransfer.setData('Text', JSON.stringify(item));
    }

    /**
     * 注册事件监听器
     * @param {*} fieldEventType
     * @param {*} listener
     */
    registerEventListener = (fieldEventType, listener) => {
        if (!Array.isArray(eventListeners[fieldEventType])) eventListeners[fieldEventType] = [];
        if (eventListeners[fieldEventType].indexOf(listener) < 0) eventListeners[fieldEventType].push(listener);
        // 不需要setState
    }

    /**
     * 注销事件监听器
     * @param {*} fieldEventType
     * @param {*} listener
     */
    unregisterEventListener = (fieldEventType, listener) => {
        if (fieldEventType) {
            const listeners = eventListeners[fieldEventType];
            if (!Array.isArray(listeners)) return;
            eventListeners[fieldEventType] = listeners.filter(l => l !== listener);
            // 不需要setState
        }
    }

    /**
     * 触发内置事件，激活监听器
     * @param {*} eventType 事件类型
     * @param {*} eventData 事件值
     */
    triggerEvent = (eventType, eventData) => {
        const listeners = eventListeners[eventType];
        if (Array.isArray(listeners) && listeners.length > 0) {
            listeners.forEach(listener => {
                if (typeof listener !== 'function') return;
                listener(this, eventType, eventData);
            });
        }
    }

    _completeTaskAfter = async (completeTaskParams) => {
        var {
            page,
        } = this.state;
        // 重载提交后
        const completeTaskAfter = _.get(page, "extra.completeTaskAfter", null);
        if (completeTaskAfter && typeof (completeTaskAfter) === "function") {
            const flag = await completeTaskAfter.call(this, completeTaskParams);
            if(flag === false) return false;
            return true;
        }
        return true;
    }
}

let delegate = ({ formRef, ...restProps }) => <LinkFlowForm ref={formRef} {...restProps} />;
delegate = withFlowContext(delegate, [
    'flowDispatcher',
    'setState',
    'setStateSilence',
    'piid',
    'tiid',
    'flowCode',
    'flowVer',
    'curTask',
    'instFlowBase', // 当前的单子状态
    'curNode', // 如果是打开已经处理的单子，该处为曾经的节点信息
    'template',
    'formConfig',
    'formRef',
    'formValue',
    'editorRef',
    'editorArg',
    'contentType',

    'fileList',
    'attachmentList',
    'uploadFileList',
    'attachmentTypeList',
    'selectedPathIds',
    'selectedPathNames',
    'selectedPaths',
    'selectedNodesHandlers',
    'instFlowTodoPersonList',
    'opinionModalData',
]);
delegate.registerComponent = LinkFlowForm.registerComponent;
delegate.formActions = formActions;
export default delegate;
