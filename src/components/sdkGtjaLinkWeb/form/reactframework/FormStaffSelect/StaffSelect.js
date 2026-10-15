import React, { Component } from 'react';

import FormBaseComponent from '../FormBaseComponent';

import { Row, Col, Tree, Icon, Input, TreeSelect, List,message } from 'antd';
import linkRequest from '../../../utils/linkRequest';
import _, { isEmpty } from 'lodash';

class StaffSelect extends FormBaseComponent {

    static defaultProps = {
        arg : "{ field: 'staff',  labelname: '人员', type: 'staff', options: {textfield: '{$userName$}({$userCode$})', valuefield: 'userCode'} }", // 控件内部属性
        width : "",         // 宽度
        heigth : "400px",   // 高度
    }

    constructor(props) {
        super(props);
        const {
            arg
        } = this.props;
        let textfield = _.get(arg, "options.textfield", "{$userName$}({$userCode$})");
        let textfieldformat = "";
        if(textfield.search(/\{\$.+\$\}/i)>=0) { // 如果textfield里面是诸如{$userName$}({$userCode$})这样的格式化字符串
            textfieldformat = textfield;
        }

        let defval = _.get(arg, "defval", null);

        // 系统的部门树
        const systemId = _.get(arg, "options.systemId", "EOA");

        let valuefield = _.get(arg, "options.valuefield", systemId === "EOA" ? "{$userCode$}|{$deptCode$}" : "userCode");
        let valuefieldformat = "";
        if(valuefield.search(/\{\$.+\$\}/i)>=0) { // valuefield{$userName$}({$userCode$})这样的格式化字符串
            valuefieldformat = valuefield;
        }

        const {
            value,
            text,
        } = this.__initDefValue(defval);

        // 指定部门
        const parentDeptId = _.get(arg, "options.dept", "-1");

        this.state = {  value, text, valueObj: null,
                        textfield, valuefield,
                        valuefieldformat, textfieldformat,
                        deptList: [],
                        staffList: null,
                        parentDeptId,
                        expandedKeys: [parentDeptId],
                        init: false,
                        systemId,
                     };
    }

    componentDidMount() {
        this.__getServerData();
        if(this.props.onRef)
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

        this.setState({value, text, valueObj});
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

        if(!value || value.length == 0) {
            return null;
        }
        return {field, value, text, valueObj};
    }

    render() {
        const {
            value,
            text,
            deptList,
            staffList,
            init,
            expandedKeys,
        } = this.state;

        const style = this.__getStyle();
        const max = _.get(this.props.arg, "options.max", null)

        return <>
                <Row style={style.content} gutter={8}>
                    <Col span={12}>
                        <Row>
                            <Col>
                                <Input
                                    allowClear
                                    placeholder="姓名/工号"
                                    onChange={e => { if(!e.target.value) this.__handleSearchStaff(e)} }
                                    onPressEnter={e => this.__handleSearchStaff(e)}
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col className="allStaff" style={style.left}>
                                {
                                    !init
                                    ?
                                    null
                                    :
                                    staffList === null
                                    ?
                                    <Tree
                                        style={style.tree}
                                        checkable
                                        expandedKeys={expandedKeys}
                                        onExpand={this.__treeExpand}
                                        onSelect={this.__treeSelect}
                                        checkStrictly={true}
                                        checkedKeys={value}
                                        onCheck={this.__handleChange}
                                        loadData={this.__handleChangeOrg}
                                    >
                                        {this.__renderDeptTreeNodes(deptList)}
                                    </Tree>
                                    :
                                    <Tree
                                        style={style.tree}
                                        checkable
                                        expandedKeys={expandedKeys}
                                        onExpand={this.__treeExpand}
                                        onSelect={this.__treeSelect}
                                        checkStrictly={true}
                                        checkedKeys={value}
                                        onCheck={this.__handleChange}
                                    >
                                        {this.__renderStaffTreeNodes(staffList)}
                                    </Tree>
                                }
                            </Col>
                        </Row>
                    </Col>
                    <Col span={12}>
                        <Row>
                            <Col><span style={{lineHeight: "32px"}}>已选择：{max ? `${value.length} / ${max}` : null}</span></Col>
                        </Row>
                        <Row>
                            <Col style={style.right}>
                                <Row className="selectedStaff">
                                {
                                    value.map(this.__renderSelectedStaff)
                                }
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                </>;
    }

    __getStyle = () => {
        const {
            //multiple,
        } = this.props.arg;

        const multiple = _.get(this.props.arg, "multiple", true);

        const height = _.get(this.props, "height", "350px");
        const width = _.get(this.props, "width", "100%");

        return {
            content: { width: width, margin: "0px"},
            left: { height: height, overflow: "auto"},
            right: { height: height, border: "1px solid #d9d9d9", overflow: "auto"},
            tree: { width: "300px" }
        }
    }

    // 初始化数据+
    __initDefValue = (curval) => {
        let value = []
        let text = [];
        let valueObj = null;
        if(_.isString(curval)) { // setValue("015225,016xxx")
            value = curval.split(',');
            text = curval.split(',');
        } else if(_.isArray(curval)) {
            if(curval.length >= 0) {
                if(_.isString(curval[0])) { // setValue(["015225,016xxx","秦xx,xxx"])
                    if(curval.length === 2) {
                        value = curval[0].split(',');
                        text = curval[1].split(',');
                    }
                } else if(_.isArray(curval[0])) { // setValue([["1101",1102"],["北京金融街, 北京知春路"]])
                    if(curval.length === 2) {
                        value = curval[0];
                        text = curval[1];
                    }
                } else if(_.isObject(curval[0])){ // setValue([{value:"", text: ""}])
                    value = curval.map(c=>c.value);
                    text = curval.map(c=>c.text);
                }
            }
        } else if(_.isObject(curval)) { // setValue({ value: [], text: [], valueObj:[])
            value = curval.value;
            text = curval.text;
            if(curval.valueObj) {
                valueObj = curval.valueObj;
            }
        }
        return { value, text, valueObj };
    }

    __renderSelectedStaff = (item, index) => {
        const {
            text,value,
        } = this.state;
        return  <Col
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

    // 部门+人员渲染
    __renderDeptTreeNodes = data => {
        return data.map(item => {
            if(item.isStaff) {
                return <TreeSelect.TreeNode checkable={true} isLeaf data={item.staff} title={item.text} value={item.value} key={item.value} />;
            } else if (item.children) {
                return <TreeSelect.TreeNode checkable={false} {...item} data={item} title={item.text} value={item.value} key={item.value}>
                            {this.__renderDeptTreeNodes(item.children)}
                        </TreeSelect.TreeNode>;
            } else {
                return <TreeSelect.TreeNode checkable={false} {...item} data={item} title={item.text} value={item.value} key={item.value} />;
            }
        });
    }

    // 人员渲染
    __renderStaffTreeNodes = data => {
        return data.map(item => {
            if (item.children) {
                return <TreeSelect.TreeNode checkable={false} data={item} title={item.text} value={item.value} key={item.value}>
                            {this.__renderStaffTreeNodes(item.children)}
                        </TreeSelect.TreeNode>;
            }
            if(item.isStaff) {
                return <TreeSelect.TreeNode checkable={true} isLeaf data={item.staff} title={item.text} value={item.value} key={item.value} />;
            } else {
                return <TreeSelect.TreeNode checkable={false} {...item} data={item} title={item.text} value={item.value} key={item.value} />;
            }
        });
    }

    // 初始化部门数据
    __getServerData = () => {
        const {
            systemId,
        } = this.state;

        linkRequest("FLOW_DICT_Q0002", { systemId }).then((data) => {
            if(data.State === 0) {
                this.__initDeptData(data.Data);
            }
        });
    }

    //加载部门数据
    __initDeptData = (serverdata) => {
        const {
            parentDeptId,
        } = this.state;

        function convert(item, alldata) {
            var children = [];
            alldata.forEach(d => {
                if(d.parentId === item.deptCode) {
                    let dChildren = convert(d, alldata);
                    if(dChildren.length > 0) {
                        children.push({value: d.deptCode, text: d.deptName, children: dChildren});
                    } else {
                        children.push({value: d.deptCode, text: d.deptName});
                    }
                }
            })
            return children;
        }

        var data = [];
        serverdata.forEach(item=> {
            if(item.deptCode === parentDeptId) {
                let dChildren = convert(item, serverdata);
                if(dChildren.length > 0) {
                    item.children = dChildren;
                    data.push({value: item.deptCode, text: item.deptName, children: dChildren});
                } else {
                    data.push({value: item.deptCode, text: item.deptName});
                }
                return false;
            }
        });

        this.setState({ init: true, deptList: data, expandedKeys: [parentDeptId] });
    }

    // 加载部门下的人员列表
    __handleChangeOrg = (treeNode) => {
        var that = this;
        const {
            systemId,
        } = this.state;
        let param = { systemId, deptCode: treeNode.props.value, pageNo: 1, pageSize: 500};
        return linkRequest("FLOW_DICT_Q0003", param).then((data) => {
            if(data.State === 0 && data.Data) {
                const staffList = data.Data.map(s=>{
                    const {
                        value,
                        text,
                    } = that.__convert(s);
                    return {value: value, text: text, staff: s, isStaff: true};
                });
                treeNode.props.data.children = treeNode.props.data.children ? staffList.concat(treeNode.props.data.children) : staffList;
                this.setState({staffList: null, deptList: [...this.state.deptList]});
            }
        });
    }

    // 搜索
    __handleSearchStaff = (e) => {
        const {
            parentDeptId,
            systemId,
        } = this.state;

        const that = this;
        const staffname = e.target.value;
        if(staffname) {
            const param = { systemId, keyword: staffname, pageNo: 1, pageSize: 500};
            linkRequest("FLOW_DICT_Q0003", param).then((data) => {
                if(data.State === 0) {
                    let staffList = [];

                    data.Data.forEach(s=>{
                        if(parentDeptId !== "-1" && s.deptCode !== parentDeptId) {
                            return true;
                        }
                        const {
                            value,
                            text,
                        } = that.__convert(s);

                        let index = staffList.findIndex(o=>o.value === s.deptCode)
                        if(index >=0) {// 整合相同部门
                            staffList[index].children.push({value: value, text: text, staff: s, isStaff: true});
                        } else {// 新建部门
                            staffList.push({value: s.deptCode, text: s.deptName, children:[{value: value, text: text, staff: s, isStaff: true}]});
                        }
                    });
                    var expandedKeys = [];
                    if(staffList !== null) {
                        expandedKeys = staffList.map(s => s.value);
                    }
                    this.setState({staffList, expandedKeys});
                }
            });
        } else {
            this.setState({staffList: null, expandedKeys: [parentDeptId]});
        }
    }

    // 左侧选中/取消选中人员
    __handleChange = (checkedKeys, info) => {

        const multiple = _.get(this.props.arg, "multiple", false);
        const max = _.get(this.props.arg, "options.max", null);
        var that = this;

        var valueArr =  [];
        var textArr =    [];
        var valueObjArr = [];

        if(!multiple) { // 单选，仅剩下和以前不一致的
            if(info.checked) { // 如果是选中就设置为选择节点，否则就是空
                const {
                    value,
                    text,
                } = that.__convert(info.node.props.data);
                valueArr[0] = value;
                textArr[0] = text;
                valueObjArr[0] = info.node.props.data;
            }
        } else {
            let {
                value,
                text,
                valueObj,
            } = this.state;

            const {
                value:nodevalue,
                text:nodetext,
            } = that.__convert(info.node.props.data);

            if(!info.checked) { // 取消节点
                const index = (value || []).findIndex(v=> v === nodevalue);
                if(index >= 0) {
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
                message.warn(`最多选择${max}个人员`);
                return;
            }
        }

        this.setState({ value: valueArr, text: textArr, valueObj: valueObjArr }, () => {
            super.handleEvent(null, { type: "change", source: this.props.arg.field, target: this.props.arg.field }, this.props.arg.field, valueArr, textArr, valueObjArr);
        });
    }

    __handleCloseItem = (removedValue) => {
        var {
            valuefield, // 总是数组
            valueObj,
            value,
            text,
        } = this.state;

        const index = value.findIndex(v => v === removedValue);
        if(index >=0) {
            value.splice(index, 1);
            text.splice(index, 1);
            if(valueObj && valueObj.length > 0) {
                valueObj = valueObj.filter(v => v[valuefield] !== removedValue)
            }
        }
        this.setState({ value, text, valueObj: valueObj }, () => {
            super.handleEvent(null, { type: "change", source: this.props.arg.field, target: this.props.arg.field }, this.props.arg.field, value, text, valueObj);
        });
    }

    __treeExpand = (expandedKeys) => {
        this.setState({expandedKeys});
    }

    __treeSelect  = (selectedKeys, e) => {
        let {
            expandedKeys
        } = this.state;
        const index = expandedKeys.findIndex(k=>k===e.node.props.value);

        if(index >= 0) {
            expandedKeys.splice(index, 1);
        } else {
            expandedKeys.splice(expandedKeys.length, 0, e.node.props.value);
        }

        let keys = _.cloneDeep(expandedKeys);

        this.setState({expandedKeys : keys});
    }

    // 将{userid:"",username:""} 根据 textfield 和 valuefield 转换为 {value: "", text: ""}
    __convert = (obj, config) => {
        const {
            valuefield,
            textfield,
            valuefieldformat,
            textfieldformat,

        } = config || this.state;

        var text = textfieldformat || "";
        if(textfieldformat) {
            textfieldformat.match(/\{\$.+?\$\}/g).forEach(f=>{
                text = text.replace(f, obj[f.replace(/\{\$|\$\}/g,"")]||"");
            })
        } else {
            text = obj[textfield];
        }

        var value = valuefieldformat || "";
        if(valuefieldformat) {
            valuefieldformat.match(/\{\$.+?\$\}/g).forEach(f=>{
                value = value.replace(f, obj[f.replace(/\{\$|\$\}/g,"")]||"");
            });
        } else {
            value = obj[valuefield];
        }

        return { value, text};
    }
}
export default StaffSelect
