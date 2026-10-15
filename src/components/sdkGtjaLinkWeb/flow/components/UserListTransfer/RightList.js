import React from 'react';
import {
    Card,
    Typography,
    Row,
    Col,
    Icon,
    Tooltip,
} from 'antd';
// import QueueAnim from 'rc-queue-anim';
import classNames from 'classnames';

import utils from '../../../utils/utils';
import './styles.less';

class RightList extends React.Component {

    static defaultProps = {
        value: [],
        dataSource: [],
        onChange: null, // (newValue, newData) => {}
        disabled: false,
    }

    handleClear = () => {
        const { onChange } = this.props;
        if (typeof onChange === 'function') {
            onChange([], []);
        }
    }

    handleItemDelete = (item) => {
        const { value, dataSource, onChange } = this.props;
        const newValue = value.filter(v => item._id !== v);
        const newData = dataSource.filter(d => item._id !== d._id);
        if (typeof onChange === 'function') {
            onChange(newValue, newData);
        }
    }

    renderRightItem = (item) => {
        const {
            disabled,
        } = this.props;
        const { _id, userCode, userName, orgName, agentHandlerList } = item;
        const parsedName = `${orgName}/${userName}[${userCode}]`;
        let tooltipName = null;
        if (Array.isArray(agentHandlerList) && agentHandlerList.length > 0) {
            // 将代理人和被代理人处理成一行，格式：李**(陈**, 何** 代)。选中此行提交相当于同时选中三个人
            const tooltipAgentNames = agentHandlerList.map(item2 => `${item2.orgName||orgName}/${item2.userName}[${item2.userId}]`).join('、');
            tooltipName = `${tooltipAgentNames}代`;
        }
        return (
            <Col
                className={utils.getClassName('rightItem', this.props)}
                span={24}
                key={_id}
            >
                <span className={utils.getClassName('text', this.props)}>
                    {
                        tooltipName &&
                        <Tooltip title={tooltipName} placement='topLeft'>
                            <Icon type='info-circle' />
                        </Tooltip>
                    }
                    {parsedName}
                </span>
                <span
                    className={classNames(styles.icon, disabled && styles.iconDisabled)}
                >
                    <Icon
                        type='close'
                        onClick={!disabled && (() => this.handleItemDelete(item))}
                    />
                </span>
            </Col>
        );
    }

    render() {
        const {
            value,
            dataSource,
        } = this.props;
        return (
            <Card
                className={utils.getClassName('card', this.props)}
                size='small'
                title={<span>{value.length}条 <a onClick={this.handleClear}>清空</a></span>}
                extra={<Typography.Text strong>已选处理人</Typography.Text>}
            >
                <Row>
                    {/* <QueueAnim
                        type='left'
                        duration={200}
                        interval={0}
                        forcedReplay
                    > */}
                        {dataSource.map(this.renderRightItem)}
                    {/* </QueueAnim> */}
                </Row>
            </Card>
        );
    }
}

export default RightList;
