/* eslint-disable no-underscore-dangle */
import React from 'react';
import {
    Card,
    Row,
    Checkbox,
    Input,
    Tree,
    Typography,
} from 'antd';
import _ from 'lodash';

import treeUtils from '../../../utils/treeUtils';
import utils from '../../../utils/utils';
import './styles.less';

class LeftTree extends React.Component {

    static defaultProps = {
        title: '可选',

        tree: [],
        list: [],

        value: [],
        onChange: null, // (newValue) => {}
        onSelect: null, // (selectedKey, selectedData) => {}
        searchFilter: null,

        disabled: false,

        getItemKey: (item) => _.get(item, '_id') || _.get(item, 'orgCode'),
        getItemLabel: (item) => _.get(item, 'userName') || _.get(item, 'orgName'),
        getChildren: (item) => _.get(item, 'children'),

        defaultExpandAll: false,
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const {
            tree,
            list,
            value = [],
            getItemKey,
            defaultExpandAll,
            defaultExpandedKeys,
        } = nextProps;
        const {
            lastTree,
            lastValue = [],
        } = prevState;

        const newState = {};

        if (!_.isEqual(value, lastValue)) {
            const checkAll = value.length === 0 ? false : list.every(item => value.indexOf(item._id) >= 0);
            // eslint-disable-next-line compat/compat
            Object.assign(newState, {
                lastValue: value,
                checkedKeys: value,
                checkAll,
                indeterminate: !checkAll && value.length > 0,
            });
        }

        if (tree !== lastTree) {
            let expandedKeys = defaultExpandedKeys || [];
            if (defaultExpandAll) {
                expandedKeys = [];
                treeUtils.forEach(tree, 'children', treeItem => expandedKeys.push(getItemKey(treeItem)));
            }
            Object.assign(newState, {
                lastTree: tree,
                expandedKeys,
            });
        }

        if (Object.keys(newState).length > 0) {
            return newState;
        }
        return null;
    }

    constructor(props) {
        super(props);
        const {
            tree = [],
            list,
            value,
            getItemKey,
            defaultExpandAll,
            defaultExpandedKeys,
        } = props;

        const checkAll = list.length && list.every(item => value.indexOf(getItemKey(item)) >= 0);
        let expandedKeys = defaultExpandedKeys || [];
        if (defaultExpandAll) {
            expandedKeys = [];
            treeUtils.forEach(tree, 'children', treeItem => expandedKeys.push(getItemKey(treeItem)));
        }
        this.state = {
            lastTree: tree,
            lastValue: value,

            checkedKeys: value,
            checkAll,
            indeterminate: !checkAll && value.length > 0,

            expandedKeys,
            autoExpandParent: true,
        };
    }

    componentDidMount() {
        // 对查询操作进行节流
        this.handleSearch = _.throttle(this.handleSearch, 800, { leading: false, trailing: true });
    }

    notifyValueChanged = (newValue) => {
        const { list, onChange, getItemKey } = this.props;
        if (typeof onChange === 'function') {
            const newData = newValue.map(v => list.find(item => getItemKey(item) === v));
            onChange(newValue, newData);
        }
    }

    handleCheckAll = () => {
        const { list } = this.props;
        const { checkAll } = this.state;

        const checkedKeys = checkAll ? [] : list.map(item => item._id);
        this.setState({
            indeterminate: false,
            checkAll: !checkAll,
            checkedKeys,
            lastValue: checkedKeys,
        });
        this.notifyValueChanged(checkedKeys);
    }

    handleSelect = (selectedKeys, e) => {
        if (!e) return;
        const { onSelect, tree, getItemKey } = this.props;
        const [selectedKey] = selectedKeys;
        const selectedData = treeUtils.find(tree, item => getItemKey(item) === selectedKey);
        if (typeof onSelect === 'function') {
            onSelect(selectedKey, selectedData);
        }
    }

    handleItemExpand = (expandedKeys, e) => {
        this.setState({ expandedKeys, autoExpandParent: false });
    }

    handleSearch = (searchText) => {
        const { list, getItemKey } = this.props;
        const { checkedKeys } = this.state;

        // 防止在搜索的情况下部门全选后，清空搜索后还是全选
        const newCheckedKeys = checkedKeys.filter(key => !!list.find(item => getItemKey(item) === key));

        const newState = {
            checkedKeys: newCheckedKeys,
            searchText,
        };
        this.setState(newState);
    }

    renderCheckAll = () => {
        const {
            list,
            max,
            getItemKey,
        } = this.props;
        const {
            checkAll,
            indeterminate,
            checkedKeys,
        } = this.state;

        // 筛选出真实计算数目的key的数量，即筛选掉组织节点
        const realCheckedKeys = checkedKeys.filter(key => list.some(item => getItemKey(item) === key));

        return (
            <Checkbox
                disabled={max === 1}
                checked={checkAll}
                indeterminate={indeterminate}
                onChange={this.handleCheckAll}
            >
                {realCheckedKeys.length}/{list.length}条
            </Checkbox>
        );
    }

    renderTreeNode = (node, searchText) => {
        const {
            disabled,
            getItemKey,
            getItemLabel,
            getChildren,
            searchFilter,
        } = this.props;

        const nodeKey = getItemKey(node);
        const nodeName = getItemLabel(node);

        const children = getChildren(node);
        if (Array.isArray(children)) {
            const isSearching = !!searchText;
            const isFiltered = isSearching && (typeof searchFilter === 'function' ? searchFilter(searchText, node) : true);
            const childrenEls = children   // 获得子节点数组
                .map((item) => this.renderTreeNode(item, isFiltered ? null : searchText))   // 如果当前节点已匹配，则子节点不进行搜索筛选
                .filter(item => !!item);    // 筛选掉空节点
            if (isSearching && !isFiltered && childrenEls.length === 0) return null; // 搜索中，当前节点没有匹配上，且子节点也没有匹配上

            return (
                <Tree.TreeNode
                    title={nodeName}
                    key={nodeKey}
                    disabled={disabled}
                    data={node}
                >
                    {childrenEls}
                </Tree.TreeNode>
            );
        }
        return null;
    }

    render() {
        const {
            title,
            tree,
            list,
            searchPlaceholder,
            onCheck,
            disabled,
            selectedKey,
            ...restProps
        } = this.props;
        const {
            expandedKeys,
            autoExpandParent,
            searchText,
        } = this.state;

        return (
            <Card
                className={utils.getClassName('card', this.props)}
                size='small'
                title={this.renderCheckAll()}
                extra={<Typography.Text strong>{title}</Typography.Text>}
            >
                <Input.Search
                    onSearch={text => this.handleSearch(text)}
                    onChange={e => this.handleSearch(e.target.value)}
                    allowClear
                    placeholder={searchPlaceholder}
                />
                <div
                    style={{ overflow: 'auto', height: '100%' }}
                >
                    <Tree
                        {...restProps}
                        checkable={false}
                        className={utils.getClassName('leftTree', this.props)}
                        selectedKeys={[selectedKey]}
                        onSelect={this.handleSelect}
                        expandedKeys={expandedKeys}
                        onExpand={this.handleItemExpand}
                        disabled={disabled}
                        autoExpandParent={autoExpandParent}
                    >
                        {tree.map((item) => this.renderTreeNode(item, searchText))}
                    </Tree>
                </div>
            </Card>
        );
    }

}

export default LeftTree;
