import React from 'react';
import _ from 'lodash';
import {
    Popover,
    Icon,
} from 'antd';

import BusinessCard from '../../../components/BusinessCard';
import { withFlowContext } from '../../LinkFlowContext';

import businessCard from '../../../assets/flow/businessCard.png';

const flowStatusMap = {
    '1': '起草',
    '2': '进行中',
    '3': '正常结束',
    '4': '终止',
    '5': '挂起',
    '6': '作废',
};

class HandlerInfo extends React.Component {

    static defaultProps = {
        collapseNum: 10,
    }

    state = {

    }

    renderNodeAndUser = (nodeAndUser, showNodeName = false) => {
        if (!nodeAndUser) return null;
        const { nodeName, userName, userId, isCurrent } = nodeAndUser;
        return (
            <span style={{ fontWeight: isCurrent ? 'bold' : 'inherit' }}>
                {showNodeName && <img src={businessCard} style={{ marginRight: 8 }} />}
                {showNodeName && nodeName && `${nodeName} - `}
                <BusinessCard emp_no={userId}>
                    <a>{userName || userId}</a>
                </BusinessCard>
            </span>
        );
    }

    renderUsers = (users, collapse) => {
        if (collapse) {
            const { collapseNum } = this.props;
            users = users.slice(0, collapseNum);
        }
        return users.map((user, i) => <span key={user.userId}>{i !== 0 && '、'}{this.renderNodeAndUser(user, i === 0)}</span>);
    }

    renderFlowStatus = () => {
        const {
            instFlowBase,
            ...restProps
        } = this.props;
        const statusText = instFlowBase ? flowStatusMap[instFlowBase.flowStatus] : null;
        if (!statusText) return <div {...restProps} />;
        return (
            <div {..._.pick(restProps, ['style', 'className'])}>
                流程状态：{statusText}
            </div>
        );
    }

    render() {
        const {
            tiid,
            instFlowTodoPersonList,
            dispatch,
            collapseNum,
            ...restProps
        } = this.props;

        const nodeCodes = [];
        const userAndNodes = instFlowTodoPersonList
            .filter(item => ['0', '1', '2'].indexOf(item.personType) >= 0)    // 只显示起草、待办、已办，不显示待阅
            .sort((a, b) => {
                if (a.tiid === tiid) return -1;
                return 1;
            })
            .reduce((r, n) => {
                const {nodeCode} = n;
                if(nodeCodes.indexOf(nodeCode) < 0) nodeCodes.push(nodeCode);
                n.isCurrent = n.tiid === tiid;
                if (!r[nodeCode]) r[nodeCode] = [n];
                else r[nodeCode].push(n);
                return r;
            }, {});

        const fistNodeNode = nodeCodes[0];
        const first = nodeCodes.length > 0 ? userAndNodes[fistNodeNode] : null;

        // 没有处理人时，显示流程状态
        if (!first) return this.renderFlowStatus();

        return (
            <div {..._.pick(restProps, ['style', 'className'])}>
                {this.renderUsers(first, true)}
                {
                    nodeCodes.length > 1 || first.length > collapseNum ?
                        <>
                            <span>...</span>
                            <Popover
                                trigger='click'
                                placement='bottom'
                                content={
                                    nodeCodes.map(nodeCode => {
                                        const users = userAndNodes[nodeCode];
                                        return <div>{this.renderUsers(users, false)}</div>;
                                    })
                                }
                            >
                                <a style={{ marginLeft: 8, fontSize: 10, padding: 8 }}>查看全部<Icon type='down' /></a>
                            </Popover>
                        </>
                        : null
                }
            </div>
        );
    }
}

export default withFlowContext(HandlerInfo, [
    'tiid',
    'instFlowBase',
    'instFlowTodoPersonList',
]);
