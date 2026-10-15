import React, { Component } from 'react';

import FormBaseComponent from '../FormBaseComponent';

import { Row, Col, Tree, Tag, Input, Icon, message } from 'antd';
import linkRequest from '../../../utils/linkRequest';

import _ from 'lodash';

class OrgSelect extends FormBaseComponent {

    static defaultProps = {
        arg: "{ labelname: '部门', type: 'dept', options: {textfield: 'deptName', valuefield: 'deptCode'} }", // 控件内部属性
        edit: true, // 是否可编辑，不可编辑时显示为label模式
        disabled: false, // 是否禁用，禁用时显示为input模式
        hidden: false, // 是否隐藏，隐藏时仍然能获取到数据
        width: "",
        heigth: "400px",
    }

    constructor(props) {
        super(props);
        const {
            arg
        } = this.props;

        let textfield = _.get(arg, "options.textfield", "deptName");
        let valuefield = _.get(arg, "options.valuefield", "deptCode");

        let defval = _.get(arg, "defval", null);

        const {
            value,
            text,
        } = this.__initDefValue(defval);

        const parentDeptId =_.get(arg, "options.dept", "-1");

        this.state = {
            value, text, valueObj: null,
            textfield, valuefield,
            parentDeptId,
            expandedKeys: [parentDeptId],
            data: [], filterData: []
        };
    }

    componentDidMount() {
        this.__getServerData();
        if (this.props.onRef)
            this.props.onRef(this);
    }

    _setValue(newvalue) {
        // 有两种情况，一种就是初始化的时候，
        // 还有就是前面一个页面删除了已保存的数据的时候
        const {
            value,
            text,
            valueObj,
        } = this.__initDefValue(newvalue);

        this.setState({ value, text, valueObj });
    }
    _getValue() {
        const {
            field
        } = this.props.arg;
        const {
            value,
            text,
            valueObj
        } = this.state;

        if (!value || value.length == 0) {
            return null;
        }
        return { field, value, text, valueObj };
    }

    render() {
        const {
            filterData,
            value,
            expandedKeys,
        } = this.state;

        const style = this.__getStyle();
        const max = _.get(this.props.arg, "options.max", null)
        const that = this;

        return <>
            <Row style={style.content} gutter={8}>
                <Col span={12}>
                    <Row>
                        <Col>
                            <Input.Search
                                allowClear
                                placeholder="部门名称"
                                onSearch={value => this.__searchOrg(value)}
                                enterButton
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col className="allStaff" style={style.left}>
                            {
                                filterData.length === 0
                                    ?
                                    null
                                    :
                                    <Tree
                                        checkable
                                        expandedKeys={expandedKeys}
                                        onExpand={this.__treeExpand}
                                        onSelect={this.__treeSelect}
                                        checkStrictly={true}
                                        checkedKeys={value}
                                        onCheck={this.__handleChange}
                                    >
                                        {this.__renderTreeNodes(filterData)}
                                    </Tree>
                            }
                        </Col>
                    </Row>
                </Col>
                <Col span={12}>
                    <Row>
                        <Col><span style={{ lineHeight: "32px" }}>已选择：{max ? `${value.length} / ${max}` : null}</span></Col>
                    </Row>
                    <Row>
                        <Col style={style.right}>
                            <Row className="selectedStaff">
                                {
                                    value.map(this.__renderSelectedDept)
                                }
                            </Row>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </>;
    }

    // 初始化数据+
    __initDefValue = (curval) => {
        let value = []
        let text = [];
        let valueObj = null;
        if (_.isString(curval)) { // setValue("1101,1102")
            value = curval.split(',');
            text = curval.split(',');
        } else if (_.isArray(curval)) {
            if (curval.length >= 0) {
                if (_.isString(curval[0])) { // setValue(["1101,1102","北京金融街, 北京知春路"])
                    if (curval.length === 2) {
                        value = curval[0].split(',');
                        text = curval[1].split(',');
                    }
                } else if (_.isArray(curval[0])) { // setValue([["1101",1102"],["北京金融街, 北京知春路"]])
                    if (curval.length === 2) {
                        value = curval[0];
                        text = curval[1];
                    }
                } else if (_.isObject(curval[0])) { // setValue([{value:"", text: ""}])
                    value = curval.map(c => c.value);
                    text = curval.map(c => c.text);
                }
            }
        } else if (_.isObject(curval)) { // setValue({ value: [], text: [], valueObj:[])
            value = curval.value;
            text = curval.text;
            if (curval.valueObj) {
                valueObj = curval.valueObj;
            } else {
                valueObj = value.map((v, i) => { return { value: v, text: text[i] } });
            }
        }
        return { value, text, valueObj };
    }

    __renderSelectedDept = (item, index) => {
        const {
            text,
        } = this.state;
        return <Col
            className="rightItem"
            span={24}
            key={item}
        >
            <span className="text">
                {text[index]}
            </span>
            <span className="icon">
                <Icon
                    type='close'
                    onClick={() => this.__handleCloseItem(item)}
                />
            </span>
        </Col>;
    }

    __renderTreeNodes = data => {
        return data.map(item => {
            if (item.children) {
                return <Tree.TreeNode data={item.dept} title={item.text} value={item.value} key={item.value}>
                    {this.__renderTreeNodes(item.children)}
                </Tree.TreeNode>;
            }
            return <Tree.TreeNode data={item.dept} title={item.text} value={item.value} key={item.value} />;
        });
    }
    __getStyle = () => {
        const {
            //multiple,
        } = this.props.arg;

        const multiple = _.get(this.props.arg, "multiple", true);

        const height = _.get(this.props, "height", "350px");
        const width = _.get(this.props, "width", "100%");

        return {
            content: { width: width, margin: "0px" },
            left: { height: height, overflow: "auto" },
            right: { height: height, border: "1px solid #d9d9d9", overflow: "auto" },
            tree: {
                defaultExpandParent: true, checkable: true,
                checkStrictly: !multiple
            }
        }
    }

    __getServerData = () => {
        linkRequest("FLOW_DICT_Q0002").then((data) => {
            if (data.State === 0) {
                this.__initData(data.Data);
            }
        })
    }

    //加载数据
    __initData = (serverdata) => {
        const {
            parentDeptId,
        } = this.state;

        function convert(item, alldata) {
            var children = [];
            alldata.forEach(d => {
                if (d.parentId === item.deptCode) {
                    let dChildren = convert(d, alldata);
                    if (dChildren.length > 0) {
                        children.push({ value: d.deptCode, text: d.deptName, dept: d, children: dChildren });
                    } else {
                        children.push({ value: d.deptCode, text: d.deptName, dept: d });
                    }
                }
            })
            return children;
        }

        var data = [];
        serverdata.forEach(item => {
            if (item.deptCode === parentDeptId) {
                let dChildren = convert(item, serverdata);
                if (dChildren.length > 0) {
                    item.children = dChildren;
                    data.push({ value: item.deptCode, text: item.deptName, dept: item, children: dChildren });
                }else{
                    data.push({ value: item.deptCode, text: item.deptName, dept: item });
                }
                return false;
            }
        });

        this.setState({ data, filterData: data });
    }

    // 搜索输入名字/代码
    __searchOrg = (orgname) => {

        const {
            data,
            parentDeptId,
        } = this.state;

        var expandedKeys = [];

        function getChild(children, orgname) {
            let retChild = [];
            children.forEach(c => {
                if (c.text.indexOf(orgname) >= 0 || c.value === orgname) { // 代码或者名称
                    retChild.push(_.cloneDeep(c));
                    expandedKeys.push(c.value);
                } else if (c.children && c.children.length > 0) {
                    let cChild = getChild(c.children, orgname);
                    if (cChild.length > 0) {
                        retChild.push({ value: c.value, text: c.text, children: cChild });
                        expandedKeys.push(c.value);
                    }
                }
            })

            return retChild;
        }

        let filterData = [];
        if (!_.isEmpty(orgname)) {
            filterData = getChild(data, orgname);
        } else {
            expandedKeys = [parentDeptId]
            filterData = data;
        }

        this.setState({ filterData, expandedKeys });
    }

    // 左侧选择
    __handleChange = (checkedKeys, info) => {

        const multiple = _.get(this.props.arg, "multiple", false);
        const max = _.get(this.props.arg, "options.max", null);
        var that = this;

        var valueArr = [];
        var textArr = [];
        var valueObjArr = [];

        if (!multiple) { // 单选
            if (info.checked) { // 如果是选中就设置为选择节点，否则就是空
                const {
                    value,
                    text,
                } = that.__convert(info.node.props);
                valueArr[0] = value;
                textArr[0] = text;
                valueObjArr[0] = info.node.props.data;
            }
        } else { // 多选
            let {
                value,
                text,
                valueObj,
            } = this.state;

            const {
                value: nodevalue,
                text: nodetext,
            } = that.__convert(info.node.props);

            if (!info.checked) { // 取消节点
                const index = (value || []).findIndex(v => v === nodevalue);
                if (index >= 0) {
                    valueArr = value.filter((v, i) => i !== index);
                    textArr = text.filter((v, i) => i !== index);
                    valueObj = valueObj.filter((v, i) => i !== index);
                }
            } else { // 选择节点
                valueArr = (value || []).concat([nodevalue]);
                textArr = (text || []).concat([nodetext]);
                valueObjArr = (valueObj || []).concat([info.node.props.data])
            }
            if (max&&valueArr.length > max) {
                message.warn(`最多选择${max}个部门`);
                return;
            }
        }

        const {
            expandedKeys
        } = this.state;

        if (info.checked && !info.node.isLeaf()) { // 如果是选中了某个营业部，并且该营业部不是叶子节点
            if (expandedKeys.findIndex(e => info.node.props.value === e) < 0) { // 该节点没有展开则展开
                expandedKeys.push(info.node.props.value);
            }
        }

        this.setState({ value: valueArr, text: textArr, valueObj: valueObjArr, expandedKeys }, () => {
            super.handleEvent(null, { type: "change", source: this.props.arg.field, target: this.props.arg.field }, this.props.arg.field, valueArr, textArr, valueObjArr);
        });
    }

    // 右侧删除已选
    __handleCloseItem = (removedValue) => {
        var {
            valuefield, // 总是数组
            valueObj,
            value,
            text,
        } = this.state;

        const index = value.findIndex(v => v === removedValue);
        if (index >= 0) {
            value.splice(index, 1);
            text.splice(index, 1);
            if (valueObj && valueObj.length > 0) {
                valueObj = valueObj.filter(v => v[valuefield] !== removedValue)
            }
        }
        this.setState({ value, text, valueObj: valueObj }, () => {
            super.handleEvent(null, { type: "change", source: this.props.arg.field, target: this.props.arg.field }, this.props.arg.field, value, text, valueObj);
        });
    }

    __treeExpand = (expandedKeys) => {
        this.setState({ expandedKeys });
    }

    __treeSelect = (selectedKeys, e) => {
        let {
            expandedKeys
        } = this.state;
        const index = expandedKeys.findIndex(k => k === e.node.props.value);
        if (index >= 0) {
            expandedKeys.splice(index, 1);
        } else {
            expandedKeys.splice(expandedKeys.length, 0, e.node.props.value);
        }

        let keys = _.cloneDeep(expandedKeys);

        this.setState({ expandedKeys: keys });
    }

    __convert = (obj, config) => {
        return { value: obj.value, text: obj.title };
    }
}
export default OrgSelect
