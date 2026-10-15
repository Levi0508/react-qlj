import React, { Component } from 'react';

import {
    message,
    Modal,
    Popconfirm,
    Divider,
} from 'antd';

import FormExtraLabel from './reactframework/FormExtraLabel';
import FormLabel from './reactframework/FormLabel';
import FormTable from './reactframework/FormTable';
import QueryForm from './reactframework/QueryForm';
import QueryTable from './reactframework/QueryTable';
import FormTableModal from './reactframework/FormTableModal';

import * as flowServices from '../services/flow/flow';

import _ from 'lodash';

const defaultIdField = 'SYS_GUID';

class LinkFlowTable extends FormTable {

    componentDidMount() {
        if (this.props.onRef && this.props.arg.field)
            this.props.onRef(this, this.props.arg.field);
        if (this.tablecontainer) {
            var scroll = { x: this.tablecontainer.clientWidth };

            this.setState({ scroll: scroll });
        }

        const grid = _.get(this.props, "arg.grid", {});
        if (_.isEmpty(grid)) {
            return null;
        }

        if (!grid.data) {
            grid.data = {};
        } else {
            if (grid.data.data && _.isArray(grid.data.data) && grid.data.data.length > 0) {
                _.each(grid.data.data, row => {
                    row.SYS_GUID = "__id__" + this.tool.math.randomNumber(10000000);
                });
            }
        }
        var that = this;

        let edit = _.get(this.props, "edit", false);
        const batchedit = _.get(grid, "operate.batchedit", null);

        if (edit) {
            if (!grid.toolbar) {
                grid.toolbar = [];
            }

            // 新增功能
            const addFlag = _.get(this.props, "arg.grid.operate.add", null);
            let addButtons = _.remove(grid.toolbar, t => t.displaytype === "add");

            if (addFlag !== null) { // server/row/modal
                if (!addButtons || addButtons.length === 0) {
                    addButtons = [];
                    addButtons.push({ labelname: '新增', type: "button", displaytype: "add", page: "server.page" });
                }

                addButtons.forEach(button => {
                    if (addFlag === "server") {
                        grid.toolbar.push(_.extend(button, {
                            click: function () {
                                that._openSelectModal(button.page);
                            }
                        }));
                    } else if (addFlag === "row") {
                        grid.toolbar.push(_.extend(button, {
                            click: function () {
                                that._add();
                            }
                        }));
                    } else {
                        if (_.isString(addFlag)) {
                            let addFunc = _.get(grid, "functions." + addFlag, null);
                            if (addFunc !== null && _.isFunction(addFunc)) {
                                grid.toolbar.push(_.extend(button, {
                                    click: function () {
                                        addFunc.call(that);
                                    }
                                }));
                                return;
                            }
                        }
                        grid.toolbar.push(_.extend(button, {
                            click: function () {
                                that._openAddModal(button.page);
                            }
                        }));
                    }
                })
            }

            // 单行的编辑和删除功能
            const editFlag = _.get(this.props, "arg.grid.operate.edit", null);
            const editFormatter = _.get(this.props, "arg.grid.operate.editFormatter", null);
            const deleteFlag = _.get(this.props, "arg.grid.operate.delete", null);
            const deleteFormatter = _.get(this.props, "arg.grid.operate.deleteFormatter", null);

            if ((editFlag === "row" || editFlag === "modal") || deleteFlag !== null) {
                grid.columns[0].unshift({
                    edit: false, title: "", field: "__op", width: 100, align: "left", type: "button", formatter: function (text, row) {
                        const rowOp = [];
                        const {
                            editData
                        } = this.state;

                        const curEditKey = grid.idField.split(",").map((key) => row[key]).join("_");
                        let editing = false;
                        if (editData[curEditKey] !== undefined) {
                            editing = true;
                        }
                        if (editFlag === "row") {
                            if (editing) {
                                if (!batchedit) {
                                    rowOp.push(<Popconfirm
                                        onConfirm={() => that._saveRow(editData[curEditKey])}
                                        title="确认提交？"
                                        okText="确认"
                                        cancelText="取消"
                                    >
                                        <a href="#">保存</a>
                                    </Popconfirm>);
                                    rowOp.push(<a onClick={() => that._restore(row, false) }>取消</a>);
                                }
                            } else {
                                let editStr = '编辑';
                                if (editFormatter && _.isFunction(editFormatter)) {
                                    editStr = editFormatter.call(that, text, row);
                                }
                                if (editStr !== undefined && !_.isEmpty(editStr)) {
                                    rowOp.push(<a onClick={() => that._edit(row, true)}>{editStr}</a>);
                                }
                            }
                        }
                        if (editFlag === "modal") {
                            const editButton = grid.toolbar.find(b => b.displaytype === "add");
                            if (editButton) {
                                let editStr = '编辑';
                                if (editFormatter && _.isFunction(editFormatter)) {
                                    editStr = editFormatter.call(that, text, row);
                                }
                                if (editStr !== undefined && !_.isEmpty(editStr)) {
                                    rowOp.push(<a onClick={() => that._openAddModal(editButton.page, row)}>{editStr}</a>);
                                }
                            }
                        }
                        if (deleteFlag !== null) {
                            let deleteStr = '删除';
                            if (deleteFormatter && _.isFunction(deleteFormatter)) {
                                deleteStr = deleteFormatter.call(that, text, row);
                            }
                            if (deleteStr !== undefined && !_.isEmpty(deleteStr)) {
                                rowOp.push(<Popconfirm
                                    onConfirm={() => that._delete(row)}
                                    title="确认删除？"
                                    okText="确认"
                                    cancelText="取消"
                                >
                                    <a href="#">{deleteStr}</a>
                                </Popconfirm>);
                            }

                        }

                        return rowOp.map((item, index) => {
                            if (index > 0) return <><Divider type="vertical" />{item}</>;
                            else return item;
                        });
                    }
                });
            }
        } else {
            if (grid.toolbar && grid.toolbar.length > 0)
                _.remove(grid.toolbar, t => t.displaytype === "add");
        }
        if (!grid.idField) {
            grid.idField = "SYS_GUID";
        }
        if (!grid.data.urlType)
            grid.data.urlType = "FLOW_MAINFORM_Q0001";
        if (!grid.data.getParam) {
            grid.data.getParam = function () {
                let submitData = _.pick(_.get(that.props, "arg.flowoption", {}), ["piid", "tiid"]);
                submitData.groupFlag = grid.id;
                return submitData;
            };
        }
        if (!grid.data.beforeAjax) {
            grid.data.beforeAjax = function (param) {
                if (!param.piid) return false;
                return true;
            }
        }
        let dataComplete = grid.data.dataComplete;
        grid.data.dataComplete = function (data) {
            let retData = data;
            if (dataComplete) {
                retData = dataComplete.call(that, data);
                if (retData === undefined)
                    retData = data;
            }
            if (_.isArray(retData)) {
                retData.forEach(d => {
                    if (!d.SYS_GUID) d.SYS_GUID = "__id__" + that.tool.math.randomNumber(10000000);
                });
            }
            if (edit && batchedit) {
                if (that.state.ref && that.state.ref["table"]) that.state.ref["table"].call("edit", retData);
            }
            return retData;
        }
        this.__initServerData(grid);
    }

    __initServerData = (grid) => {
        var promisesObj = [];
        if (!grid || !grid.columns || grid.columns.length === 0 || grid.columns[0].length === 0) {
            this.setState({ grid });
            return;
        }
        function addPromise(f) {
            if (f.server && f.server.urlType && !f.server.lazy) {
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
                    if (f.server.url) {
                        p.url = f.server.url;
                    }
                    if (f.server.key) {
                        p.ajaxObj = { dictCodes: [f.server.key] };
                    } else if (f.server.getParam) {
                        if (typeof (f.server.getParam) === "function") {
                            p.ajaxObj = f.server.getParam.call(this);
                        } else {
                            p.ajaxObj = f.server.getParam;
                        }
                    }
                    promisesObj.push(p);
                }
            }
        }
        grid.columns.forEach(cs => {
            if (_.isArray(cs)) {
                cs.forEach(c => {
                    addPromise(c);
                })
            } else {
                addPromise(cs);
            }
        });

        if (promisesObj.length > 0) {
            const promises = promisesObj.map(p => {
                if (p.url) return linkRequest(p.urlType, p.ajaxObj, p.url);
                return flowServices.submitFlowForm(p.urlType, p.ajaxObj)
            });
            function initData(column) {
                if (column.server && column.server.urlType && !column.server.lazy) {
                    const urlType = _.get(column, "server.urlType", "");
                    const key = _.get(column, "server.key", ""); // 字典
                    const promisesData = promisesObj.find(d => d.urlType === urlType);
                    if (promisesData && promisesData.data) {
                        let dictData = promisesData.data;
                        // 如果由dataComplete，则使用该方法返回的作为数据源
                        if (column.server.dataComplete && typeof (column.server.dataComplete) === "function") {
                            const retData = column.server.dataComplete.call(column, dictData);
                            if (retData !== 'undefined') {
                                column.data = retData;
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
                                    column.data = data;
                                }
                            }
                        }
                    }
                }
            }
            Promise.all(promises).then(values => {
                values.forEach((v, i) => {
                    promisesObj[i].data = v.State === 0 ? v.Data : null;
                });

                grid.columns.forEach(cs => {
                    if (_.isArray(cs)) {
                        cs.forEach(c => {
                            initData(c);
                        });
                    } else {
                        initData(cs);
                    }
                });

                this.setState({ grid });
            });
        } else {
            this.setState({ grid });
        }
    }

    //属性改变
    componentWillReceiveProps(nextProps) {
        const piid = _.get(this.props, "arg.flowoption.piid", "");
        const npiid = _.get(nextProps, "arg.flowoption.piid", "");

        if (!_.isEqual(piid, npiid) && !npiid) {
            if (this.state.ref && this.state.ref["table"]) {
                const autoSearch = _.get(nextProps, "arg.grid.autoSearch", true);
                if(autoSearch) this.state.ref["table"].call("search");
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

    _check(row) {
        const {
            ref,
            grid,
        } = this.state;

        const {
            field,
            labelname,
        } = this.props.arg;

        if (!!this.props.hidden) return null;

        const batchedit = _.get(grid, "operate.batchedit", null);

        let checklist = [];
        let editData = null;
        if(row) {
            editData = [row]
        } else {
            editData = this._getEditData();
        }

        if(batchedit === null && !row && !_.isEmpty(editData)) {
            return { field, labelname, message: `表格有未保存数据` };
        }

        let selectedValues = [];
        var flag = true;
        if (editData !== null) {
            _.forEach(editData, (row) => {
                _.each(grid.columns, (column) => {
                    if (_.isArray(column)) {
                        _.each(column, c => {
                            if (!!c.require) {
                                if (typeof (row[c.field]) === "undefined" ||
                                    row[c.field] === "" ||
                                    row[c.field] === null ||
                                    (Array.isArray(row[c.field]) && row[c.field].length === 0)) {
                                    flag = false;
                                }
                            }
                        })
                    } else {
                        if (!!column.require) {
                            if (typeof (row[column.field]) === "undefined" ||
                                row[column.field] === "" ||
                                row[column.field] === null ||
                                (Array.isArray(row[column.field]) && row[column.field].length === 0)) {
                                flag = false;
                            }
                        }
                    }

                    if (!flag) return false;
                });

                selectedValues.push(row);
            })
        }

        if (!flag) return { field, labelname, message: `请完善${labelname || ""}表格数据` };

        if (grid && grid.submit && grid.submit.check) {

            let customChecklist = grid.submit.check.call(ref["table"], selectedValues);
            if (_.isArray(customChecklist) && customChecklist.length > 0) {
                checklist = checklist.concat(customChecklist);
            }
        }

        return checklist.length > 0 ? checklist : null;
    }

    _getEditData() {
        const {
            ref,
        } = this.state;

        if (ref && ref["table"]) {
            return ref["table"].call("getEditData");
        }
        return null;
    }

    _getData() {
        const {
            ref,
        } = this.state;

        if (ref && ref["table"]) {
            return ref["table"].call("getData");
        }

        return null;
    }

    _setDataAndEdit(data) {
        const {
            ref,
            grid,
        } = this.state;

        if (ref && ref["table"]) {
            if (data && _.isArray(data)) {
                _.each(data, row => {
                    if (!row.SYS_GUID) {
                        row.SYS_GUID = "__id__" + this.tool.math.randomNumber(10000000);
                    }
                })
                ref["table"].call("setDataAndEdit", data);
            }
        }
    }

    _onRef = (ref, field) => {
        if (this.state.ref) {
            this.state.ref[field] = ref;
        } else {
            this.state.ref = { [field]: ref };
        }

        if (field === "table") {
            if (this.tablecontainer) {
                this.setState({ scroll: { x: this.tablecontainer.clientWidth } });
            }

            const piid = _.get(this.props, "arg.flowoption.piid", "");
            if (piid) {
                const autoSearch = _.get(this.props, "arg.grid.autoSearch", true);
                if(autoSearch) ref.call("search");
            } else {
                const data = _.get(this.state, "grid.data.data", []);
                if (data && data.length > 0) {
                    ref.call("edit", data);
                }
            }
        }
    }

    __renderDisplay = () => {
        const {
            arg,
            page,
            draggable,
            edit,
            disabled,
        } = this.props;

        const {
            grid,
            modalVisible,
            modalForm,

            tablemodalVisible,
            tablemodalPage,

            scroll,
        } = this.state;

        if (!grid) return null;

        let style = this.__getStyle();

        const modalPage = _.get(grid, tablemodalPage);
        return this.__renderTemplete(style,
            <>
                <QueryTable key={arg.field} page={page} grid={grid} edit={!!edit} disabled={!!disabled}
                    scroll={scroll}
                    draggable={draggable}
                    onDragStart={(e, item) => this.dragItem(e, item)}
                    onRef={(ref) => this._onRef(ref, "table")} />
                {
                    grid.server && grid.server.page ?
                        <FormTableModal visible={tablemodalVisible} handleClose={(flag) => { this.setState({ tablemodalVisible: flag }) }} handleEvent={this.__getTableData} parent={page && page.control} page={modalPage} arg={arg} />
                        :
                        null
                }
                <Modal
                    title="新增"
                    visible={modalVisible}
                    onOk={this.__onAddModalOk}
                    onCancel={this.__onAddModalCancel}
                    width={600}
                    destroyOnClose
                >
                    <QueryForm page={modalForm} onRef={(ref) => this._onRef(ref, "form")} />
                </Modal>
            </>
        );
    }

    render() {
        return !!this.props.hidden ? this.__renderHidden() : this.__renderDisplay();
    }

    __renderHidden = () => {
        const {
            require,
            field,
            labelname,
            tip
        } = this.props.arg;

        let style = this.__getStyle();

        return <div data-field={field}
            style={{ display: "none" }}
            className={style.contentstyle.className}
        >
            <FormLabel labelname={labelname} labelStyle={style.labelStyle} tip={tip}>
                {!!require && <FormExtraLabel></FormExtraLabel>}
            </FormLabel>
            <div className="fieldcontent"
                ref={(ref) => { if (ref) this.tablecontainer = ref }}>
            </div>
        </div>;
    }

    __renderTemplete = (style, children) => {

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
            <div className="fieldcontent"
                ref={(ref) => { if (ref) this.tablecontainer = ref; }}>
                {children}
            </div>
        </div>;
    }

    // 【弹窗新增】打开
    _openAddModal(pagename, defval) {
        let page = null;
        if (!pagename) {
            page = {
                form: {
                    labelStyle: { width: "180" },
                    layout: { grid: { col: { span: 24 } } },
                    fields: [],
                }
            };
            const labelStyle = _.get(this.props, "arg.grid.labelStyle", null);
            if (labelStyle !== null) {
                page.form.labelStyle = labelStyle;
            }

            const column = _.get(this.props, "arg.grid.columns", []);
            if (column && column.length == 1) {
                column[0].forEach(c => {
                    if (c.type !== "button") {
                        let field = _.extend({ type: "input" }, c);
                        field.labelname = c.title;
                        page.form.fields.push(field);
                    }
                });
            };
        } else {
            const {
                grid,
            } = this.state;
            page = _.extend({}, _.get(grid, pagename));
        }
        if (page) {
            if (defval) page.initdata = defval;
            this.setState({ modalVisible: true, modalForm: page });
        }
    }

    // 【弹窗新增】点击确认
    __onAddModalOk = () => {
        const {
            ref,
            grid,
        } = this.state;

        const batchedit = _.get(grid, "operate.batchedit", null);
        if (ref && ref["form"]) {
            const errlist = ref["form"].call("check");
            if (errlist && errlist.length > 0) {
                return;
            }

            let submitData = ref["form"].call("getValue");
            if (batchedit) {
                if (ref["table"]) {
                    if (!submitData.SYS_GUID) {
                        submitData.SYS_GUID = "__id__" + this.tool.math.randomNumber(10000000);
                    }
                    ref["table"].call("add", submitData);
                }
            } else {
                let flowsubmitData = _.pick(_.get(this.props, "arg.flowoption", {}), ["piid", "tiid"]);
                if (!flowsubmitData.piid) {
                    message.warn(`请起草后再编辑`);
                    return;
                }

                _.extend(submitData, flowsubmitData);
                submitData.groupFlag = grid.id;

                if (!grid.data.submit) {
                    grid.data.submit = {};
                }
                if (!grid.data.submit.urlType) {
                    grid.data.submit.urlType = "FLOW_MAINFORM_U0007";
                }
                if (!grid.data.submit.getParam) {
                    grid.data.submit.getParam = function (data) { return data; }
                }
                if (!grid.data.submit.dataComplete) {
                    grid.data.submit.dataComplete = function (data) {
                        if (data["SYS_GUID"]) {
                            grid.data.data.push(_.extend(submitData, { SYS_GUID: data["SYS_GUID"] }));
                            this.setState({ grid, modalVisible: false });
                        }
                    }
                }

                const {
                    urlType,
                    getParam,
                    dataComplete,
                } = grid.data.submit;

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
                return flowServices.submitFlowForm(relurlType, submitData).then(function (data) {
                    if (data.State === 0) {
                        if (_.isArray(data.Data) && data.Data.length > 0) {
                            if (dataComplete) {
                                dataComplete.call(that, data.Data[0]);
                            }
                        } else {
                            if (dataComplete) {
                                dataComplete.call(that, data.Data);
                            }
                        }
                        return true;
                    } else {
                        return data.ErrMsg;
                    }
                }).catch(e => e.message);

            }
        }
        this.__onAddModalCancel();
    }

    // 【弹窗新增】关闭
    __onAddModalCancel = () => {
        this.setState({ modalVisible: false });
    }

    // 【弹窗选择】打开
    _openSelectModal = (pagename) => {
        const {
            grid,
        } = this.state;

        const selectedRows = this.call("getData");
        if (selectedRows) {
            const idField = _.get(grid, pagename + ".grid.idField");
            if (idField) {
                _.set(grid, pagename + ".grid.data.selectedRowKeys", selectedRows.length > 0 ? selectedRows.map(r => {
                    return idField.split(",").map((key) => r[key]).join("_");
                }) : []);
                _.set(grid, pagename + ".grid.data.selectedRows", selectedRows.length > 0 ? selectedRows.slice() : []); // 需要拷贝，否则里面更新外面也会更新
            }
        }

        this.setState({ tablemodalVisible: true, tablemodalPage: pagename });
    }

    // 弹窗选择模式，点击确认
    __getTableData = (event, field, tableValue, tableText, tableValueObj) => {
        const {
            ref,
            grid,
        } = this.state;

        if (tableValueObj && tableValueObj.length > 0) {
            const batchedit = _.get(grid, "operate.batchedit", null);
            if (batchedit) {
                if (ref["table"]) {
                    const newObj = [];
                    const data = ref["table"].call("getData");
                    const idFields = _.get(this.props, "arg.grid.idField", "SYS_GUID").split(",");

                    tableValueObj.forEach(t => {
                        let flag = false; // 该记录是否已存在于数据中
                        data.forEach(d => {
                            const dataEditKey = idFields.map((key) => d[key]).join("_");
                            const curEditKey = idFields.map((key) => t[key]).join("_");
                            if (curEditKey === dataEditKey) {
                                flag = true;
                                return false;
                            }
                        })
                        if (!flag) {
                            t.SYS_GUID = "__id__" + this.tool.math.randomNumber(10000000);
                            newObj.push(t);
                        }
                    })
                    ref["table"].call("add", newObj);
                }
            }
        }

    }

    // 将某行标记为编辑状态
    _edit = (row, flag) => {
        const {
            ref,
            grid,
        } = this.state;
        let {
            editorData, // 保留修改前的数据，以供恢复
        } = this.state;
        if (ref && ref["table"]) {
            const curEditKey = grid.idField.split(",").map((key) => row[key]).join("_");
            if(!editorData) editorData = {};
            editorData[curEditKey] = _.extend({}, row);
            this.state.editorData = editorData;
            ref["table"].call("edit", row, flag);
        }
    }

    // 恢复某行数据并标记为是否可编辑
    _restore = (row, flag = true) => {
        const {
            ref,
            grid,
            editorData,
        } = this.state;

        if(!row.SYS_GUID || row.SYS_GUID.indexOf('__id__') === 0) {
            this._delete(row);
            return;
        }

        if (ref && ref["table"]) {
            const curEditKey = grid.idField.split(",").map((key) => row[key]).join("_");
            if(editorData && editorData[curEditKey]) {
                ref["table"].call("edit", editorData[curEditKey], flag)
            } else {
                ref["table"].call("edit", row, flag)
            }
        }
    }

    // 新增一行
    _add = (row) => {
        const {
            ref,
            grid,
        } = this.state;
        if (ref && ref["table"]) {
            const {idField = defaultIdField} = grid || {};
            if (row) {
                if (!row[idField]) {
                    row[idField] = "__id__" + this.tool.math.randomNumber(10000000);
                }
                ref["table"].call("add", row);
            } else {
                const randomId = "__id__" + this.tool.math.randomNumber(10000000);
                const newRow = { [idField]: randomId };
                ref["table"].call("add", newRow);
            }
        }
    }

    // 保存一行
    _saveRow = async (row) => {
        const {
            grid,
            ref,
        } = this.state;

        let submitData = _.pick(_.get(this.props, "arg.flowoption", {}), ["piid", "tiid"]);
        if (!submitData.piid) {
            message.warn(`请起草后再编辑`);
            return;
        }

        let errlist = this._check(row);
        if(errlist) {
            if(_.isArray(errlist)) {
                message.warn(errlist.map(e=>e.message).join());
            } else {
                message.warn(errlist.message);
            }
            return;
        }

        _.extend(submitData, row, { groupFlag: grid.id });

        let tempSYS_GUID = null;
        if (submitData.SYS_GUID && submitData.SYS_GUID.indexOf("__id__") === 0) {
            tempSYS_GUID = submitData.SYS_GUID;
            delete submitData.SYS_GUID;
        }

        if (!grid.data.submit) {
            grid.data.submit = {};
        }

        if (!grid.data.submit.urlType)
            grid.data.submit.urlType = "FLOW_MAINFORM_U0007";

        if (grid.data.submit.getParam)
            grid.data.submit.getParam = function (data) { return data; }

        
        grid.data.submit.dataComplete = function (data) {
            if (data["SYS_GUID"]) {
                if(tempSYS_GUID) {
                    submitData.SYS_GUID = tempSYS_GUID;
                    ref["table"].call("delete", submitData, false); // 删除原来的临时数据
                }
                submitData.SYS_GUID = data["SYS_GUID"];
                ref["table"].call("add", submitData, false); // 取消可编辑
            }
        }

        const {
            urlType,
            getParam,
            dataComplete,
        } = grid.data.submit;

        if (getParam) {
            submitData = getParam.call(this, submitData);
        }

        let relurlType = "";
        if (urlType && typeof (urlType) == "function") {
            relurlType = urlType.call(this, submitData);
        } else {
            relurlType = urlType;
        }

        var that = this;
        return flowServices.submitFlowForm(relurlType, submitData).then(function (data) {
            if (data.State === 0) {
                if (_.isArray(data.Data) && data.Data.length > 0) {
                    if (dataComplete) {
                        dataComplete.call(that, data.Data[0]);
                    }
                } else {
                    if (dataComplete) {
                        dataComplete.call(that, data.Data);
                    }
                }
                return true;
            } else {
                return data.ErrMsg;
            }
        }).catch(e => e.message);
    }

    // 删除一行
    _delete = (row) => {
        const that = this;
        if (row && row.SYS_GUID && row.SYS_GUID.indexOf('__id__') === 0) { // 未保存的一行
            if (that.state.ref && that.state.ref["table"]) that.state.ref["table"].call("delete", row);
        } else { // 服务端删除
            let submitParam = _.extend({ groupFlag: _.get(this.state, "grid.id") }, _.pick(_.get(this.props, "arg.flowoption", {}), ["piid", "tiid"]), _.pick(row, ["SYS_GUID"]));
            return flowServices.submitFlowForm("FLOW_MAINFORM_D0004", submitParam).then(function (data) {
                if (data.State === 0) {
                    if (that.state.ref && that.state.ref["table"]) that.state.ref["table"].call("delete", data.Data);
                } else {
                    message.warn(`删除失败：${data.ErrMsg}`)
                }
            }).catch(e => e.message);
        }
    }

    _search(queryObj, pagination, data) {
        //1、如果pagination不为空的话，就是翻页，那就保持已选
        //2、如果pagination为空的话，就是重新查询，那就清空已选，如果
        const {
            grid,
            ref,
        } = this.state;

        let piid = _.get(this.props, "arg.flowoption.piid", "");
        if (!piid)
            return;

        if (!queryObj) {
            queryObj = this.state.queryObj;
        }
        if (grid.data && grid.data.getParam) {
            if (typeof (grid.data.getParam) == 'function') {
                queryObj = grid.data.getParam.call(this, queryObj);
            } else {
                queryObj = Object.assign(queryObj, grid.data.getParam);
            }
        }
        this.state.queryObj = queryObj;

        if (ref && ref.table) return ref.table.call("search", queryObj, pagination, data);
        return queryObj;
    }
}

export default LinkFlowTable
