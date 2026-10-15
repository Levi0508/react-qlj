/**
 * 流程底部
 * 包括关闭、提交、保存、废弃、流程图、错误报告等
 * @author mashaowei
 */
import React, { Component } from 'react';
import {
    Affix,
    Row,
    Col,
    Button,
    Modal,
    Icon,
    message,
} from 'antd';

import { withFlowContext } from '../../LinkFlowContext';

import IconButton from './IconButton';

class Bottom extends Component {

    static defaultProps = {
    }

    state = {
    }

    render() {
        const {
            operators,
        } = this.props;

        if (!Array.isArray(operators) || operators.length === 0) return null;

        const colProps = {
            marginLeft: 8,
            marginRight: 8,
            width: 60,
        };

        return (
            <div style={{
                backgroundColor: 'white',
                position: 'fixed',
                bottom: 0,
                height: 80,
                width: '100%',
                overflowX: 'overlay',
                display: 'flex',
                zIndex: 10,
            }}>
                <div style={{
                    flexShrink: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'row',
                    margin: 'auto',
                }}>
                    {
                        operators.map(operator => (
                            <div key={operator} style={colProps}>
                                {
                                    <IconButton operator={operator} />
                                }
                            </div>
                        ))
                    }
                </div>
            </div>
        );
    }
};

export default withFlowContext(Bottom, [
    'loadings',
    'operators',
]);
