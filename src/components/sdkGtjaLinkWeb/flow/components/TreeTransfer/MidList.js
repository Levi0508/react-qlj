import React from 'react';
import {
    Card,
    Typography,
    Row,
    Col,
    Icon,
    Tooltip,
    Input,
} from 'antd';
import _ from 'lodash';
import classNames from 'classnames';

import utils from '../../../utils/utils';
import './styles.less';

class MidList extends React.Component {

    static defaultProps = {
        max: 0,
        value: [],
        dataSource: [],
        onChange: null, // (newValue) => {}
        onSearch: null, // (searchText) => {}
        disabled: false,
        searchPlaceholder: '请输入名称',

        title: '候选',
        getItemKey: (item) => _.get(item, '_id') || _.get(item, 'orgCode'),
        getItemLabel: (item) => _.get(item, 'userName') || _.get(item, 'orgName'),
        getItemTip: (item) => null,
    }

    componentDidMount() {
        // 对查询操作进行节流
        this.handleSearch = _.throttle(this.handleSearch, 800, { leading: false, trailing: true });
    }

    handleCheckAll = () => {
        const {
            max,
            value,
            dataSource,
            onChange,
            getItemKey,
        } = this.props;
        let newValue = _.uniq([...value, ...dataSource.map(getItemKey)]);
        if (max > 0) newValue = newValue.slice(0, max);   // 限制最大选择数量
        if (typeof onChange === 'function') {
            onChange(newValue);
        }
    }

    handleClickItem = (item) => {
        const {
            max,
            value,
            onChange,
            getItemKey,
        } = this.props;
        const itemKey = getItemKey(item);
        let newValue = [...value];
        if (value.indexOf(itemKey) < 0) {
            newValue.push(itemKey);
        }
        if(max > 0 && newValue.length > max) {
            newValue = newValue.slice(newValue.length - max, newValue.length);
        }
        if (typeof onChange === 'function') {
            onChange(newValue);
        }
    }

    handleSearch = (searchText) => {
        const { onSearch } = this.props;
        if (typeof onSearch === 'function') {
            onSearch(searchText);
        }
    }

    renderItem = (item) => {
        const {
            value,
            disabled,
            getItemKey,
            getItemLabel,
            getItemTip,
        } = this.props;

        const itemKey = getItemKey(item);
        if(value.indexOf(itemKey) >= 0) return null;
        const itemLabel = getItemLabel(item);
        const itemTip = getItemTip(item);

        return (
            <Col
                className={utils.getClassName('midItem', this.props)}
                style={{ cursor: disabled ? 'no-drop' : 'pointer' }}
                span={24}
                key={itemKey}
                onClick={!disabled && (() => this.handleClickItem(item))}
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
                        type='right'
                    />
                </span>
            </Col>
        );
    }

    render() {
        const {
            dataSource,
            searchPlaceholder,
            title,
        } = this.props;
        return (
            <Card
                className={utils.getClassName('card', this.props)}
                size='small'
                title={<span>{dataSource.length}条 <a onClick={this.handleCheckAll}>全选</a></span>}
                extra={<Typography.Text strong>{title}</Typography.Text>}
            >
                <Input.Search
                    onSearch={searchText => this.handleSearch(searchText)}
                    onChange={e => this.handleSearch(e.target.value)}
                    allowClear
                    placeholder={searchPlaceholder}
                />
                <Row
                    style={{ overflow: 'auto', height: '100%', marginTop: 2 }}
                >
                    {dataSource.map(this.renderItem)}
                </Row>
            </Card>
        );
    }
}

export default MidList;
