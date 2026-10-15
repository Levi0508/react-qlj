import { Row, Col } from 'antd';

import React, { Component } from 'react';

import FormTextEditor from './reactframework/FormTextEditor';

import {withFlowContext} from '../flow/LinkFlowContext';

import _ from 'lodash';

class LinkFlowEditor extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            value: null,
            ref: null,
        }
    }

    getValue = () => {
        const {
            ref,
            value,
        } = this.state;

        if(ref) return ref.call("getValue");
        return value;
    }

    setValue = (value) => {
        const {
            ref,
        } = this.state;
        this.setState({value}, () => {
            if(ref) ref.call("setValue", value);
        })
    }

    _onRef = (ref, field) => {
        this.state.ref = ref;
        if(this.state.value) ref.call("setValue", this.state.value);
    }

    render() {
        const {
            template,
            editorArg,
        } = this.props;

        if(_.isEmpty(editorArg)) return null;

        const color = _.get(editorArg, "flowoption.color", "#000080");
        const caption = _.get(editorArg, "flowoption.captionName", "");
        const flowName = _.get(editorArg, "flowoption.flowName", template.flowName || "")
        return <div style={{padding: "0px 10px"}}>
                <Row>
                    <div style={{fontSize: "24px", fontFamily: "宋体", color: color, textAlign: "center"}}>国泰君安证券股份有限公司</div>
                </Row>
                <Row>
                    <div style={{fontSize: "24px", fontFamily: "隶书", color: color, textAlign: "center"}}>{flowName}</div>
                </Row>
                <Row>
                    <hr style={{width: "100%", height: "2px", border: `1px solid ${color}`, backgroundColor: color}} />
                </Row>
                {
                    caption &&
                    <Row>
                        <div style={{fontSize: "18px", fontFamily: "黑体", fontWeight: "bold", textAlign: "center"}}>{caption}</div>
                    </Row>
                }
                <Row>
                    <FormTextEditor arg={editorArg} onRef={this._onRef}></FormTextEditor>
                </Row>
            </div>;
    }
}

const delegate = ({editorRef, ...restProps}) => <LinkFlowEditor ref={editorRef} {...restProps} />

export default withFlowContext(delegate, [
    'template',
    'formRef',
    'editorRef',
    'editorArg',
]);
