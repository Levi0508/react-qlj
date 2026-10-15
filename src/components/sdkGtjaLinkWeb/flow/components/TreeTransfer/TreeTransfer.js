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

import LeftTree from './LeftTree';
import RightList from './RightList';

const styleValues = {
    width: 728,
    height: 400,
    leftWidth: 420,
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
        const {value} = nextProps;
        const {checkedKeys} = prevState;
        if(!_.isEqual(value, checkedKeys)) {
            return {
                checkedKeys: value,
            };
        }
        return null;
    }

    static defaultProps = {
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

        searchPlaceholder: '',
        searchFilter: (searchText, node) => true,

        leftProps: {},
        rightProps: {},
    }

    constructor(props) {
        super(props);
        this.state = {
            checkedKeys: props.value || [],
            // rightList: [],
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
        this.setState({checkedKeys});
        this.notifyValueChanged(checkedKeys);
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
            searchPlaceholder,
            searchFilter,
            leftProps,
            rightProps,
        } = this.props;
        const {
            checkedKeys,
            // rightList,
        } = this.state;

        const rightList = list.filter(item => {
            return value.some(k => k === getItemKey(item));
        });

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
                    <LeftTree
                        {...leftProps}
                        checkable
                        autoExpandParent
                        tree={tree}
                        list={list}
                        onChange={this.handleChange}
                        value={checkedKeys}
                        disabled={disabled}
                        max={max}
                        title={leftTitle}
                        getItemKey={getItemKey}
                        getItemLabel={getItemLeftLabel}
                        getChildren={getChildren}
                        searchPlaceholder={searchPlaceholder}
                        searchFilter={searchFilter}
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
