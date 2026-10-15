import React from 'react';
import {
    Card,
    Typography,
    Row,
    Col,
    Icon,
    Tooltip,
} from 'antd';
import _ from 'lodash';
import classNames from 'classnames';

import utils from '../../../utils/utils';
import './styles.less';

class RightList extends React.Component {

    static defaultProps = {
        value: [],
        dataSource: [],
        onChange: null, // (newValue, newData) => {}
        disabled: false,

        title: '已选',
        getItemKey: (item) => _.get(item, '_id') || _.get(item, 'orgCode'),
        getItemLabel: (item) => _.get(item, 'userName') || _.get(item, 'orgName'),
        getItemTip: (item) => null,
    }

    handleClear = () => {
        const { onChange } = this.props;
        if (typeof onChange === 'function') {
            onChange([], []);
        }
    }

    handleItemDelete = (item) => {
        const {
            value,
            dataSource,
            onChange,
            getItemKey,
        } = this.props;
        const newValue = value.filter(v => getItemKey(item) !== v);
        const newData = dataSource.filter(d => getItemKey(item) !== getItemKey(d));
        if (typeof onChange === 'function') {
            onChange(newValue, newData);
        }
    }

    renderRightItem = (item) => {
        const {
            disabled,
            getItemKey,
            getItemLabel,
            getItemTip,
        } = this.props;
        const itemKey = getItemKey(item);
        const itemLabel = getItemLabel(item);
        const itemTip = getItemTip(item);

        return (
            <Col
                className={utils.getClassName('rightItem', this.props)}
                span={24}
                key={itemKey}
            >
                <span className={utils.getClassName('text', this.props)}>
                    {
                        itemTip &&
                        <Tooltip title={itemTip} placement='topLeft'>
                            <Icon type='info-circle' />
                        </Tooltip>
                    }
                    {itemLabel}
                </span>
                <span
                    className={classNames(utils.getClassName('icon', this.props), disabled && utils.getClassName('iconDisabled', this.props))}
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

            title,
        } = this.props;
        return (
            <Card
                className={utils.getClassName('card', this.props)}
                size='small'
                title={<span>{value.length}条 <a onClick={this.handleClear}>清空</a></span>}
                extra={<Typography.Text strong>{title}</Typography.Text>}
            >
                <Row>
                    {dataSource.map(this.renderRightItem)}
                </Row>
            </Card>
        );
    }
}

export default RightList;
