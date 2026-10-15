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
        tree: [],
        list: [],

        max: 0,

        value: [],
        onChange: null, // (newValue) => {}

        disabled: false,
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const {
            tree,
            list,
            value = [],
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
            const expandedKeys = [];
            treeUtils.forEach(tree, 'children', org => expandedKeys.push(org.orgCode));
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
        } = props;

        const checkAll = list.every(item => value.indexOf(item._id) >= 0);
        const expandedKeys = [];
        treeUtils.forEach(tree, 'children', org => expandedKeys.push(org.orgCode));
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
        // 对查询操作进行节流，
        this.handleSearch = _.throttle(this.handleSearch, 800, { leading: false, trailing: true });
    }

    notifyValueChanged = (newValue) => {
        const { list, onChange } = this.props;
        if (typeof onChange === 'function') {
            const newData = newValue.map(v => list.find(d => d._id === v));
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
        const { list, max, value } = this.props;
        const { checkedKeys: alreadyCheckedKeys } = this.state;
        const { checked } = e;

        // 在搜索的情况下，checkedKeys不会记录搜索前已被勾选的key，这里需要与已勾选的key进行合并并去重
        let newCheckedKeys = _.uniq([...checkedKeys, ...alreadyCheckedKeys]).filter(key => !!list.find(item => item._id === key));
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

        if (max === 1) {
            // 单选模式下，只记录最新勾选的节点
            newCheckedKeys = newCheckedKeys.filter(k => value.every(kk => kk !== k)).splice(0, 1);
        }

        // 筛选出真实计算数目的key的数量，即筛选掉组织节点
        const realCheckedKeys = newCheckedKeys.filter(key => list.some(item => item._id === key));

        this.setState({
            indeterminate: !!newCheckedKeys.length && newCheckedKeys.length < list.length,
            checkAll: newCheckedKeys.length === list.length,
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
        const { list } = this.props;
        const { checkedKeys } = this.state;

        // 防止在搜索的情况下部门全选后，清空搜索后还是全选
        const newCheckedKeys = checkedKeys.filter(key => !!list.find(item => item._id === key));

        const newState = {
            checkedKeys: newCheckedKeys,
            searchText,
        };
        this.setState(newState);
    }

    renderCheckAll = () => {
        const {
            list,
        } = this.props;
        const {
            checkAll,
            indeterminate,
            checkedKeys,
        } = this.state;

        // 筛选出真实计算数目的key的数量，即筛选掉组织节点
        const realCheckedKeys = checkedKeys.filter(key => list.some(item => item._id === key));

        return (
            <span>
                <a onClick={this.handleCheckAll} style={{ marginRight: 4 }}>{checkAll ? '清空' : '全选'}</a>
                {realCheckedKeys.length}/{list.length}条
            </span>
            // <Checkbox
            //     checked={checkAll}
            //     indeterminate={indeterminate}
            //     onChange={this.handleCheckAll}
            // >

            // </Checkbox>
        );
    }

    renderName = (node) => {
        // 获取node的展示字符串
        let parsedName;
        const { orgName, userName, userCode, agentHandlerList } = node;
        if (userName) {
            if (Array.isArray(agentHandlerList) && agentHandlerList.length > 0) {
                // 将代理人和被代理人处理成一行，格式：李**(陈**, 何** 代)。选中此行提交相当于同时选中三个人
                const agentNames = agentHandlerList.map(item => `${item.userName}[${item.userId}]`).join('、');
                parsedName = `${userName}[${userCode}]（${agentNames}代）`;
            } else {
                // 正常显示人名
                parsedName = `${userName}[${userCode}]`;
            }
        } else {
            parsedName = orgName;
        }
        return parsedName;
    }

    renderTreeNode = (node) => {
        const { max, disabled } = this.props;
        const { searchText } = this.state;

        const disableParentNode = max === 1;    // max为1时，禁用所有父节点

        // 节点名称
        const nodeName = this.renderName(node);

        const { children } = node;
        if (children) {
            // 渲染组织节点
            const { orgCode } = node;
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
                    key={orgCode}
                    disabled={disabled || disableParentNode}
                    data={node}
                >
                    {childrenEls}
                </Tree.TreeNode>
            );
        }

        // 渲染人员节点
        const { _id, userCode, userOaCode } = node;
        if (nodeName && searchText && searchText.length > 0) {
            // 根据员工名称、工号、OA账号进行筛选
            if (nodeName.indexOf(searchText) < 0 && (userCode || '').indexOf(searchText) < 0 && (userOaCode || '').indexOf(searchText) < 0) {
                return null;
            }
        }
        return <Tree.TreeNode title={nodeName} key={_id} data={node} />;
    }

    render() {
        const {
            tree,
            list,
            childrenKey,
            groupIdKey,
            renderGroupId,
            groupNameKey,
            renderGroupName,

            onCheck,
            disabled,
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
                extra={<Typography.Text strong>可选处理人</Typography.Text>}
            >
                <Input.Search
                    onSearch={searchText => this.handleSearch(searchText)}
                    onChange={e => this.handleSearch(e.target.value)}
                    allowClear
                    placeholder='输入姓名、工号、OA账号后，按回车搜索'
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
