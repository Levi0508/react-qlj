import React from 'react';
import {
    Tree,
    Checkbox,
    Input,
    Card,
    Button,
    Icon,
    Row,
    Col,
    Typography,
    message,
} from 'antd';
import _ from 'lodash';

import treeUtils from '../../../utils/treeUtils';
import LeftTree2 from './LeftTree2';
import MidList from './MidList';
import RightList from './RightList';

const styleValues = {
    width: 916,
    height: 400,
    leftWidth: 300,
    midWidth: 300,
    rightWidth: 300,
    cardHeight: 360,
    rightItemHeight: 32,
    spacing: 8,
};

/**
 * 符合设计规范的用户/部门树穿梭框
 * 目前为纯受控模式，后续可以改造支持非受控模式
 */
class TreeTransfer extends React.Component {

    static styleValues = styleValues;

    static getDerivedStateFromProps(nextProps, prevState) {
        const { value, tree, getItemKey, getChildren, autoSelectFirst } = nextProps;
        const { checkedKeys } = prevState;
        const newState = {}
        if (!_.isEqual(value, checkedKeys)) {
            newState.checkedKeys = value;
        }
        if (autoSelectFirst && !prevState.selectedKey) {
            // 自动选中第一个有子节点的父节点
            const selectedData = treeUtils.find(tree, item => {
                const itemChildren = getChildren(item);
                return Array.isArray(itemChildren) && itemChildren.some(item2 => !Array.isArray(getChildren(item2)));
            }, getChildren);
            let midList = _.get(selectedData, 'children', []);
            midList = midList.filter(item => !Array.isArray(getChildren(item)) && value.every(k => k !== getItemKey(item)));
            newState.selectedKey = getItemKey(selectedData);
            newState.selectedData = selectedData;
            newState.midList = midList;
        }
        if (Object.keys(newState).length > 0) return newState;
        return null;
    }

    static defaultProps = {
        autoSelectFirst: false, // 是否自动选中第一个有子节点的父节点

        tree: [],
        list: [],
        value: [],
        onChange: (newValue) => { },
        max: 0,         // 选择数量上限
        disabled: false,

        leftTitle: '可选处理人',
        rightTitle: '已选处理人',
        getItemKey: (item) => _.get(item, '_id') || _.get(item, 'orgCode'),
        getItemLeftLabel: (item) => _.get(item, 'userName') || _.get(item, 'orgName'),
        getItemRightLabel: (item) => _.get(item, 'userName') || _.get(item, 'orgName'),
        getItemRightTip: (item) => null,
        getChildren: (item) => _.get(item, 'children'),

        leftSearchPlaceholder: '请输入部门名称搜索',
        leftSearchFilter: (searchText, node) => true,

        midSearchPlaceholder: '请输入姓名、工号、OA账号搜索',
        midSearchFilter: (searchText, node) => true,

        leftProps: {},
        rightProps: {},
    }

    constructor(props) {
        super(props);
        this.state = {
            checkedKeys: props.value || [],
            selectedKey: null,
            selectedData: null,
            // rightList: [],
            searchTextMid: '',
            midList: [],
        };
    }

    notifyValueChanged = (newValue) => {
        const {
            list,
            onChange,
            getItemKey,
        } = this.props;
        if (typeof onChange === 'function') {
            const newData = newValue.map(v => list.find(d => getItemKey(d) === v));
            onChange(newValue, newData);
        }
    }

    handleChange = (checkedKeys) => {
        this.setState({ checkedKeys });
        this.notifyValueChanged(checkedKeys);
    }

    handleSearchMid = (searchTextMid) => {
        const { midSearchFilter, list } = this.props;
        const newState = {
            selectedKey: null,  // 取消选中
            selectedData: null,
            searchTextMid,
        };
        if (searchTextMid && typeof midSearchFilter === 'function') {
            // 搜索筛选中间列表
            newState.midList = list.filter((item) => midSearchFilter(searchTextMid, item));
        } else {
            // 清空中间列表
            newState.midList = [];
        }
        this.setState(newState);
    }

    handleSelect = (selectedKey, selectedData) => {
        const {value, getChildren, getItemKey} = this.props;
        let midList = _.get(selectedData, 'children', []);
        midList = midList.filter(item => !Array.isArray(getChildren(item)) && value.every(k => k !== getItemKey(item)));
        this.setState({
            selectedKey,
            selectedData,
            midList,
            searchTextMid: '',  // 重置中部搜索
        });
    }

    getItemLeftLabel = (item) => {
        const {
            getItemLeftLabel,
            getChildren,
        } = this.props;
        const itemChildren = (getChildren(item) || []);
        const num = itemChildren.length - itemChildren.filter(item2 => Array.isArray(getChildren(item2))).length;
        return `${getItemLeftLabel(item)}(${num})`;
    }

    render() {
        const {
            tree,
            list,
            value,
            disabled,
            max,

            leftTitle,
            rightTitle,
            getItemKey,
            getItemLeftLabel,
            getItemRightLabel,
            getItemRightTip,
            getChildren,
            leftSearchPlaceholder,
            leftSearchFilter,
            midSearchPlaceholder,
            midSearchFilter,
            leftProps,
            rightProps,
        } = this.props;
        const {
            checkedKeys,
            selectedKey,
            selectedData,
            // rightList,
            searchTextMid,
            midList,
        } = this.state;

        const rightList = list.filter(item => {
            return value.some(k => k === getItemKey(item));
        });

        let midTitle = '';
        if(searchTextMid) midTitle = `搜索：${searchTextMid}`;
        else if(selectedData) midTitle = getItemLeftLabel(selectedData);

        return (
            <Row
                type='flex'
                style={{
                    width: styleValues.width,
                    height: styleValues.height,
                    // alignItems: 'center',// 054要求选择处理人对话框取消垂直居中
                }}
            >
                <Col style={{ marginRight: styleValues.spacing, width: styleValues.leftWidth, height: '100%', overflow: 'auto' }}>
                    <LeftTree2
                        {...leftProps}
                        autoExpandParent
                        tree={tree}
                        list={list}
                        max={max}
                        onChange={this.handleChange}
                        onSelect={this.handleSelect}
                        selectedKey={selectedKey}
                        value={checkedKeys}
                        disabled={disabled}
                        title={leftTitle}
                        getItemKey={getItemKey}
                        getItemLabel={this.getItemLeftLabel}
                        getChildren={getChildren}
                        searchPlaceholder={leftSearchPlaceholder}
                        searchFilter={leftSearchFilter}
                    />
                </Col>
                <Col
                    style={{
                        marginRight: styleValues.spacing,
                        width: styleValues.midWidth,
                        height: '100%',
                        overflow: 'auto',
                    }}
                >
                    <MidList
                        {...rightProps}
                        max={max}
                        value={checkedKeys}
                        dataSource={midList}
                        onChange={this.handleChange}
                        searchText={searchTextMid}
                        onSearch={this.handleSearchMid}
                        disabled={disabled}
                        searchPlaceholder={midSearchPlaceholder}
                        title={midTitle}
                        getItemKey={getItemKey}
                        getItemLabel={getItemLeftLabel}
                        getItemTip={getItemRightTip}
                        getChildren={getChildren}
                    />
                </Col>
                <Col
                    style={{
                        width: styleValues.rightWidth,
                        height: '100%',
                        overflow: 'auto',
                    }}
                >
                    <RightList
                        {...rightProps}
                        value={checkedKeys}
                        dataSource={rightList}
                        onChange={this.handleChange}
                        disabled={disabled}
                        title={rightTitle}
                        getItemKey={getItemKey}
                        getItemLabel={getItemRightLabel}
                        getItemTip={getItemRightTip}
                    />
                </Col>
            </Row>
        );
    }
}

export default TreeTransfer;
