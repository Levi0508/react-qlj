/* eslint-disable prefer-destructuring */
/**
 * 审批进度标签的内容
 * 参考原流程的/pages/common/Schedule组件
 * @author mashaowei
 */
import React, { Component } from 'react';
import {
    Table,
} from 'antd';
import moment from 'moment';

import { withFlowContext } from '../../LinkFlowContext';
import nodeUtils from '../utils/nodeUtils';

const isValue = (value) => {
    if (value === undefined || value === '' || value === null) {
        return false;
    }
    return true;
};

const changeMomentToString = (date, dateFormat) => {
    let time = '';
    if (isValue(date)) {
        time = moment(date).format(dateFormat);
    } else {
        time = '';
    }
    return time;
};

const filter = item => item.nodeId !== '_BOF'&& item.taskFlowObject.nodeId !== '_BOF';

class ApprovalProgress extends Component {

    columns = [
        {
            title: '环节',
            dataIndex: 'taskFlowObject.nodeName',
            width: 250,
            render: (text, record) => (
                <span>
                    {
                        this.getNodeName(text, record)
                    }
                </span>
            )
        },
        {
            title: '处理人',
            dataIndex: 'taskFlowObject.handler.userName',
            width: 80,
            render: (text, record) => (
                <span>
                    {
                        this.highLightCurrentNode(text, record)
                    }
                </span>
            )
        },
        {
            title: '到达时间',
            dataIndex: 'taskFlowObject.createTime',
            width: 150,
            render: (text, record) => (
                <span>
                    {
                        this.highLightCurrentNode(changeMomentToString(text, 'YYYY-MM-DD HH:mm:ss'), record)
                    }
                </span>
            )
        },
        {
            title: '完成时间',
            dataIndex: 'taskFlowObject.handleTime',
            width: 150,
            render: (text, record) => (
                <span>
                    {
                        this.getHandlerTime(text, record)
                    }
                </span>
            )
        },
        {
            title: '提交路径',
            dataIndex: 'taskFlowObject.option',
            width: 250,
            render: (option, record) => {
                if(nodeUtils.isEndNode(record.taskFlowObject)) {
                    return null;
                }
                return (
                    <span>
                        {this.highLightCurrentNode(option || record.taskFlowObject.optionExtend, record)}
                    </span>
                );
            }
        },
        {
            title: '后续处理人',
            dataIndex: 'taskFlowObject.nextHandlers',
            render: (nextHandlers, record) => {
                const text = (Array.isArray(nextHandlers)) ?
                    nextHandlers.map(item => item.userName).join(',')
                    : '';
                return (
                    <span title={text}>
                        {
                            this.substrText(text, record)
                        }
                    </span>
                );
            }
        },
    ]

    state = {

    }

    highLightCurrentNode = (text, record) => {
        const handleTime = record.taskFlowObject.handleTime;
        if (!handleTime) {
            return <span style={{ color: 'red' }}>{text}</span>;
        }
        return <span>{text}</span>;
    }

    getNodeName = (nodeName, record) => {
        const {approvalProgressList} = this.props;
        let text = nodeName;
        const filterApprovalProgressList = (approvalProgressList || []).filter(filter);
        const index = filterApprovalProgressList.indexOf(record);
        if(nodeUtils.isEndNode(record) && index === filterApprovalProgressList.length - 1) {
            text += `（${record.read?'已读':'未读'}）`;
        }
        return this.highLightCurrentNode(text, record);
    }

    getHandlerTime = (handlerTime, record) => {
        let text = '';
        if (isValue(handlerTime) && handlerTime !== 0) {
            text = changeMomentToString(handlerTime, 'YYYY-MM-DD HH:mm:ss');
        }
        return this.highLightCurrentNode(text, record);
    }

    substrText = (str, record) => {
        let newStr = '';
        if (str && str.length > 15) {
            newStr = `${str.substr(0, 15)}......`;
        } else {
            newStr = str;
        }
        return this.highLightCurrentNode(newStr, record);
    }

    render() {
        const {
            approvalProgressList,
            loadings,
            ...restProps
        } = this.props;
        const filterApprovalProgressList = (approvalProgressList || []).filter(filter);
        return (
            <Table
                // {...restProps}
                loading={loadings['fetchApprovalProgressList']}
                columns={this.columns}
                dataSource={filterApprovalProgressList}
                pagination={false}
            />
        );
    }
};

export default (ApprovalProgress);
