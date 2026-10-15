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
 * 符合设计规范的用户穿梭框
 * 目前为纯受控模式，后续可以改造支持非受控模式
 */
class UserListTransfer extends React.Component {

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
        // value: [],
        onChange: (newValue) => { },
        max: 0,         // 选择数量上限
        disabled: false,
    }

    constructor(props) {
        super(props);
        this.state = {
            checkedKeys: props.value || [],
        };
    }

    notifyValueChanged = (newValue) => {
        const { list, onChange } = this.props;
        if (typeof onChange === 'function') {
            const newData = newValue.map(v => list.find(d => d._id === v));
            onChange(newValue, newData);
        }
    }

    handleChange = (checkedKeys, newData) => {
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
        } = this.props;
        const {
            checkedKeys,
        } = this.state;

        const rightList = list.filter(item => {
            return (value || []).some(k => k === item._id);
        });

        return (
            <Row
                type='flex'
                style={{
                    width: styleValues.width,
                    height: styleValues.height,
                    alignItems: 'center',
                }}
            >
                <Col style={{ marginRight: styleValues.spacing, width: styleValues.leftWidth }}>
                    <LeftTree
                        checkable
                        autoExpandParent
                        tree={tree}
                        list={list}
                        onChange={this.handleChange}
                        value={checkedKeys}
                        disabled={disabled}
                        max={max}
                    />
                </Col>
                <Col
                    style={{
                        width: styleValues.rightWidth,
                    }}
                >
                    <RightList
                        value={checkedKeys}
                        dataSource={rightList}
                        onChange={this.handleChange}
                        disabled={disabled}
                    />
                </Col>
            </Row>
        );
    }
}

export default UserListTransfer;
