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

        max: 0,

        value: [],
        onChange: null, // (newValue) => {}

        disabled: false,

        getItemKey: (item) => _.get(item, '_id') || _.get(item, 'orgCode'),
        getItemLabel: (item) => _.get(item, 'userName') || _.get(item, 'orgName'),
        getChildren: (item) => _.get(item, 'children'),

        searchPlaceholder: '',
        searchFilter: (searchText, node) => true,

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

            searchText: '',
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

    handleCheck = (checkedKeys, e) => {
        const { list, max, value, getItemKey, checkStrictly } = this.props;

        if (checkStrictly) {
            checkedKeys = _.get(checkedKeys, 'checked') || checkedKeys;
            this.setState({
                indeterminate: !!checkedKeys.length && checkedKeys.length < list.length,
                checkAll: !!checkedKeys.length && checkedKeys.length === list.length,
                checkedKeys,
                lastValue: checkedKeys,
            });
            this.notifyValueChanged(checkedKeys || []);
            return;
        }
        const { checkedKeys: alreadyCheckedKeys } = this.state;
        const { checked } = e;

        // 在搜索的情况下，checkedKeys不会记录搜索前已被勾选的key，这里需要与已勾选的key进行合并并去重
        let newCheckedKeys = _.uniq([...checkedKeys, ...alreadyCheckedKeys])
            .filter(key => !!list.find(item => getItemKey(item) === key));  // 可以把find改为some，懒得重新测试验证了
        if (!checked) {
            // 反选时，把勾选的key排除
            const checkedNodeData = _.get(e, 'node.props.data');
            if (checkedNodeData) {
                if (Array.isArray(checkedNodeData.children)) {
                    // 勾选的节点是部门
                    // 遍历获取多层部门下的部门和人员的_id
                    function getDeepChildrenKeys(children) {
                        const keys = children.map(item => item._id);
                        for (let i = 0; i < children.length; i += 1) {
                            const child = children[i];
                            if(Array.isArray(child.children)) {
                                keys.push(...getDeepChildrenKeys(child.children));
                            }
                        }
                        return keys;
                    }
                    const childrenKeys = getDeepChildrenKeys(checkedNodeData.children);
                    // 将遍历获得的部门和人员反选
                    newCheckedKeys = newCheckedKeys.filter(key => childrenKeys.every(childrenKey => childrenKey !== key));
                } else {
                    // 勾选的节点是人员
                    // 执行人员反选
                    const deleteIndex = newCheckedKeys.findIndex(key => checkedNodeData._id === key);
                    if (deleteIndex >= 0) {
                        newCheckedKeys.splice(deleteIndex, 1);
                    }
                }
            }
        }

        if (max > 0) {
            // 单选模式下，只记录最新勾选的节点
            newCheckedKeys = newCheckedKeys.filter(k => value.every(kk => kk !== k)).splice(0, max);
            // newCheckedKeys = newCheckedKeys.slice(0, max);
        }

        // 筛选出真实计算数目的key的数量，即筛选掉组织节点
        const realCheckedKeys = newCheckedKeys.filter(key => list.some(item => getItemKey(item) === key));

        this.setState({
            indeterminate: !!newCheckedKeys.length && newCheckedKeys.length < list.length,
            checkAll: !!newCheckedKeys.length && newCheckedKeys.length === list.length,
            checkedKeys: newCheckedKeys,
            lastValue: realCheckedKeys,
        });
        this.notifyValueChanged(realCheckedKeys);
    }

    handleSelect = (selectedKeys, e) => {
        if (!e) return;
        const { node, nativeEvent } = e;
        if (node && nativeEvent) {
            // 触发node的onCheck方法，达到保持select和check同步
            node.onCheck(nativeEvent);
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

    renderTreeNode = (node) => {
        const {
            max,
            disabled,
            getItemKey,
            getItemLabel,
            getChildren,
            searchFilter,
        } = this.props;
        const { searchText } = this.state;

        const nodeKey = getItemKey(node);
        const nodeName = getItemLabel(node);

        const children = getChildren(node)
        if (Array.isArray(children)) {
            // 渲染组织节点
            const childrenEls = children.map(this.renderTreeNode);
            // 判断其子节点是否全部隐藏
            const isAllChildrenHided = children.length === 0 || childrenEls.every(childNode => !childNode);
            if (isAllChildrenHided) {
                // 若子节点全部隐藏，则当前节点也隐藏
                return null;
            }
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

        // 筛选搜索
        if (searchText && typeof searchFilter === 'function' && !searchFilter(searchText, node)) {
            return null;
        }

        return <Tree.TreeNode title={nodeName} key={nodeKey} data={node} />;
    }

    render() {
        const {
            title,
            tree,
            list,
            max,
            onCheck,
            disabled,

            searchPlaceholder,
            ...restProps
        } = this.props;
        const {
            checkedKeys,
            expandedKeys,
            autoExpandParent,
        } = this.state;

        return (
            <Card
                className={utils.getClassName('card', this.props)}
                size='small'
                title={this.renderCheckAll()}
                extra={<Typography.Text strong>{title}</Typography.Text>}
            >
                <Input.Search
                    onSearch={searchText => this.handleSearch(searchText)}
                    onChange={e => this.handleSearch(e.target.value)}
                    allowClear
                    placeholder={searchPlaceholder}
                />
                <div
                    style={{ overflow: 'auto', height: '100%' }}
                >
                    <Tree
                        {...restProps}
                        className={utils.getClassName('leftTree', this.props)}
                        checkedKeys={checkedKeys}
                        onCheck={this.handleCheck}
                        selectedKeys={[]}
                        onSelect={this.handleSelect}
                        expandedKeys={expandedKeys}
                        onExpand={this.handleItemExpand}
                        disabled={disabled}
                        autoExpandParent={autoExpandParent}
                    >
                        {tree.map(this.renderTreeNode)}
                    </Tree>
                </div>
            </Card>
        );
    }

}

export default LeftTree;
