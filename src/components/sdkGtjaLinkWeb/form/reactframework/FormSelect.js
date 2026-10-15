import { Radio, Checkbox, TreeSelect, Select, Tree, Badge, Switch, Cascader, Tooltip, Icon } from 'antd';

import React, { Component } from 'react';

import FormExtraLabel from './FormExtraLabel';
import FormBaseComponent from './FormBaseComponent';
import FormLabel from './FormLabel';
import FormTableModal from './FormTableModal';
import check from './Util';
import Tool from './Tool';

import linkRequest from '../../utils/linkRequest';

import _ from 'lodash';

class FormSelect extends FormBaseComponent {


    constructor(props) {
        super(props);

        let textfield = _.get(props.arg, "options.textfield", "text");
        let valuefield = _.get(props.arg, "options.valuefield", "value");

        const {
            value,
            valueObj,
            initDataFlag,
        } = this.__initDefValue(props.arg, props.arg.defval);

        this.tool = new Tool();

        this.state = {
            value: value,
            valueObj: valueObj,
            text: [],
            initDataFlag,
            textfield: textfield,
            valuefield: valuefield,
            error: false,
            errormsg: "",
            serverDataLoading: false,
            serverData: [],
        };
    }

    componentDidMount() {
        const {
            data
        } = this.props.arg;

        if (!this.state.initDataFlag && data) {
            const {
                value,
                valueObj,
                initDataFlag,
            } = this.__initDefValue(this.props.arg, this.props.arg.defval);

            this.setState({
                value,
                valueObj,
                initDataFlag,
            });
        }
        if (this.props.onRef && this.props.arg.field)
            this.props.onRef(this, this.props.arg.field);
    }

    //主要是为了检查data
    componentWillReceiveProps(nextProps) {
        if (nextProps.arg.data && (!_.isEqual(nextProps.arg.data, this.props.arg.data) || !this.state.initDataFlag)) { // 如果
            const {
                value,
                valueObj,
                initDataFlag,
            } = this.__initDefValue(nextProps.arg, nextProps.arg.defval);

            this.setState({ value: value, valueObj: valueObj, initDataFlag });
        }
    }

    _setValue(newvalue) {
        let prevalue = this.state.value;
        if (prevalue === newvalue) return;

        let setValue = newvalue;
        if (_.isString(newvalue)) {

        } else if (_.isObject(newvalue)) {
            setValue = { value: newvalue };
        }

        const {
            textfield
        } = this.state;

        // todo: 遍历一遍设置valueObj
        const {
            value,
            valueObj,
            initDataFlag,
        } = this.__initDefValue(this.props.arg, setValue);

        const multiple = _.get(this.props.arg, "multiple", false);

        this.setState({ value, valueObj, initDataFlag }, () => {
            super.handleEvent(null, { type: "change", source: "", target: this.props.arg.field }, this.props.arg.field, multiple ? value : (value && value.length > 0 ? value[0] : null), multiple ? valueObj.map(o => o[textfield]) : (valueObj && valueObj.length > 0 ? valueObj[0][textfield] : null), multiple ? valueObj : (valueObj && valueObj.length > 0 ? valueObj[0] : null));
        });
    }

    _getValue() {
        const {
            field,
            fieldtext,
        } = this.props.arg;

        const {
            value,
            text,
            valueObj,
            textfield,
        } = this.state;

        const displaytype = _.get(this.props.arg, "displaytype", "select_v");
        const limitype = _.get(this.props.arg, "options.limitype", 2);
        const multiple = _.get(this.props.arg, "multiple", false);

        let retArr = [];

        if (value.length === 0 || (value[0] === "" && (limitype === 0 || limitype === 1))) {
            retArr.push({ field: field, value: null, valueObj: null });

            if (fieldtext) {
                retArr.push({ field: fieldtext, value: null, valueObj: null });
                return retArr;
            } else {
                return null;
            }
        }
        if (displaytype === "cascade") {
            retArr.push({ field: field, value: value[value.length - 1], valueObj: multiple ? valueObj : valueObj[0] });
        } else {
            retArr.push({ field: field, value: multiple ? value.join() : value[0], valueObj: multiple ? valueObj : valueObj[0] });
        }
        if (fieldtext) {
            retArr.push({ field: fieldtext, value: multiple ? valueObj.map(v => v[textfield]).join() : valueObj[0][textfield], valueObj: multiple ? valueObj : valueObj[0] });
        }

        return retArr.length > 0 ? retArr : null;
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

    _onRef = (ref, field) => {
        this.state.ref = ref;
    }

    render() {
        let edit = _.get(this.props, "edit", true);
        return !!this.props.hidden ? this.__renderHidden() : !edit ? this.__renderDisplay() : this.__renderEdit();
    }

    // 初始化数据+
    __initDefValue = (arg, curval) => {
        const {
            data,
        } = arg;

        // 先实现这三种
        // defval: ""
        // defval: {index : 0}
        // defval: {value : {value: "123", text: "xxx"}}

        let textfield = _.get(arg, "options.textfield", "text");
        let valuefield = _.get(arg, "options.valuefield", "value");

        let multiple = _.get(arg, "multiple", false);

        let displaytype = _.get(arg, "displaytype", "");

        let value = [];
        let valueObj = [];
        if (curval === undefined || curval === null) {
            return { value, valueObj, initDataFlag: true };
        } else if (displaytype === "cascade") {
            let curObj = data.find(v => v[valuefield] === curval);
            if (curObj) {
                value.push(curval);
                valueObj.push(curObj);
                let parentfield = _.get(arg, "options.parentfield", "parent");

                function getParent(parval) {
                    let curPar = data.find(v => v[valuefield] === parval);
                    if (curPar) {
                        value.splice(0, 0, parval);
                        valueObj.splice(0, 0, curPar);

                        if (curPar[parentfield]) {
                            getParent(curPar[parentfield]);
                        }
                    }
                }
                if (curObj[parentfield]) {
                    getParent(curObj[parentfield]);
                }
            }
            return { value: value, valueObj: valueObj, initDataFlag: true };
        } else {
            if (data && _.isArray(data)) { // 假如有数据源
                if (_.isObject(curval)) {
                    if (curval.index !== undefined) { // 类似 curval: {index : 1}
                        data.forEach((item, index) => {
                            if (_.isArray(curval.index)) {
                                curval.index.forEach(dI => {
                                    if (index === dI) {
                                        valueObj.push(item);
                                        return multiple; // 如果是单选就返回，多选则继续
                                    }
                                })
                            } else {
                                if (index === curval.index) {
                                    valueObj.push(item);
                                    return multiple; // 如果是单选就返回，多选则继续
                                }
                            }
                            if (valueObj.length > 0) return multiple; // 如果是单选就返回，多选则继续
                        });
                    } else if (_.isObject(curval.value) && curval.value.value !== undefined) { // 类似 curval: {value: {value: "", text : ""}}
                        if (multiple) {
                            const vs = curval.value.value.split(',');
                            data.forEach(item => {
                                if (vs.findIndex(v => v === item[valuefield]) >= 0) {
                                    valueObj.push(item);
                                }
                            });
                        } else {
                            valueObj = data.filter(item => item[valuefield] === curval.value.value);
                        }
                        if (!valueObj || valueObj.length === 0) {
                            let v = {};
                            v[valuefield] = curval.value.value;
                            v[textfield] = curval.value.text || curval.value.value;
                            valueObj = [v];
                        }
                    }
                } else { // 类似  curval: "", 直接判断valuefield相等
                    if (multiple) {
                        curval.split(',').forEach(c => {
                            let _curObj = data.filter(item => item[valuefield] === c);
                            if (!_curObj && _curObj.length === 0) {
                                let v = {};
                                v[valuefield] = c;
                                v[textfield] = c;
                                valueObj.push(v);
                            } else {
                                valueObj = valueObj.concat(_curObj);
                            }
                        });
                    } else {
                        valueObj = data.filter(item => item[valuefield] === curval);
                        if (!valueObj || valueObj.length === 0) {
                            let v = {};
                            v[valuefield] = curval;
                            v[textfield] = curval;
                            valueObj = [v];
                        }
                    }
                }
                return { value: valueObj.map(o => o[valuefield]), valueObj, initDataFlag: true };
            } else { // 没有数据源的话，以数据为准
                if (_.isObject(curval)) {
                    if (curval.value && _.isObject(curval.value)) {
                        if (multiple) {
                            let vsplits = curval.value.value.split(',');
                            let tsplits = curval.value.text.split(',');
                            if (vsplits.length === tsplits.length) {
                                vsplits.forEach((c, i) => {
                                    let v = {};
                                    v[valuefield] = c;
                                    v[textfield] = tsplits[i];
                                    valueObj.push(v);
                                });
                            }

                        } else {
                            let v = {};
                            v[valuefield] = curval.value.value;
                            v[textfield] = curval.value.text;
                            valueObj = [v];
                        }
                    }
                } else { // 类似  curval: "", 直接判断valuefield相等
                    if (multiple) {
                        curval.split(',').forEach(c => {
                            let v = {};
                            v[valuefield] = c;
                            v[textfield] = c;
                            valueObj.push(v);
                        });
                    } else {
                        let v = {};
                        v[valuefield] = curval;
                        v[textfield] = curval;
                        valueObj = [v];
                    }
                }
                return { value: valueObj.map(o => o[valuefield]), valueObj, initDataFlag: false };
            }
        }
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
            page,
        } = this.props;

        const {
            placeholder,
            require,
            data,
            server,
        } = this.props.arg;

        const {
            value,
            valueObj,
            textfield,
            valuefield,
            serverData,
        } = this.state;

        const displaytype = _.get(this.props.arg, "displaytype", "select_v");

        const multiple = _.get(this.props.arg, "multiple", false);

        let style = this.__getStyle();

        if (displaytype == "select" || displaytype == "select_v" || displaytype == "radio"
            || displaytype == "checkbox") { // 一层数据
            let lazy = _.get(this.props.arg, "server.lazy", false);

            let selectData = ((lazy ? serverData : data) || (valueObj && valueObj.length > 0 && valueObj) || []).map((item) => {
                return { value: item[valuefield], text: item[textfield], badge: item["badge"] || null, source: item };
            });

            let dataFilter = _.get(this.props.arg, "options.datafilter", null);
            if (dataFilter && _.isFunction(dataFilter)) {
                let filterData = dataFilter.call(this, selectData, this.props.arg.extradata);
                if (filterData !== undefined && _.isArray(filterData)) {
                    selectData = filterData;
                }
            }

            let limitype = _.get(this.props.arg, "options.limitype", 2);

            if (limitype === 0) {
                selectData.splice(0, 0, { value: '', text: '不限' });
            } else if (limitype === 1) {
                selectData.splice(0, 0, { value: '', text: '全部' });
            }
            if (displaytype == "select") {
                let showSearch = _.get(this.props.arg, "options.showSearch", false);

                let searchConfig = _.extend({
                    value: value,
                    defaultValue: value,
                    mode: multiple ? "multiple" : null,
                    allowClear: !multiple && !require,
                    disabled: !!disabled,
                }, lazy ? {
                    showSearch: true,
                    filterOption: false,
                    onSearch: this.__onSearch
                } : showSearch ? {
                    showSearch: true,
                    optionFilterProp: "children",
                } : server && server.page ? {
                    open: false,
                    onFocus: () => {
                        if (this.state.ref) this.state.ref.blur();
                        if (!valueObj) {
                            valueObj = [];
                        }
                        if (!server.page.data) server.page.data = {};
                        server.page.grid.data.selectedRowKeys = valueObj.map(r => r[valuefield]);
                        server.page.grid.data.selectedRows = valueObj.slice();
                        this.setState({ tablemodalVisible: true });
                    }
                } : null);
                return this.__renderTemplete(style,
                    <>
                        <Select style={style.controlstyle}
                            ref={this._onRef}
                            {...searchConfig}
                            onChange={(value) => this.__handleSelectChange(null, value)}>
                            {selectData.length > 0 ? selectData.map(tag => (
                                <Select.Option key={tag.value} value={tag.value}>{tag.text}</Select.Option>
                            ))
                                :
                                null
                            }
                        </Select>
                        {
                            server && server.page ?
                                <FormTableModal visible={this.state.tablemodalVisible} handleClose={(flag) => { this.setState({ tablemodalVisible: flag }) }} handleEvent={this.__getTableData} parent={page && page.control} page={server.page} arg={this.props.arg} />
                                : null
                        }
                    </>
                );
            } else if (displaytype == "checkbox") {
                const plainOptions = selectData.map(function (tag) {
                    return { label: tag.text, value: tag.value }
                });

                return this.__renderTemplete(style,
                    <Checkbox.Group disabled={!!disabled} value={value} defaultValue={value}
                        options={plainOptions}
                        onChange={(checkedValues) => this.__handleSelectChange(null, checkedValues)} />
                );
            } else if (displaytype == "radio") {
                return this.__renderTemplete(style,
                    <Radio.Group disabled={!!disabled} value={value[0]} defaultValue={value[0]}
                        onChange={this.__handleSelectChange}>
                        {selectData.map(tag => (
                            <Radio key={tag.value} value={tag.value}>{tag.text}</Radio>
                        ))}
                    </Radio.Group>
                );
            } else if (displaytype == "select_v") {
                return this.__renderTemplete(style,
                    <Radio.Group disabled={!!disabled} value={value[0]} defaultValue={value[0]}
                        onChange={this.__handleSelectChange}>
                        {selectData.map(tag => (
                            (tag["badge"] ?
                                <Badge key={tag.value} count={tag["badge"]}><Radio.Button value={tag.value}>{tag.text}</Radio.Button></Badge>
                                :
                                <Radio.Button key={tag.value} value={tag.value}>{tag.text}</Radio.Button>
                            )
                        ))}
                    </Radio.Group>
                );
            }
        } else if (displaytype == "cascade") {
            const parentfield = _.get(this.props.arg, "options.parentfield", "parent");
            let showSearch = _.get(this.props.arg, "options.showSearch", false);

            function mapData(item) {
                var childArr = [];
                sourceData.forEach(child => {
                    if (child[parentfield] === item[valuefield]) {
                        childArr.push({ label: child[textfield], key: child[valuefield], value: child[valuefield], children: mapData(child) })
                    }
                });
                return childArr.length > 0 ? childArr : null;
            }
            var treeData = [];

            var sourceData = data;
            (sourceData || (valueObj && valueObj.length > 0 && valueObj) || []).forEach(function (item) {
                if (item[parentfield] === undefined || item[parentfield] === null) {
                    treeData.push({ label: item[textfield], key: item[valuefield], value: item[valuefield], children: mapData(item) });
                }
            });
            const filter = (inputValue, path) => {
                return path.some(option => option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1);
            }

            return this.__renderTemplete(style,
                <Cascader showSearch={ showSearch && filter} value={value} defaultValue={value} options={treeData} onChange={this.__handleCascadeChange} style={style.controlstyle} />
            );
        } else if (displaytype == "switch") {
            var checkedText = "开";
            var unCheckedText = "关";
            (data || []).forEach(item => {
                if (item[valuefield] === "1") checkedText = item[textfield];
                else unCheckedText = item[textfield];
            })
            return this.__renderTemplete(style,
                <Switch checkedChildren={checkedText} unCheckedChildren={unCheckedText}
                    checked={value[0] === "1"}
                    defaultChecked={value[0] === "1"}
                    onChange={(checked, e) => this.__handleSwitchChange(e, checked)} />
            );
        } else if (displaytype == "tree") { // 多层数据
            const parentfield = _.get(this.props.arg, "options.parentfield", "parent");
            function mapData(item) {
                var childArr = [];
                sourceData.forEach(child => {
                    if (child[parentfield] === item[valuefield]) {
                        childArr.push({ title: child[textfield], key: child[valuefield], value: child[valuefield], disabled: child[valuefield] === null, source: child, children: mapData(child) })
                    }
                });
                return childArr.length > 0 ? childArr : null;
            }
            var treeData = [];

            let lazy = _.get(this.props.arg, "server.lazy", false);
            let searchType = _.get(this.props.arg, "server.searchType", "local");
            var sourceData = (lazy || searchType === "server") ? serverData : data;
            sourceData = (sourceData && sourceData.length > 0 && sourceData) || (valueObj && valueObj.length > 0 && valueObj) || [];

            sourceData.forEach(function (item) {
                if (item[parentfield] === undefined || item[parentfield] === null) {
                    treeData.push({ title: item[textfield], key: item[valuefield], value: item[valuefield], disabled: item[valuefield] === null, source: item, children: mapData(item) });
                }
            });

            // 对于没有父节点，或者说父节点的id设置成了一个是值，但是该值不在列表里
            if (treeData.length === 0 && sourceData && sourceData.length > 0) {
                (sourceData || []).forEach(function (item) {
                    let index = sourceData.findIndex(d => d[valuefield] === item[parentfield]);
                    if (index < 0) {
                        treeData.push({ title: item[textfield], key: item[valuefield], value: item[valuefield], disabled: item[valuefield] === null, source: item, children: mapData(item) });
                    }
                });
            }

            let includeParent = _.get(this.props.arg, "options.includeParent", 0);
            let showCheckedStrategy = [TreeSelect.SHOW_CHILD, TreeSelect.SHOW_ALL, TreeSelect.SHOW_PARENT][includeParent];

            let checkable = _.get(this.props.arg, "options.checkable", multiple);
            let expand = _.get(this.props.arg, "options.expand", false);

            let width = _.get(this.props.arg, "style.width", "230px");
            let height = _.get(this.props.arg, "style.height", "400px");
            const emptyText = _.get(this.props.arg, "options.empty", null);

            let showSearch = _.get(this.props.arg, "options.showSearch", true);
            let treeConfig = _.extend({
                style: { width: width },
                dropdownStyle: { maxHeight: height, overflow: 'auto' },
                ref: this._onRef,
                placeholder: placeholder,
                allowClear: !require,
                maxTagCount: 2,
                multiple: multiple,
                showCheckedStrategy: showCheckedStrategy,
                treeCheckable: checkable,
                treeDefaultExpandAll: expand,
                treeCheckStrictly: !multiple, // 单选受控，多选不受控
            }, searchType === "server" ? {  // 搜索时通过检索服务器绑定数据
                showSearch: true,
                onSearch: this.__handleAutoCompleteSearch,
                notFoundContent: <span dangerouslySetInnerHTML={{ __html: emptyText }} />,
                filterTreeNode: false,
            } : searchType === "local" ? { // 一般是和lazy进行配合将全量数据加载之后进行本地搜索

            } : {

            }, lazy ? { // 点击之后才加载数据
                showSearch: true,
                filterOption: false,
                onFocus: () => {
                    const {
                        ref,
                        serverData,
                    } = this.state;
                    if ((!serverData || serverData.length == 0) && ref) {
                        this.state.ref.blur();
                        this.__onSearch();
                    }
                }
            } : {
            }, showSearch ? {
                showSearch: true,
                treeNodeFilterProp: "title",
            } : {
            });
            return this.__renderTemplete(style, <TreeSelect
                {...treeConfig}
                disabled={!!disabled}

                value={value}
                treeData={treeData}
                onChange={this.__handleTreeChange}
            />);
        }
        return null;
    }

    __renderDisplay = () => {
        let style = this.__getStyle();

        const {
            field,
            data,
        } = this.props.arg;
        const {
            textfield,
            valueObj,
        } = this.state;

        const displaytype = _.get(this.props.arg, "displaytype", "");
        const splitchar = displaytype === "cascade" ? "/" : "，";

        if (field.indexOf("-") > 0) {
            return this.__renderTemplete(style, <div className="displaycontent">{valueObj.map(v => v == null ? "" : v[textfield]).join("~")}</div>);
        } else {
            if (displaytype === "displaytree") {
                if (!data)
                    return this.__renderTemplete(style, <div className="displaycontent">{valueObj == null ? "" : valueObj.map(v => v[textfield]).join(splitchar)}</div>);
                const {
                    valuefield,
                } = this.state;
                const parentfield = _.get(this.props.arg, "options.parentfield", "parent");
                let width = _.get(this.props.arg, "style.width", "230px");

                function mapData(item) {
                    var childArr = [];
                    data.forEach(child => {
                        if (child[parentfield] === item[valuefield]) {
                            childArr.push({ title: child[textfield], key: child[valuefield], value: child[valuefield], disabled: child[valuefield] === null, source: child, children: mapData(child) })
                        }
                    });
                    return childArr.length > 0 ? childArr : null;
                }

                var treeData = [];
                data.forEach(function (item) {
                    if (item[parentfield] === undefined || item[parentfield] === null) {
                        treeData.push({ title: item[textfield], key: item[valuefield], value: item[valuefield], disabled: item[valuefield] === null, source: item, children: mapData(item) });
                    }
                });
                let treeConfig = {
                    style: { width: width },
                    defaultExpandAll: true,
                };

                return this.__renderTemplete(style, <Tree
                    {...treeConfig}
                    treeData={treeData}
                />);
            } else {
                return this.__renderTemplete(style, <div className="displaycontent">{valueObj == null ? "" : valueObj.map(v => v[textfield]).join(splitchar)}</div>);
            }
        }
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
            let controlstyle;
            if (field.indexOf("-") > 0) {
                controlstyle = { innerflex: _.get(this.props.arg, "layout.grid.col.innerflex", 1) };
            } else {
                controlstyle = { innerflex: _.get(this.props.arg, "layout.grid.col.innerflex", 2) };
            }

            controlstyle.minWidth = _.get(this.props.arg, "style.minWidth", _.get(this.props.arg, "style.width", "120")) + "px";
            let width = _.get(this.props.arg, "style.width", null);
            if (width !== null) {
                controlstyle.width = width + "px";
            }

            return {
                contentstyle: { className: className },
                labelStyle: labelStyle,
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
                labelStyle: labelStyle,
                style: {},
                groupstyle: {},
                controlstyle: { width: width + "px" }
            };
        }
    }

    __onSearch = (value) => {
        const {
            serverDataLoading,
            initDataFlag,
        } = this.state;

        if (serverDataLoading) return;
        //funcId, params, prefix, Page, ColOrder
        let urlType = _.get(this.props.arg, "server.urlType", "");
        if (!urlType) return;

        let url = _.get(this.props.arg, "server.url", "");
        let getParam = _.get(this.props.arg, "server.getParam", null);
        let param = {};
        if (_.isFunction(getParam)) {
            param = getParam.call(this.props.page, param);
        } else if (_.isObject(getParam)) {
            param = getParam;
        }

        let pagesize = _.get(this.props.arg, "server.page.pagesize", null);
        let page = null;
        if (pagesize != null) {
            page = { PageSize: pagesize, CurrentPage: 1 }
        }

        this.setState({ serverDataLoading: true, serverData: [] });
        linkRequest(urlType, param, url, page).then((data) => {
            let serverData = [];
            if (data.State === 0) {
                serverData = data.Data || [];
            }
            this.setState({ initDataFlag: true, serverDataLoading: false, serverData: serverData });
        }).catch(() => this.setState({ serverDataLoading: false }));
    }

    // select check radio 的变更事件
    // clear 的话，e 是null 和 newvalue 是undefined
    __handleSelectChange = (e, newvalue) => {
        const {
            data,
            field,
        } = this.props.arg;
        const {
            textfield,
            valuefield,
            value,
            valueObj,
        } = this.state;

        const prevalue = this.state.value;

        let multiple = _.get(this.props.arg, "multiple", false);
        let limitype = _.get(this.props.arg, "options.limitype", 2);

        if (e) {
            newvalue = [e.target.value];
        } else {
            if (Array.isArray(newvalue)) {
                if (!multiple) {// 单选，仅剩下和以前不一致的
                    if (prevalue && prevalue.length === 1) {
                        if (newvalue.length > 0) {
                            newvalue.forEach(v => {
                                if (v !== prevalue[0]) {
                                    newvalue = [v];
                                }
                            });
                        } else
                            newvalue = [];
                    }
                }
            } else if (newvalue === null || newvalue === undefined) { // 点了清空
                this.setState({ value: [], valueObj: [] }, () => {
                    super.handleEvent(e, { type: "change", source: field, target: field }, field, null, null, null);
                });
                return;
            } else {
                newvalue = [newvalue];
            }
        }

        if (limitype === 0 || limitype === 1) { // 如果是自动添加了全部
            const index = newvalue.findIndex(v => v === "");
            if (index >= 0) { // 如果其中有选择了全部
                newvalue = [];
            }
        }

        if (_.isEqual(value, newvalue))
            return;

        let newvalueObj = [];
        if (data && data.length > 0) {
            newvalue.forEach(v => {
                data.forEach(d => {
                    if (d[valuefield] === v) {
                        newvalueObj.push(d);
                        return false;
                    }
                })
            });
        } else if (valueObj && valueObj.length > 0) {
            newvalue.forEach(v => {
                valueObj.forEach(d => {
                    if (d[valuefield] === v) {
                        newvalueObj.push(d);
                        return false;
                    }
                })
            });
        }

        this.setState({ value: newvalue, valueObj: newvalueObj }, () => {
            super.handleEvent(e, { type: "change", source: field, target: field },
                field,
                multiple ? newvalue : (newvalue.length > 0 ? newvalue[0] : null),
                multiple ? newvalueObj.map(v => v[textfield]) : (newvalueObj.length > 0 ? newvalueObj[0][textfield] : null),
                multiple ? newvalueObj : (newvalueObj.length > 0 ? newvalueObj[0] : null));
        });
    }

    __handleCascadeChange = (value) => {
        const {
            textfield,
            valuefield,
        } = this.state;

        var valueObj = [];
        var text = [];

        const {
            data,
            field,
        } = this.props.arg;
        if (field.indexOf('-') > 0) { // 目前不是这样实现的，后面删掉：如果是-分割的话，那返回对象就是{field1:"",field2:"",field3:""}这样的数据
            if (!data) {
                field.split('-').forEach((f, i) => {
                    if (value[i] !== undefined) {
                        valueObj.push(value[i]);
                        text.push(value[i]);
                    }
                });
            } else {
                const fieldArr = field.split('-');
                let curVal; // 递归记录当前值
                value.forEach((v, i) => {
                    curVal = data.find(c => c[valuefield] === v);
                    if (curVal) {
                        valueObj.push(curVal);
                        text.push(curVal[textfield]);
                    }
                })
            }
        } else { // 如果是只设置一个，那就是
            value.forEach((v, i) => {
                let curVal; // 递归记录当前值
                curVal = data.find(c => c[valuefield] === v);
                if (curVal) {
                    valueObj.push(curVal);
                    text.push(curVal[textfield]);
                }
            })
        }

        this.setState({ value, text, valueObj }, () => {
            super.handleEvent(null, { type: "change", source: field, target: field }, field, value, text, valueObj);
        });
    }

    __handleSwitchChange = (e, value) => {
        const {
            textfield,
            valuefield,
        } = this.state;

        var valueObj = {};

        const {
            data,
            field,
        } = this.props.arg;
        if (!data) {
            valueObj[valuefield] = value ? "1" : "0";
            valueObj[textfield] = value ? "开" : "关";
        } else {
            data.forEach(item => {
                if (value) {
                    if (item[valuefield] === "1") {
                        valueObj[valuefield] = item[valuefield];
                        valueObj[textfield] = item[textfield];
                        return false;
                    }
                } else {
                    if (item[valuefield] !== "1") {
                        valueObj[valuefield] = item[valuefield];
                        valueObj[textfield] = item[textfield];
                        return false;
                    }
                }
            });
        }

        this.setState({ value: [valueObj[valuefield]], valueObj: [valueObj] }, () => {
            super.handleEvent(e, { type: "change", source: field, target: field }, field, valueObj[valuefield], valueObj[textfield], valueObj);
        });
    }

    // tree 的变更事件
    __handleTreeChange = (values, texts, extra) => {
        const {
            textfield,
            valuefield
        } = this.state;

        let multiple = _.get(this.props.arg, "multiple", false);

        var valueArr = [];
        var textArr = [];
        var valueObjArr = [];

        if (!multiple) {//单选
            let checkable = _.get(this.props.arg, "options.checkable", multiple);
            if ((checkable && extra.checked) || (!checkable && extra.selected)) { // 如果最后一次是选中，那就只保留最后一次的节点
                const {
                    value,
                    title,
                    source,
                } = extra.triggerNode.props;
                valueArr.push(value);
                textArr.push(title);
                valueObjArr.push(source ? source : { [valuefield]: value, [textfield]: title });
            } else { // 如果最后一次是取消选中，置空即可

            }
            this.setState({ value: valueArr, text: textArr, valueObj: valueObjArr }, () => {
                super.handleEvent(null, { type: "change", source: this.props.arg.field, target: this.props.arg.field }, this.props.arg.field, valueArr, textArr, valueObjArr);
            });
        } else { //多选
            if (extra.allCheckedNodes && extra.allCheckedNodes.length > 0) {
                function getChild(node) {
                    valueObjArr.push(node.source ? node.source : { [valuefield]: node.value, [textfield]: node.title });
                    if (node.children && node.children.length > 0) {
                        node.children.forEach(n => {
                            getChild(n.props);
                        });
                    }
                }
                extra.allCheckedNodes.forEach(child => {
                    let node = (child.node && child.node.props) || child.props;
                    valueObjArr.push(node.source ? node.source : { [valuefield]: node.value, [textfield]: node.title });
                    if (node.children && node.children.length > 0) {
                        node.children.forEach(n => {
                            getChild(n.props);
                        })
                    }
                });
            }
            valueArr = valueObjArr.map(v => v[valuefield]);
            textArr = valueObjArr.map(v => v[textfield]);
            this.setState({ value: valueArr, text: textArr, valueObj: valueObjArr }, () => {
                super.handleEvent(null, { type: "change", source: this.props.arg.field, target: this.props.arg.field }, this.props.arg.field, valueArr, textArr, valueObjArr);
            });
        }
    }

    // 自动查询
    __handleAutoCompleteSearch = value => {
        if (value) {
            this.__handleAutoCompleteFetch(value, (serverData) => {
                if (serverData.length === 0) {
                    this.setState({ serverData, value: [], text: [], valueObj: [] });
                } else {
                    this.setState({ serverData });
                }
            });
        } else if (this.state.timeout) {
            clearTimeout(this.state.timeout);
            this.state.timeout = null;
            this.state.autocompletesearchvalue = value;
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

    // 弹框赋回给select
    __getTableData = (event, field, tableValue, tableText, tableValueObj) => {

        //const valuefield = _.get(this.props.arg, "server.options.valuefield", "value");
        //const textfield = _.get(this.props.arg, "server.options.textfield", "text");
        const {
            textfield,
            valuefield,
        } = this.state;

        let value = [];
        let text = [];
        let valueObj = [];
        if (tableValueObj && _.isArray(tableValueObj) && tableValueObj.length > 0) {
            _.forEach(tableValueObj, o => {
                value.push(o[valuefield]);
                text.push(o[textfield]);
                valueObj.push(o);
            });
        }

        this.setState({ value, text, valueObj }, () => {
            super.handleEvent(null, { type: "change", source: this.props.arg.field, target: this.props.arg.field }, this.props.arg.field, value, text, valueObj);
        });
    }
}
export default FormSelect
