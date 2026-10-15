import React, { Component } from 'react';
import { Button, LocaleProvider, Table, Tooltip } from 'antd';
import linkRequest from '../../utils/linkRequest';

import _ from 'lodash';
import Tool from './Tool';

import FormInput from './FormInput';
import FormSelect from './FormSelect';
import FormDate from './FormDate';
import FormDivider from './FormDivider'
class QueryTable extends React.Component {//表格组件

    // props.grid
    // columns:[[ { title: '营业部', field: 'ORGNAME', width: 140, align: 'left' }]]
    // toolbar:[{labelname:'', event: { click:function(grid,selectedKeys,selectedRows)}}]
    // data: {url:'', urlType: '', getParam: function(queryObj){return queryObj}}

    // disabled: true/false
    // hidden: true/false
    // edit: true/false

    constructor(props) {
        super(props);
        const {
            grid,
            scroll,
        } = this.props;

        //初始化table控件（包含了分页）
        const pagination = this.__convertPagination(grid);
        const sorter = this.__convertSorter(grid);
        const tableConfig = this.__convertTableConfig(grid, pagination);

        var columnsTotalWidth = { x: 0 }; // 解决实参是副本不修改的问题
        const tablecolumns = this.__formatterPropColumns(grid, columnsTotalWidth);

        if (scroll) {
            if (scroll.x && columnsTotalWidth.x > scroll.x) {
                if (!tableConfig.scroll) {
                    tableConfig.scroll = { x: columnsTotalWidth.x };
                } else {
                    tableConfig.scroll.x = columnsTotalWidth.x
                }
            }
        } else {
            if (!tableConfig.scroll) {
                tableConfig.scroll = { x: columnsTotalWidth.x };
            } else {
                tableConfig.scroll.x = columnsTotalWidth.x
            }
        }

        this.tool = new Tool(this);

        this.parent = this.props.parent;

        this.state = {
            columnsTotalWidth: columnsTotalWidth.x,  // 所有列的宽度总和
            tableConfig,    // 表格属性定义
            tablecolumns, // 行定义

            queryObj: {},   // 查询条件
            pagination,   //当前页面的分页
            sorter,    //排序

            data: (grid.data && grid.data.data) || [], // 当前数据
            holdselected: _.get(grid, "data.holdSelected", false), // 查询时是否保留已选
            selectedRowKeys: (grid.data && grid.data.selectedRowKeys) || [],    // 已选择行key
            selectedRows: (grid.data && grid.data.selectedRows) || [],  // 已选择行

            loading: false, // 加载中
            haveSearched: false,    // 是否已经加载了数据

            editData: {},   // 当前编辑对象

            init: false,    // 是否初始化完成（有些需要加载字典）
        };
    }

    //属性改变
    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(this.props.grid, nextProps.grid)) {
            const {
                grid,
                scroll,
            } = nextProps;

            const pagination = this.__convertPagination(grid);
            const sorter = this.__convertSorter(grid);
            const tableConfig = this.__convertTableConfig(grid, pagination);

            var columnsTotalWidth = { x: 0 };
            const tablecolumns = this.__formatterPropColumns(grid, columnsTotalWidth);

            if (scroll) {
                if (scroll.x && columnsTotalWidth.x > scroll.x) {
                    if (!tableConfig.scroll) {
                        tableConfig.scroll = { x: columnsTotalWidth.x };
                    } else {
                        tableConfig.scroll.x = columnsTotalWidth.x
                    }
                }
            } else {
                if (!tableConfig.scroll) {
                    tableConfig.scroll = { x: columnsTotalWidth.x };
                } else {
                    tableConfig.scroll.x = columnsTotalWidth.x
                }
            }

            this.setState({
                columnsTotalWidth: columnsTotalWidth.x,
                tableConfig,    // 表格属性定义
                tablecolumns, // 行定义

                queryObj: {},   // 查询条件
                pagination,   //当前页面的分页
                sorter,    //排序

                data: grid.data.data || [], // 当前数据
                holdSelected: _.get(grid, "data.holdSelected", false), // 查询时是否保留已选
                selectedRowKeys: grid.data.selectedRowKeys || [],    // 已选择行key
                selectedRows: grid.data.selectedRows || [],   // 已选择行

                init: false,
            }, () => {
                this.__initServerData(grid, () => {
                    const init = _.get(this.props.grid, "init", null);
                    const initdata = _.get(this.props, "page.initdata", null);
                    if (init && _.isFunction(init)) {
                        try {
                            init.call(this, initdata);
                        } catch (ex) { console.log(ex); }
                    }
                });
            });
        } else if (!_.isEqual(_.get(this.props, "scroll.x", 0), _.get(nextProps, "scroll.x", 0))) {
            var {
                tableConfig,
                columnsTotalWidth,
            } = this.state;

            var {
                scroll,
            } = nextProps;

            if (scroll) {
                if (scroll.x && columnsTotalWidth > scroll.x) { // 如果列很宽，才会进行设置
                    if (!tableConfig.scroll) {
                        tableConfig.scroll = { x: columnsTotalWidth };
                    } else {
                        tableConfig.scroll.x = columnsTotalWidth
                    }
                    this.setState({ tableConfig });
                }
            }
        }
    }

    componentDidMount() {
        if (this.props.onRef)
            this.props.onRef(this)//需要对外声明被调用
        if (this.props.onepage)
            this.page = this.props.onepage;

        this.__initServerData(this.props.grid, () => {
            const init = _.get(this.props.grid, "init", null);
            const initdata = _.get(this.props, "page.initdata", null);
            if (init && _.isFunction(init)) {
                try {
                    init.call(this, initdata);
                } catch (ex) { console.log(ex); }
            }
        });
    }

    __initServerData = (grid, func) => {
        if (!grid) return;
        var promisesObj = [];
        if (!grid || !grid.columns || grid.columns.length === 0 || grid.columns[0].length === 0) {
            this.setState({ init: true }, () => {
                const autoSearch = _.get(grid, "autoSearch", true);
                if (autoSearch)
                    this._search();
            });
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
                return linkRequest(p.urlType, p.ajaxObj, p.url);
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
                        } else if (_.isArray(dictData)) { // 数组模式，遍历找到所有的字典
                            let data = [];
                            if (key) {
                                dictData.forEach(d => {
                                    if (d.dictCode === key) {
                                        data.push({ value: d.itemVal, text: d.itemText, parent: d.parentItemVal });
                                    }
                                });
                            } else {
                                data = dictData;
                            }
                            if (data.length > 0) {
                                column.data = data;
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

                this.setState({ init: true }, () => {
                    if (func) func();
                    const autoSearch = _.get(grid, "autoSearch", true);
                    if (autoSearch)
                        this._search();
                });
            });
        } else {
            this.setState({ init: true }, () => {
                if (func) func();
                const autoSearch = _.get(grid, "autoSearch", true);
                if (autoSearch)
                    this._search();
            });
        }
    }

    call(func, ...values) {
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

    _setData(data) {
        this.setState({ data: data });
    }

    _setDataAndEdit(data) {
        const {
            grid,
        } = this.props;

        var editData = {};
        _.each(data, row => {
            let idField;
            if (grid.idField) {
                idField = grid.idField.split(",").map((key) => row[key]).join("_");
                editData[idField] = row;
            }
            if(row.children && _.isArray(row.children)) { // 如果是树形表格
                _.each(row.children, cr => {
                    let idField;
                    if (grid.idField) {
                        idField = grid.idField.split(",").map((key) => cr[key]).join("_");
                        editData[idField] = cr;
                    }
                });
            }
        })
        this.setState({ data, editData });
    }

    _getData() {
        return this.state.data;
    }

    _getEditData() {
        return this.state.editData;
    }

    _getSeletedData() {
        return this.state.selectedRows;
    }

    _search(queryObj, pagination, data) {
        //1、如果pagination不为空的话，就是翻页，那就保持已选
        //2、如果pagination为空的话，就是重新查询，那就清空已选，如果
        const {
            grid,
            page,
        } = this.props;
        const {
            haveSearched,
            holdSelected,
        } = this.state;
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

        if (!pagination) {//返回第一页，清空已选,else 为翻页，保持已选
            if (this.state.pagination) {
                this.state.pagination.CurrentPage = 1;
            }
            if (haveSearched) { // 如果是从未查询过，那保留已选
                if (holdSelected) {
                    this.state.selectedRowKeys = [];
                    this.state.selectedRows = [];
                }
            }
        }
        if (data) {
            this.setState({ data: data });
        } else {
            this.__tableSearch();
        }
        return queryObj;
    }

    _reload() {//重新加载，保持当前页，清空已选
        this.state.selectedRowKeys = [];
        this.state.selectedRows = [];
        this.__tableSearch();
    }

    _edit = (row, flag = true) => {
        const {
            grid,
        } = this.props;

        let {
            editData,
            data,
        } = this.state;

        if (row === null) {
            editData = {};
        } else {
            if (_.isArray(row)) {
                _.each(row, r => {
                    let idField;
                    if (grid.idField) {
                        idField = grid.idField.split(",").map((key) => r[key]).join("_");
                        if (flag)
                            editData[idField] = r;
                        else
                            delete editData[idField];
                        const index = data.findIndex(d => grid.idField.split(",").map((key) => d[key]).join("_") === idField);
                        if (index >= 0) {
                            _.extend(data[index], r);
                        }
                    }
                    if(r.children && _.isArray(r.children)) { // 如果是树形表格
                        _.each(r.children, cr => {
                            let idField;
                            if (grid.idField) {
                                idField = grid.idField.split(",").map((key) => cr[key]).join("_");
                                if (flag)
                                    editData[idField] = cr;
                                else
                                    delete editData[idField];
                            }
                        })
                    }
                })
            } else if (_.isObject(row)) {
                let idField;
                if (grid.idField) {
                    idField = grid.idField.split(",").map((key) => row[key]).join("_");
                    if (flag)
                        editData[idField] = row;
                    else
                        delete editData[idField];
                    const index = data.findIndex(d => grid.idField.split(",").map((key) => d[key]).join("_") === idField);
                    if (index >= 0) {
                        _.extend(data[index], row);
                    }
                }
                if(row.children && _.isArray(row.children)) { // 如果是树形表格
                    _.each(row.children, cr => {
                        let idField;
                        if (grid.idField) {
                            idField = grid.idField.split(",").map((key) => cr[key]).join("_");
                            if (flag)
                                editData[idField] = cr;
                            else
                                delete editData[idField];
                        }
                    })
                }
            }
        }

        this.setState({ editData });
    }

    // 新增一行，flag为true时标识可以编辑
    _add = (row, flag = true) => {
        const {
            grid,
        } = this.props;

        let {
            editData,
            data,
        } = this.state;

        if (row === null) {

        } else {
            if (_.isArray(row)) {
                _.each(row, r => {
                    if (grid.idField) {
                        let idField = grid.idField.split(",").map((key) => r[key]).join("_");
                        const index = data.findIndex(d => grid.idField.split(",").map((key) => d[key]).join("_") === idField);
                        if (index >= 0) {
                            data[index] = r;
                        } else {
                            data.push(r);
                        }
                        if (flag) editData[idField] = r; else delete editData[idField];
                    }
                })
            } else if (_.isObject(row)) {
                if (grid.idField) {
                    let idField = grid.idField.split(",").map((key) => row[key]).join("_");
                    const index = data.findIndex(d => grid.idField.split(",").map((key) => d[key]).join("_") === idField);
                    if (index >= 0) {
                        data[index] = row;
                    } else {
                        data.push(row);
                    }
                    if (flag) editData[idField] = row; else delete editData[idField];
                }
            }
        }

        this.setState({ editData, data });
    }

    _delete = (row) => {
        const {
            grid,
        } = this.props;

        let {
            editData,
            data,
        } = this.state;

        if (row === null) {

        } else {
            if (_.isArray(row)) {
                _.each(row, r => {
                    let idField;
                    if (grid.idField) {
                        idField = grid.idField.split(",").map((key) => r[key]).join("_");

                        if (editData[idField]) {
                            delete editData[idField];
                        }

                        const index = data.findIndex(d => {
                            const dId = grid.idField.split(",").map((key) => d[key]).join("_");
                            return dId === idField;
                        });
                        if (index >= 0) {
                            data.splice(index, 1);
                        }
                    }
                })
            } else if (_.isObject(row)) {
                let idField;
                if (grid.idField) {
                    idField = grid.idField.split(",").map((key) => row[key]).join("_");

                    if (editData[idField]) {
                        delete editData[idField];
                    }
                    const index = data.findIndex(d => {
                        const dId = grid.idField.split(",").map((key) => d[key]).join("_");
                        return dId === idField;
                    });
                    if (index >= 0) {
                        data.splice(index, 1);
                    }
                }
            }
        }

        this.setState({ editData, data });
    }

    render() {
        const {
            tablecolumns,
            data,
            loading,
            selectedRowKeys,
            tableConfig,
            selectedRows,
            haveSearched,
        } = this.state;

        const {
            grid,
        } = this.props;

        const hidden = _.get(grid, "hidden", false); // 给表格用的
        const disabled = _.get(grid, "disabled", false); // 给按钮用的

        if (hidden) return null;

        const rowEditFlag = _.get(grid, "operate.edit", null);
        const rowAddFlag = _.get(grid, "operate.add", null);

        const components = ((rowAddFlag && rowAddFlag === "row") || (rowEditFlag && (rowEditFlag === "row" || rowEditFlag === "cell"))) ? {
            body: {
                cell: EditableCell,
            },
        } : {};

        var that = this;

        const singleSelect = _.get(grid, "singleSelect", null);
        let rowSelection = null;
        if (singleSelect !== null) {
            rowSelection = {
                type: grid.singleSelect ? "radio" : "checkbox",
                selectedRowKeys: selectedRowKeys,
                onChange: (rowselectedRowKeys, rowselectedRows) => {// 这边的rowselectedRows只有当前页的
                    let {
                        selectedRowKeys,
                        selectedRows,
                    } = this.state;

                    if (singleSelect) {
                        selectedRowKeys = rowselectedRowKeys;
                        selectedRows = rowselectedRows;
                    } else {
                        const removeList = _.difference(selectedRowKeys, rowselectedRowKeys);
                        const addList = _.difference(rowselectedRowKeys, selectedRowKeys);

                        if (removeList && removeList.length > 0) {
                            removeList.forEach(key => {
                                _.remove(selectedRows, r => {
                                    return grid.idField.split(",").map((key) => r[key]).join("_") === key;
                                })
                            })
                        }
                        if (addList && addList.length > 0) {
                            addList.forEach(key => {
                                rowselectedRows.forEach(nr => {
                                    if (grid.idField.split(",").map((key) => nr[key]).join("_") === key) {
                                        selectedRows.push(nr);
                                    }
                                })
                            })
                        }
                    }

                    if (grid.onChange) {
                        let arr = grid.functions[grid.onChange].apply(that, [rowselectedRowKeys, selectedRows]);
                        if (arr !== undefined && _.isArray(arr) && arr.length === 2) {
                            rowselectedRowKeys = arr[0];
                            selectedRows = arr[1];
                        }
                    }

                    this.setState({ selectedRowKeys: rowselectedRowKeys, selectedRows });
                },
                onSelect: (row, selected, selectedRows) => {
                    if (grid.onSelect) {
                        grid.functions[grid.onSelect].apply(that, [selected, row, selectedRows])
                    }
                },
                onSelectAll: (row, selected, selectedRows) => {
                    if (grid.onSelectAll) {
                        grid.functions[grid.onSelectAll].apply(that, [selected, row, selectedRows])
                    }
                }
            }
        }

        if (!tablecolumns || tablecolumns.length === 0) {
            return null;
        }

        if (!haveSearched) {
            tableConfig.locale = { emptyText: _.get(this.props, "grid.empty", "请点击查询") };
        }
        return <div className="querytable">
            {grid.title ? <FormDivider arg={grid.title}> </FormDivider> : null}
            {
                grid.toolbar && grid.toolbar.length > 0
                    ?
                    <div className="querytablebar">
                        <div className="querytabletoolbar">
                            {grid.toolbar && grid.toolbar.map((item, index) => {
                                if (item.hidden) {
                                    return null;
                                } else if (item.displaytype === 'export') {
                                    return <Button type="primary" key="export" onClick={(e) => that.__handlerDownload()} >导出</Button>;
                                } else {
                                    return <Button key={index} type="primary"
                                                disabled={disabled || item.edit === false || !!item.disabled}
                                                onClick={(e) => that.__handleClick.call(that, e, item)}>
                                                {item.labelname}
                                            </Button>;
                                }
                            })}
                        </div>
                    </div>
                    : null
            }
            <Table bordered
                components={components}
                {...tableConfig}
                rowSelection={rowSelection}
                rowKey={(row, index) => {
                    if (grid.idField)
                        return grid.idField.split(",").map((key) => row[key]).join("_");
                    else
                        return index;
                }}
                columns={tablecolumns}
                size="small"
                dataSource={data}
                loading={loading}
            />
            {
                grid.footbar && grid.footbar.length > 0
                    ?
                    <div className="querytablebar">
                        <div className="querytabletoolbar">
                            {grid.footbar.map((item, index) => {
                                if (item.hidden)
                                    return null;
                                else
                                    return <Button key={index} type="primary"
                                        disabled={disabled || item.edit === false || !!item.disabled}
                                        onClick={(e) => that.__handleClick.call(that, e, item)}>
                                        {item.labelname}
                                    </Button>;
                            })}
                        </div>
                    </div>
                    : null
            }
        </div>
    }

    // 请求数据
    __tableSearch() {
        const {
            grid
        } = this.props;

        const that = this;

        const urlType = _.get(grid, "data.urlType", "");
        if (urlType === "") {
            this.setState({ loading: false, msg: "缺少请求对象" });
            return;
        }
        const {
            tableConfig,
            sorter,
            init,
        } = this.state;

        if (!init) return;

        var {
            pagination,
        } = this.state;

        const url = _.get(grid, "data.url", "");
        const param = this.state.queryObj;

        const beforeAjax = _.get(grid, "data.beforeAjax", "");
        if (beforeAjax) {
            if (_.isFunction(beforeAjax)) {
                let flag = beforeAjax.call(this, param);
                if (flag === false) {
                    return false;
                }
            }
        }

        let colSort = null;
        if (sorter && sorter.sortName) {
            colSort = { ColName: sorter.sortName, Sort: sorter.sortOrder === "ascend" ? 0 : 1 };
        }

        this.setState({ loading: true, haveSearched: true }, () => {
            linkRequest(urlType, param, url, pagination, colSort, _.get(grid, "data.method", null))
                .then((data) => {
                    let after = _.get(grid, "data.after", null);
                    if(after && _.isFunction(after)) {
                        let afterData = after.call(this, data);
                        if(afterData !== undefined) {
                            data = afterData;
                        }
                    }
                    if (data.State === 0) {
                        if (pagination) {
                            if (data.Page) { // 后台返回了分页，以后台为准
                                pagination = data.Page;
                            } else if (data.Data.length === ajaxObj.Page.PageSize) { // 如果后台只有数据，没有分页，当成可以翻下一页
                                pagination = {
                                    CurrentPage: ajaxObj.Page.CurrentPage,
                                    CurrentRecords: data.Data.length || 0,
                                    PageSize: ajaxObj.Page.PageSize,
                                    Records: ajaxObj.Page.CurrentPage * ajaxObj.Page.PageSize + 1,
                                    TotalPage: ajaxObj.Page.CurrentPage + 1
                                };
                            } else { // 请求的行数和返回的行数不一致时，总页数就是现在
                                pagination = {
                                    CurrentPage: ajaxObj.Page.CurrentPage,
                                    CurrentRecords: data.Data.length || 0,
                                    PageSize: ajaxObj.Page.PageSize,
                                    Records: (ajaxObj.Page.CurrentPage - 1) * ajaxObj.Page.PageSize + data.Data.length,
                                    TotalPage: ajaxObj.Page.CurrentPage,
                                };
                            }

                            tableConfig.pagination.total = pagination.Records;
                            tableConfig.pagination.current = pagination.CurrentPage || 1;
                            tableConfig.pagination.pageSize = pagination.PageSize;
                        }

                        tableConfig.locale = { emptyText: _.get(this.props, "grid.empty", "暂无数据") };

                        const dataComplete = _.get(grid, "data.dataComplete", null);

                        var convertData;
                        if (dataComplete && _.isFunction(dataComplete)) {
                            convertData = dataComplete.apply(that, [data.Data]);
                            // 如果后台不返回，就用服务器返回的，如果返回就用返回的数据
                            if (convertData === undefined) convertData = data.Data;
                        } else {
                            convertData = data.Data;
                        }

                        const differTime = data.DataDifferTime;
                        this.setState({ loading: false, msg: "", data: convertData, tableConfig, pagination, differTime });
                    } else {
                        tableConfig.footer = !!err ? this.__getFooter : null;
                        this.setState({ loading: false, msg: data.ErrMsg, data: [], tableConfig });
                    }
                }).catch((err) => {
                    tableConfig.footer = !!err ? this.__getFooter : null;
                    this.setState({ loading: false, msg: err.statusText, data: [], tableConfig: tableConfig });
                });
        });
    }
    //导出方法
    __handlerDownload() {
        const data = this.state.data;
        const { beforeDownload } = this.props.grid || {};
        if (typeof (beforeDownload) === "function") {
            if (!beforeDownload(data)) { return false }
        } else if (!data || !data.length) {
            this.tool.alert("没有需要导出的数据，请重新确认查询条件！", "error");
            return false;
        }
        //下载文件名
        var downloadname = "", downloadoffline = false, downloadmenuid = '';
        var grid = this.props.grid;
        if (grid.download) {
            downloadname = grid.download.filename || "";
            downloadoffline = grid.download.downloadtype == 'off' ? true : false;
            if (grid.download.menuId) {
                downloadmenuid = grid.download.menuId;
            }
        }
        var filename = downloadname + "_" + this.tool.date.getCurrentDay();
        var urltype = grid.data.urlType;
        var columns = {};
        if (this.state.tablecolumns && this.state.tablecolumns.length > 0) {
            this.state.tablecolumns.forEach((col) => {
                // 默认不显示则不导出
                // 如果配置export属性，则以export为准
                let canExport = true;
                if (col["show"] !== undefined && col["show"] !== "") { canExport = col["show"] }
                if (col["export"] !== undefined && col["export"] !== "") { canExport = col["export"] }
                if (canExport) {
                    if (!col.children) {
                        if (col.title) {
                            var p_title = '';
                            if (col.title) {
                                if (typeof (col.title) == 'string') {
                                    p_title = (col.title || '').replace(/%/g, '%25');
                                } else {
                                    p_title = (col.title.props.children || '').replace(/%/g, '%25');
                                }
                            }
                            columns[col.field] = col.formattertype != undefined && col.formattertype == "s:t" ? p_title + "[{" + col.formattertype + "]}" : p_title;
                        }
                    } else {
                        col.children.forEach((child_col) => {
                            var p_title = '';
                            if (col.title) {
                                if (typeof (col.title) == 'string') {
                                    p_title = (col.title || '').replace(/%/g, '%25');
                                } else {
                                    p_title = (col.title.props.children || '').replace(/%/g, '%25');
                                }
                            }
                            if (child_col.title) {
                                var p_subtitle = '';
                                if (typeof (child_col.title) == 'string') {
                                    p_subtitle = (child_col.title || '').replace(/%/g, '%25');
                                } else {
                                    p_subtitle = (child_col.title.props.children || '').replace(/%/g, '%25');
                                }
                                columns[child_col.field] = p_title + '-' + p_subtitle;
                            }

                        });
                    }
                }
            });
        }

        const { url, filetype = "csv" } = grid.download || {};
        const { sortName = "", sortOrder } = this.state.sorter || {};
        var params = {
            Url: url,
            Type: urltype,
            Param: this.state.queryObj,
            ReturnType: filetype,
            Download: { FileName: filename, Column: columns },
            Page: { CurrentPage: 1, PageSize: 1000000 },
            sysId: grid.data.sysId || 100,
            ColOrder: {
                ColName: sortName,
                Sort: (sortOrder == 1 || (sortOrder != undefined && sortOrder.toLowerCase() == "desc") || (sortOrder != undefined && sortOrder.toLowerCase() == "descend")) ? 1 : 0
            }
        };
        this.tool.export(params);
        //     //离线下载
        //     if(_downloadtypeflag){
        //         if(downloadmenuid&&downloadmenuid!=''){
        //             params.menuId=downloadmenuid;
        //         }
        //         tool.offexport(params);
        //     }else{
        //         tool.export(params);
        //    }
    }
    // 按钮事件
    __handleClick = (e, item) => {
        if (e) e.preventDefault();
        if (item.click) {
            if (!item.event) item.event = {};
            item.event.click = item.click;
        }
        if (!item || !item.event || !item.event.click) return;

        const {
            grid,
        } = this.props;

        const {
            selectedRowKeys,
            selectedRows,
        } = this.state;

        if (typeof (item.event.click) == "string") {
            grid.functions[item.event.click].apply(this, [selectedRowKeys, selectedRows]);
        } else if (typeof (item.event.click) == "function") {
            item.event.click.apply(this, [selectedRowKeys, selectedRows])
        }
    }

    // 当表格翻页/过滤/排序时触发事件
    __handleTableChange = (page, filters, sort) => {
        if (sort && sort.field) {
            let sorter = this.state.sorter || {};
            sorter.sortName = sort.field;
            sorter.sortOrder = sort.order;
            this.state.sorter = sorter;
        } else {
            let sorter = this.state.sorter || {};
            sorter.sortName = "";
            sorter.sortOrder = "";
            this.state.sorter = sorter;
        }
        if (page && this.state.pagination !== null) {
            let pagination = this.state.pagination;
            pagination.CurrentPage = page.current || 1;
            pagination.PageSize = page.pageSize || 15;
            this.state.pagination = pagination;
            this._search(null, pagination);
        } else {
            this._search(null);
        }
    }

    // 初始化table参数
    __convertTableConfig(grid, pagination) {
        let tableConfig = {};
        if (pagination) {
            tableConfig.pagination = {  // 分页
                showSizeChanger: true,
                showQuickJumper: true,
                pageSizeOptions: grid.pageSizeOptions && Array.isArray(grid.pageSizeOptions) && grid.pageSizeOptions.length ? grid.pageSizeOptions : ["5", "15", "30", "100", "200"],
                total: pagination.Records,
                current: pagination.CurrentPage,
                pageSize: pagination.PageSize,
                //onChange: this.changePage,
                showTotal: (total, range) => {
                    let content = [];
                    if (this.state.differTime) {
                        content.push("数据耗时:" + this.state.differTime + "。");
                    }
                    if (range && range.length == 2) {
                        content.push("当前显示 " + range[0] + " - " + range[1] + " 记录");
                    }
                    if (total != undefined) {
                        content.push("共 " + total + " 记录");
                    }
                    return content.join("");
                },
                //onShowSizeChange:this.changePage
            }
        } else {//不需要分页
            tableConfig.pagination = false;
        }

        tableConfig.onChange = this.__handleTableChange;
        tableConfig.locale = { emptyText: _.get(this.props, "grid.empty", "暂无数据") };
        tableConfig.tip = _.get(grid, "tip", null);

        if (grid.fixheight) { // 固定高度
            if (!tableConfig.scroll)
                tableConfig.scroll = {};

            tableConfig.scroll.y = grid.fixheight;
        }

        return tableConfig;
    }

    // 初始化分页
    __convertPagination(grid) {
        let pagination = null;
        const gridPagination = _.get(grid, "pagination", false);
        if (gridPagination) { // 不配置或者配置为true时
            pagination = { CurrentPage: 1, PageSize: 15 }
            if (gridPagination === true) {

            } else if (_.isObject(gridPagination)) {
                if (typeof (gridPagination.pagesize) == 'number') {
                    pagination.PageSize = gridPagination.pagesize;
                }
                if (typeof (gridPagination.currentpage) == 'number') {
                    pagination.CurrentPage = gridPagination.currentpage;
                }
            }
        }
        return pagination
    }

    // 初始化排序
    __convertSorter(grid) {
        const sortName = _.get(grid, "sorter.sortName");
        let sortOrder = "";
        if (sortName) {
            sortOrder = _.get(grid, "sorter.sortOrder");
            if (["desc", "descend", 1].findIndex(s => s === sortOrder)) {
                sortOrder = "descend";
            } else {
                sortOrder = "ascend";
            }
            return { sortName, sortOrder };
        } else {
            null;
        }
    }

    //column和columndefined进行合并
    __formatterPropColumns(grid, columnsTotalWidth) {
        if (!grid) return [];
        if (grid.columnsDefine) {
            let dcolumns = grid.columnsDefine;
            let columns = [[]];

            dcolumns.forEach(field => {
                if (typeof (field) == "string") {//简单模式
                    (_.isArray(grid.columns[0]) ? grid.columns[0] : grid.columns).forEach(item => {
                        if (item.field == field) {
                            columns[0].push(item);
                            return;
                        }
                    });
                } else {//对象模式
                    columns[0].push(field);
                }
            });
            return this.__formattercolumns(grid, columns, columnsTotalWidth);
        } else {
            return this.__formattercolumns(grid, _.isArray(grid.columns[0]) ? grid.columns : [grid.columns], columnsTotalWidth);
        }
    }

    //二维数组转换成antd的children模式
    __formattercolumns(grid, columns, columnsTotalWidth) {
        let subColumns = [];
        let normalcolumns = [];
        var that = this;
        if (columns.length > 1) {
            subColumns = columns[1];
        }

        columns[0].forEach(function (item, index) {
            if (!!item.colspan && !item.children) {
                var children = [];
                let childrenColumns = subColumns.splice(0, item.colspan);
                childrenColumns.forEach((citem, cindex) => {
                    that.__sortColumn(grid, citem);
                    let extend = that.__formatterColumn(grid, citem);
                    children.push(Object.assign({}, citem, {
                        title: !!citem.require ?
                            !!citem.tip ?
                              <span><span style={{ color: "red" }}>*</span>{that.__tableTip(citem.tip, citem.title)}</span>
                                 :
                              <span><span style={{ color: "red" }}>*</span>{citem.title}</span>
                        :!!citem.tip ? <span>{that.__tableTip(citem.tip, citem.title)}</span>:
                        citem.title,
                        width: citem.width || 100,
                    }, extend));
                    columnsTotalWidth.x += parseInt(citem.width) || 100;
                });
                item.children = children;
            } else {
                let extend = that.__formatterColumn(grid, item);
                //默认显示，排序安数组顺序
                item = Object.assign({}, item, {
                    // title: !!item.require ? <span><span style={{color:"red"}}>*</span>{item.title}</span> : item.title,
                    title: !!item.require ?
                                !!item.tip ?
                                    <span><span style={{ color: "red" }}>*</span>{that.__tableTip(item.tip, item.title)}</span>
                                    :
                                    <span><span style={{ color: "red" }}>*</span>{item.title}</span>
                            :
                            !!item.tip ? <span>{that.__tableTip(item.tip, item.title)}</span>:item.title,
                    width: item.width || 100
                }, extend);
                that.__sortColumn(grid, item);

                columnsTotalWidth.x += parseInt(item.width) || 100;
            }

            normalcolumns.push(item);
        });

        return this.__formatFixed(grid, normalcolumns, columnsTotalWidth);
    }

    // 增加fixed等属性
    __formatFixed(grid, tablecolumns, columnsTotalWidth) {

        let columns = [];

        let fixColumns = 0;
        var that = this;
        let width = 0;
        const prefix = _.get(grid, "prefix", "");

        var leftFixed = false;

        tablecolumns.forEach((item) => {
            if (item && item.hidden !== true && item.show !== false) {
                if (!!item.colspan) {
                    if (item.children && item.children.length > 0) {
                        item.children.forEach((sitem) => {
                            width += sitem.width || 100;
                            Object.assign(sitem, { dataIndex: prefix + sitem.field });
                        })
                    }
                } else {
                    width += item.width || 100;
                }
                if (!!item.fixed) {//含有固定列
                    columns.splice(fixColumns++, 0, Object.assign(item, { dataIndex: prefix + item.field, fixed: 'left' }));
                    leftFixed = true; // 为了给第一列加上序号用的
                } else {
                    columns.push(Object.assign(item, { dataIndex: prefix + item.field }));
                }
            }
        });

        if (columns.length > 0) {
            if (!columns[columns.length - 1].autowidth && columns[columns.length - 1].field && columns[columns.length - 1].field.indexOf('_') != 0) {
                columns.push({ dataIndex: '_0_', title: '', key: '_0_', width: null });
            } else {
                columns[columns.length - 1].width = null;
            }

            if(grid.sn) {
                if(columns[0].dataIndex === "__op") {
                    columns.splice(1, 0, Object.assign({ title: '序号', width: 80, align: 'center', render: function(text, row, index) { return index + 1; } }, leftFixed ? { fixed: 'left'} : {}));
                } else {
                    columns.splice(0, 0, Object.assign({ title: '序号', width: 80, align: 'center', render: function(text, row, index) { return index + 1; } }, leftFixed ? { fixed: 'left'} : {}));
                }
                columnsTotalWidth.x += 80;
            }

            return columns;
        } else {
            return null;
        }
    }

    // 列自定义渲染方式
    __formatterColumn(grid, item) {
        let extend = {};
        if (item.formatter) {
            var that = this;
            if (typeof (item.formatter) == "string") {
                extend.render = function (text, row, index) {
                    return grid.functions[item.formatter].apply(that, [text, row, index]);
                }
            } else if (typeof (item.formatter) == "function") {
                extend.render = function (text, row, index) {
                    return item.formatter.apply(that, [text, row, index]);
                }
            }
        } else if (item.formattertype) {
            var that = this;
            switch (item.formattertype) {//formattertype:d:数字；t：日期/时间；s：字符串；n：整形；m：金额；
                case "t": // 时间
                    extend.render = function (text, row, index) {
                        return that.__format.date(text);
                    }
                    break;
                case "m": // 钱
                case "n":
                    extend.render = function (text, row, index) {
                        return that.__format.money(text, 2);
                    }
                    break;
                case "r": // 链接
                    extend.render = function (text, row, index) {
                        return that.tool.table.renderHtml(row, text);
                    }
                    break;
                default:
                    extend.render = function (text, row, index) {
                        return text;
                    }
            }
        }
        if (!extend.render && item.server) { // 如果是数据字典，自动进行转义
            extend.render = function (text, row, index) {
                if (item && item.data && _.isArray(item.data)) {
                    var dict = item.data.find(d => d.value === text);
                    if (dict) return dict.text;
                }
                return text;
            }
        }

        if (grid.idField) {
            // 编辑模式
            extend.onCell = (record) => {
                const {
                    editData
                } = this.state;
                const curEditKey = grid.idField.split(",").map((key) => record[key]).join("_");
                return {
                    record,
                    editing: editData[curEditKey] !== undefined,
                    arg: item,
                    grid: grid,
                    cellHandleEvent: (event, field, value, text, object) => {
                        let setData = { [field]: value };
                        let retData;
                        if (item.event && item.event[event.type]) {
                            if (_.isFunction(item.event[event.type])) {
                                retData = item.event[event.type].call(this, event, field, value, text, object, item, editData[curEditKey]);
                            } else if (_.isString(item.event[event.type])) {
                                retData = grid.functions[item.event[event.type]].call(this, event, field, value, text, object, item, editData[curEditKey]);
                            }
                        }
                        if (retData && _.isObject(retData)) {
                            _.extend(setData, retData);
                        }

                        this.__editChangeField(curEditKey, setData);
                    },
                }
            };
        }

        if (item.ellipsis === undefined && grid.ellipsis !== undefined)
            item.ellipsis = grid.ellipsis;

        return extend;
    }

    // 预定义的格式化操作
    __format = {
        date: function (text) {
            if (text) {
                let textstr = text.toString();
                if (textstr.length == 8)
                    return textstr.substring(0, 4) + "-" + textstr.substring(4, 6) + "-" + textstr.substring(6, 8);
                else
                    return text;
            } else
                return text;
        },
        money: function (s, n) {
            if (s == undefined) return 0;
            n = n >= 0 && n <= 20 ? n : 2;
            s = parseFloat((s + "").replace(/[^\d\.-]/g, "")).toFixed(n) + "";
            //是否是负数
            var prestr = '';
            if (s.substring(0, 1) == "-") {
                s = s.substring(1, s.length);
                prestr = '-';
            }
            var l = s.split(".")[0].split("").reverse(),
                r = s.split(".")[1];
            var t = "";
            for (var i = 0; i < l.length; i++) {
                t += l[i] + ((i + 1) % 3 == 0 && (i + 1) != l.length ? "," : "");
            }

            if (n == 0)
                return prestr + t.split("").reverse().join("");
            else
                return prestr + t.split("").reverse().join("") + "." + r;
        }
    }

    // 列排序转换
    __sortColumn(grid, item) {
        if (!!item.sortable) {
            item.sorter = true;
            item.sortDirections = ['descend', 'ascend'];
        }
        if (grid && grid.sortName == item.field) {
            item.defaultSortOrder = (grid.sortOrder &&
                (grid.sortOrder == "desc" || grid.sortOrder == "descend" || grid.sortOrder == 1)) ? "descend" : "ascend";
        }
    }

    __getFooter = () => {
        if (!!this.state.msg)
            return this.state.msg;
    }

    // 修改
    __editChangeField = (editKey, setData) => {
        const {
            editData,
        } = this.state;

        if (editData && editData[editKey] && setData && _.isObject(setData)) {
            Object.keys(setData).forEach(field => {
                editData[editKey][field] = setData[field];
            })
            this.setState({ editData });
        }
    }

    // tip
    __tableTip = (tip, title) => {
        let tipView = [];
        tip && tip.indexOf('<br>') >= 0 && tip.split("<br>").forEach((v, i) => {
            tipView.push(v)
        })
        return (<><Tooltip title={tipView.length > 0 ? <div>{tipView.map(item => { return <span>{item}<br /></span> })}</div> : tip}>
            <img style={{ width: "15px", height: "15px", top: "15px" }}
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAAXNSR0IArs4c6QAABUVJREFUSA3lV21I3WUUP+deXzObrWnozDkVt2YjqAzGGrjRh1oxxHBBDcTNUS3Z9FYUUaJRH/rQtYYtFlmXXj40a20tDIqwjcA2BHvbymXXF1KZS600Tb33nn7n730uz727dxP6FD3gfc5z3n7/55zznOeR6P82eLkbXtMqN3KIKoXpDtisJqFcYpoFPYa/X5ip03UVdfof4j+W4/OKwADcJkIvkshttkNmngc/mUhchs/EC6DbXW5qGWjgC4Yfb04IXHRYVgRnyCcklWoIoO+www8A0wk4//A+nqrokqTRXrp+keiWkFAl5FUikgXlGUSgcaiR34gH6viLJyj2SklA6ARA18NJPws9NfQYfxhP1+YVHJJreY6eBm8/bFNczAfL88nTsZODtp7Sl+y4+DXJCczSGRiugfjj9Cza1beHp23DZhGXr41Kk4Qm+vfzRVumdEGrbEY9HIWPHHz4K8MebojViQK+9bAk//YXdSFcmxHad2sbqaaZ4SI8Ct+SNJmi55DbfchthrKh1yduenT4AH9h9HQGeBEi9TV8ZUOnbsjD7bY8UhjKvDhDj4RBTycnUZ0NqrsEaCfkTyB/i3D2KVB7sF5HQfp8rVd22o6HG9nvdlMV9BZxAlpLDkq2LY8AQ3ANBM/CWRClugchnLcVfV7aC5CtcNSdnkIl2MF2hLDczbwDeiEk8VBhKwrLGv4D/BWWbQh55uIifFsjArwYoF0I3yrE/u1+D5+1dBwyxHSPQzDV/1TPE0Y+4OETaoPjdp0QbTJ8M+MjX8DH/on13rJX5WrDjwAjb86xQYOIyoVRxIyGwRO3r6ZvLZ4hnQ9FTksNw8zhjzyOXadNL9Bdhu8Ab/JKOvJWgQYwvruBuo3Qnl1M1dDZEns0nBQJ1YV1v7FtIjTTMaVRpncbXpISF9yULwFJBvD3dkEZJZ0HG3nQXiutVb4wRZ8gResRzo8GPXwyVkfXSMHSBzEVGbmzY1RGnsNgGjWCK83hKn8Pud2iBQcHDyaycWWF/UoYB4pLOXZRWtjo70TGsfw3W+kZVHkVonQOFXNvtwc9K8EozyB0VQSaIzhLwKhKvWE0JrkJbKPY1UfEjUJ6HMU260ql7Wc9PBmlELM4M0I5cK6bjETU2XFqEo2EdYtibOIue8ZREzib+NCegXoeiqtkMd0uKg4vo4G15DVkcLYBTaDQsolLukPkFCUihRBeeQSCSz0A+qeMtrNjXSAQx3VGY45qfcqLHfkbaQgF1YWcHY2Vxa61CMG7T/mcsnSsHFp/dOgLQ0L0A87qBPp0CVqmdpt/PQq9UhMS8eFDT6LNVhiHkR3j0v4RofChUrMXgtRiFBLNmhJtPInkyi/zykpE8Hml2UVP6mxGBFgZqUxNqNRJCkkDIpDwXEJWhReHHxV5vuyIpBhn9qyvkxmiDpzzfOz2ncEGPm3Lo4DPe3iE3JpjDqBi2wteElwccYbQWjhkHKmc4DhlxmroZeDvxTNJZBuKtndVBj0cq4PoXjqQl1rs6HWUXJI+X1wZ1GS/HjXEOPg1CN85POpO2R6KXpbyQAgXjchG7LQP9XIn6uVXW0fpuMAqCL8uNVQrEX4cN/LiYu/AHfuzyu2hL5fJOaoIhpzLolqjAZvPcLHcjx7/u61r6ITAqgDwXIS8BU1+N5y5HSM8/sAbQM8bw9nTWy0P65vQA1aE5SPgNdU2kK/ZejY5MuvnssBGr6hNSkPz9AD2UYm83Wz4kZmdPq07PJYr9P7l+raxWRawUdZ5XbtkLkxTHh4O+p/EnDuZRm/YQGNfbkVB/hfGPyac8XEnYx4XAAAAAElFTkSuQmCC"></img>
        </Tooltip>
            {title}
        </>)
    }
}

class EditableCell extends React.Component {

    static components = {};

    handleEvent = (event, field, value, text, object) => {
        const {
            cellHandleEvent
        } = this.props;

        if (cellHandleEvent) {
            cellHandleEvent(event, field, value, text, object);
        }
    }

    getControlRender(item) {
        if (!item.type) item.type = "input";
        if (typeof (item.type) == "string") {//系统控件或者html标签
            if (_.isEmpty(EditableCell.components)) {
                EditableCell.components = { input: FormInput, select: FormSelect, date: FormDate };
            }
            _.forEach(EditableCell.components, (component, key) => {
                if (key == item.type) {
                    item.control = component;
                    if (!item.field) item.field = item.type + index;
                    return;
                }
            });
        } else {//自定义对象

        }
        if (!item.control) return null;

        return item;
    }

    renderCell = () => {
        const {
            editing,
            record,
            arg,
            className,
            style,
            title,
            grid,
        } = this.props;

        const editFlag = _.get(grid, "operate.edit", "");

        let edit = _.get(arg, "edit", editFlag === "cell" ? false : true);// 强制是否可编辑，一般用于
        const align = _.get(arg, "align", _.get(style, "textAlign", "center"));

        if(_.isFunction(edit)) {
            edit = edit(null, record, null);
        }
        if(arg && edit && editing) {
            const editArg = _.cloneDeep(arg);
            editArg.extradata = record;
            const value = _.get(record, arg.field, null);
            if (value !== null) {
                editArg.defval = value;
            }

            let item = this.getControlRender(editArg);
            if(_.isFunction(item.disabled)) {
                item.disabled = item.disabled(null, record, null);
            }

            const controlProps = {
                key: item.field,
                arg: item,
                edit: edit,
                hidden: !!item.hidden,
                disabled: item.disabled,
                handleEvent: this.handleEvent,
            };

            return (
                <td>
                    {
                        <item.control {...controlProps} />
                    }
                </td>
            );
        }

        if (className && className.indexOf("ant-table-row-cell-ellipsis") >= 0) {
            return <td className={className} style={{ textAlign: align }} title={title}>{this.props.children}</td>;
        }
        return <td className={className} style={{ textAlign: align }}>{this.props.children}</td>;

    };

    render() {
        return this.renderCell();
    }
}



export default QueryTable