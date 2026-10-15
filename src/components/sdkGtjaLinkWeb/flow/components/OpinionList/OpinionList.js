import React from 'react';
import {
    Card,
    Row,
    Col,
    Typography,
    Divider,
    Descriptions,
} from 'antd';
import moment from 'moment';
import classnames from 'classnames';

import BusinessCard from '../../../components/BusinessCard';
import { withFlowContext } from '../../LinkFlowContext';
import nodeUtils from '../utils/nodeUtils';
import utils from '../../../utils/utils';
import './styles.less'

import QueryForm from '../../../form/reactframework/QueryForm';

class OpinionList extends React.Component {

    static defaultProps = {
        bordered: true, // 是否展示边框
        collapseCount: 10,  // 默认的折叠后显示意见域数量
    }

    state = {
        // expandAll: false,
        o2Expanded: {},
        refs:[],
    }

    renderO3 = (o3, i, arr) => {
        const {
            id,
            name,
            time,
            decision,
            content,
            opnSource,
            isCurrent,
        } = o3;
        const isFirst = i === 0;
        const formattedTime = time ? moment(time).format('YYYY-MM-DD HH:mm:ss') : '';
        const parsedDecision = (decision && decision.indexOf('。') === decision.length - 1) ? decision : (decision + '。');
        const parsedContent = (parsedDecision && content && content.indexOf(parsedDecision) === 0) ? content.replace(parsedDecision, '') : content;  // 尝试将意见详情字符串中的结论性意见移除
        const isAuto = opnSource - 1 === 0;   // 是否为限时自动办结
        const textStyle = isAuto ? { color: '#1890ff' } : {};

        return (
            <div
                key={`${id}${time}`}
            >
                {!isFirst && <Divider style={{ margin: '8px 0' }} />}
                {/* <div className={isCurrent ? styles.currentOpinion : null}> */}
                <div>
                    <Row type='flex'>
                        <Col style={{ flex: 1 }}>
                            {
                                decision &&
                                <>
                                    {/* <Typography.Text strong> 10-20 结论性意见不加粗 */}
                                    {/* <Typography.Text style={textStyle}> 10-28 晚上又讨论加粗 */}
                                    <Typography.Text strong>
                                        {parsedDecision}
                                    </Typography.Text>
                                    <br />
                                </>
                            }
                            {
                                parsedContent &&
                                <Typography.Text style={{ whiteSpace: 'pre-wrap', ...textStyle }}>
                                    {parsedContent}
                                </Typography.Text>
                            }
                        </Col>
                    </Row>
                    <Row type='flex' justify='space-between'>
                        <Col />
                        <Col>
                            <BusinessCard emp_no={id}>
                                <Typography.Text><a>{name}</a></Typography.Text>
                            </BusinessCard>
                            <Typography.Text style={{ marginLeft: 16 }}>{formattedTime}</Typography.Text>
                        </Col>
                    </Row>
                </div>
            </div>
        );
    }

    renderO2 = (o2, i) => {
        const { id, name, isCurrent, children } = o2;
        const style = {
            background: '#FFFFFF',
            boxShadow: '0 4px 10px 4px rgba(96,131,174,0.20)',
            borderRadius: 10,
        };
        if (i !== 0) style.marginTop = 8;
        return (
            <Card
                key={id}
                size='small'
                title={<Typography.Text strong>{name}</Typography.Text>}
                style={style}
            >
                {
                    children.length ?
                        children.map(this.renderO3)
                        : ''
                }
            </Card>
        );
    }

    renderOpinionList2 = (o1) => {
        const { id, children } = o1;
        if (!children.length) return '';
        const { collapseCount } = this.props;
        const { o2Expanded } = this.state;
        const expanded = o2Expanded[id];
        if (!expanded && children.length > collapseCount) {
            const filteredList = children.slice(0, collapseCount);
            const onClick = () => {
                this.setState({
                    o2Expanded: {
                        ...o2Expanded,
                        [id]: true,
                    },
                });
            };
            return (
                <>
                    {filteredList.map(this.renderO2)}
                    <Divider style={{ margin: 0, marginTop: 8 }}>
                        <a onClick={onClick}>展开剩余{children.length - collapseCount}个部门意见</a>
                    </Divider>
                </>
            );
        }
        return children.map(this.renderO2);
    }

    changeForm = (event, field, value, text, object, arg) => {
        const {
            formRef,
        } = this.props;
        if(formRef && formRef.current && formRef.current.state && formRef.current.state.fields && formRef.current.state.fields.length > 0) {
            formRef.current.call("setValue", {[field]: value});
        }
    }

    _onRef = (ref, field) => {
        this.state.refs[field] = ref;
    }

    renderForm = (formelId) => {
        const {
            formRef,
            formValue,
        } = this.props;
        if(formRef && formRef.current && formRef.current.state && formRef.current.state.fields) {
            const formControl = formRef.current.state.fields.find(f=>f.field === formelId);
            if(!formControl) return null;
            _.forEach(QueryForm.components, (component, key) => {
                if (key == formControl.type) {
                    formControl.control = component;
                }
            });

            if(formControl.control) {
                const controlProps = {
                    arg: formControl,
                    edit: _.get(formControl, "edit", true),
                    onRef: this._onRef,
                    handleEvent: this.changeForm,
                };
                if(formValue) {
                    const value = formValue[formelId];
                    if(value) {
                        controlProps.arg.defval = value;
                    }
                }

                return <formControl.control {...controlProps} />
            }
        }
        return null;
    }

    renderO1 = (o1, i) => {
        const { bordered, opinionConfig } = this.props;
        const { id, name, children } = o1;
        const isFirst = i === 0;
        const { opinionDefs } = opinionConfig;
        const config = opinionDefs && opinionDefs.find(def => def.id === o1.id);
        if (bordered) {
            return (
                <Descriptions.Item key={id} label={name}>
                    {config && config.formelId && this.renderForm(config.formelId)}
                    {this.renderOpinionList2(o1)}
                </Descriptions.Item>
            );
        }
        return (
            <Row key={id} style={{ marginTop: isFirst ? 0 : 24 }} gutter={8}>
                <Col span={4} style={{ textAlign: 'right' }}>
                    {name}：
                </Col>
                <Col span={16}>
                    {this.renderOpinionList2(o1)}
                </Col>
            </Row>
        );
    }

    renderOpinionList1 = () => {
        const { opinionList, collapseCount } = this.props;
        // const { expandAll } = this.state;
        // if (opinionList.length > collapseCount && !expandAll) {
        //     const filteredOpinionList = opinionList.slice(0, collapseCount);
        //     return (
        //         <>
        //             {filteredOpinionList.map(this.renderO1)}
        //             <Divider style={{ margin: 0, marginTop: 8 }}>
        //                 <a onClick={() => this.setState({ expandAll: true })}>展开全部意见域</a>
        //             </Divider>
        //         </>
        //     );
        // }
        return opinionList.map(this.renderO1);
    }

    render() {
        const {
            bordered,
            isBeforeDraft,
            curNode,
            showOpinionList,
            ...restProps
        } = this.props;
        if (isBeforeDraft) return null; // 起草前不显示
        if (nodeUtils.isDraftNode(curNode)) return null;    // 起草环节不显示
        if (!showOpinionList) return null;

        if (bordered) {
            return (
                <Descriptions
                    column={1}
                    bordered
                    className={utils.getClassName('descriptionItem', this.props)}
                    {...restProps}
                >
                    {this.renderOpinionList1()}
                </Descriptions>
            );
        }
        return (
            <Card
                title={<Typography.Text strong>审批意见</Typography.Text>}
                bordered={false}
                {...restProps}
            >
                {this.renderOpinionList1()}
            </Card>
        );
    }

}

export default withFlowContext(OpinionList, [
    'isBeforeDraft',
    'curNode',
    'showOpinionList',
    'opinionList',
    'opinionConfig',
    'formRef',
    'formValue',
]);
