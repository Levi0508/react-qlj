import React from 'react';
import _ from 'lodash';
import {
    Row,
    Col,
    Typography,
} from 'antd';

// import UserListTransfer from '../UserListTransfer';
import TreeTransfer from '../TreeTransfer/TreeTransfer';
import TreeTransfer2 from '../TreeTransfer/TreeTransfer2';
import GroupTitle from '../Typography/GroupTitle';
import { withFlowContext } from '../../LinkFlowContext';

const chooseTypeDict = {
    0: '单选',
    1: '多选',
    2: '全选',
};

class ItemNodeHandlerSelect extends React.Component {

    static defaultProps = {
        nodeCode: '',

        useNewTransfer: false,

        defaultExpandAll: true,
        defaultExpandedKeys: [],
    }

    // componentDidMount() {
    //     const { nodeCode } = this.props;
    //     this.fetchHandlerList(nodeCode);
    // }    放在HandlerSelectModal中统一请求

    // componentWillReceiveProps(nextProps) {
    //     const { nodeCode: oldNodeCode } = this.props;
    //     const { nodeCode } = nextProps;
    //     if (oldNodeCode !== nodeCode) {
    //         this.fetchHandlerList(nodeCode);
    //     }
    // }

    getNodeName = () => {
        const {
            nodeCode,
            selectedPaths,
        } = this.props;
        const path = selectedPaths.find(item => item.endNodeCode === nodeCode);
        return path.endNodeName || path.endNodeCode;
    }

    // fetchHandlerList = (nodeCode) => {
    //     const {
    //         dispatch,
    //     } = this.props;
    //     dispatch({
    //         type: 'fetchNodeHandlerList',
    //         payload: nodeCode,
    //     });
    // }

    searchFilterOfUser = (searchText, node) => {
        const { userName, userCode, userOaCode } = node;
        if ((userName || '').indexOf(searchText) >= 0
            || (userCode || '').indexOf(searchText) >= 0
            || (userOaCode || '').indexOf(searchText) >= 0) {
            return true;
        }
        return false;
    }

    searchFilterOfDept = (searchText, node) => {
        const { deptName, deptId } = node;
        return (deptName || '').indexOf(searchText) >= 0 || (deptId || '').indexOf(searchText) >= 0;
    }

    handleHandlerChanged = (selectedHandlerIds, selectedHandlers) => {
        const {
            nodeCode,
            dispatch,
            selectedNodesHandlerIds,
            selectedNodesHandlers,
        } = this.props;
        dispatch({
            type: 'save',
            payload: {
                selectedNodesHandlerIds: {
                    ...selectedNodesHandlerIds,
                    [nodeCode]: selectedHandlerIds,
                },
                selectedNodesHandlers: {
                    ...selectedNodesHandlers,
                    [nodeCode]: selectedHandlers,
                },
            },
        });
    }

    handleExpand = (expandedKeys) => {
        this.setState({ expandedKeys });
    }

    getLeftTreeProps = () => {
        const {
            defaultExpandAll,
            defaultExpandedKeys,
        } = this.props;
        return {defaultExpandAll, defaultExpandedKeys};
        // if (Array.isArray(defaultExpandedKeys) && defaultExpandedKeys.length > 0) {
        //     return { defaultExpandedKeys };
        // }
        // return { defaultExpandAll: !useNewTransfer };
    }

    render() {
        const {
            nodeCode,
            nodesHandlers,
            nodesHandlerTree,
            selectedNodesHandlerIds,
            selectedPaths,
            nodeChooseTypes,
            useNewTransfer,
        } = this.props;
        const handlers = _.get(nodesHandlers, nodeCode) || [];
        const handlerTree = _.get(nodesHandlerTree, nodeCode) || [];
        const selectedHandlerIds = _.get(selectedNodesHandlerIds, nodeCode) || [];
        const chooseType = nodeChooseTypes[nodeCode];   // 0-单选 1-多选
        // 全选模式，直接展示所有候选人
        const disabled = chooseType === 2

        const TransferComponent = useNewTransfer ? TreeTransfer2 : TreeTransfer;

        return (
            <>
                <GroupTitle style={{ marginBottom: 8, marginTop: 16 }}>
                    <Row type='flex' justify='space-between'>
                        <Col>环节：<Typography.Text strong>{this.getNodeName()}</Typography.Text></Col>
                        <Col style={{ width: 300 }}>处理人选择：<Typography.Text strong>{chooseTypeDict[chooseType] || chooseType}</Typography.Text></Col>
                    </Row>
                </GroupTitle>
                <TransferComponent
                    tree={handlerTree}
                    list={handlers}
                    value={selectedHandlerIds}
                    onChange={this.handleHandlerChanged}
                    max={chooseType === 0 ? 1 : 0}  // 单选时max=1,多选时max=0
                    disabled={disabled}
                    leftTitle={'可选处理人'}
                    rightTitle={'已选处理人'}
                    getItemKey={(item) => _.get(item, '_id') || _.get(item, 'orgCode')}
                    getItemLeftLabel={(item) => {
                        let parsedName;
                        const { orgName, userName, userCode, agentHandlerList } = item;
                        if (userName) {
                            if (Array.isArray(agentHandlerList) && agentHandlerList.length > 0) {
                                // 将代理人和被代理人处理成一行，格式：李**(陈**, 何** 代)。选中此行提交相当于同时选中三个人
                                const agentNames = agentHandlerList.map(item2 => `${item2.userName}[${item2.userCode}]`).join('、');
                                parsedName = `${userName}[${userCode}]（${agentNames}代）`;
                            } else {
                                // 正常显示人名
                                parsedName = `${userName}[${userCode}]`;
                            }
                        } else {
                            parsedName = orgName;
                        }
                        return parsedName;
                    }}
                    getItemRightLabel={(item => {
                        const { userCode, userName, orgName } = item;
                        const parsedName = `${orgName}/${userName}[${userCode}]`;
                        return <span title={parsedName}>{parsedName}</span>;
                    })}
                    getItemRightTip={(item) => {
                        let tooltipName = null;
                        const { orgName, agentHandlerList } = item;
                        if (Array.isArray(agentHandlerList) && agentHandlerList.length > 0) {
                            // 将代理人和被代理人处理成一行，格式：李**(陈**, 何** 代)。选中此行提交相当于同时选中三个人
                            const tooltipAgentNames = agentHandlerList.map(item2 => `${item2.orgName || orgName}/${item2.userName}[${item2.userCode}]`).join('、');
                            tooltipName = `${tooltipAgentNames}代`;
                        }
                        return tooltipName;
                    }}
                    getChildren={(item) => _.get(item, 'children')}
                    searchPlaceholder={'输入姓名、工号、OA账号搜索'}
                    searchFilter={this.searchFilterOfUser}
                    leftSearchPlaceholder={'输入部门名称、代码搜索'}
                    leftSearchFilter={this.searchFilterOfDept}
                    midSearchPlaceholder={'输入姓名、工号、OA账号搜索'}
                    midSearchFilter={this.searchFilterOfUser}
                    leftProps={this.getLeftTreeProps()}
                />
            </>
        );
    }
}

export default withFlowContext(ItemNodeHandlerSelect, [
    'nodesHandlers',
    'nodesHandlerTree',
    'selectedNodesHandlerIds',
    'selectedNodesHandlers',
    'selectedPaths',
    'nodeChooseTypes',
]);
