import { Icon, Modal } from 'antd';

import React, { Component } from 'react';
import FormBaseComponent from './FormBaseComponent';
import QueryOnePage from './QueryOnePage';

import _ from 'lodash';

class FormTableModal extends FormBaseComponent {

    constructor(props) {
        super(props);

        this.state = {
            ref: null,
            valueObj: [],
        };
    }

    componentDidMount() {
        if (this.props.onRef)
            this.props.onRef(this);
    }

    render() {
        return this.__renderEdit();
    }

    __setdata = (data) => {
        const { ref, valueObj } = this.state
        const {
            selectedRowKeys,
            selectedRows
        } = ref.grid.state;

        const rows = [];
        selectedRows.forEach(item => {
            if (data.indexOf(item[valuefield]) > -1) {
                rows.push(item)
            }
        });

        ref.grid.setState({
            selectedRowKeys: data,
            selectedRows: rows
        })
    }

    __onRef = (ref) => {
        this.state.ref = ref;
    }

    __renderEdit = () => {

        const {
            page,
            visible,
            parent,
        } = this.props;

        const {
            labelname
        } = this.props.arg;

        const title = _.get(page, 'window.title', labelname || <div />);

        const width = _.get(page, 'window.width', 776);
        const height = _.get(page, "window.height", null);

        let content = <QueryOnePage parent={parent} page={page} onRef={this.__onRef} />
        let style = this.__getStyle();
        const config = {
            visible : visible,
            destroyOnClose : true,
            title : title,
            width : width,
        };

        if(height) config.height = height;

        return this.__renderTemplete(style,
            <Modal
                {...config}
                onOk={this.__handleOk}
                onCancel={this.__handleCancel}
            >
                {content}
            </Modal>
        );
    }

    __handleCancel = () => {
        if(this.props.handleClose) this.props.handleClose(false);
    }

    __handleOk = (e) => {
        const {
            ref,
        } = this.state;
        const {
            page,
        } = this.props;

        if (ref.grid && ref.grid.state) {
            let datas = ref.grid.state.selectedRows;//获取弹框表格选中值
            // 加载外部的验证方法
            const check = _.get(page, "grid.submit.check", null);
            if (check) {
                let customChecklist = check.call(this, datas);
                if (_.isArray(customChecklist) && customChecklist.length > 0) {
                    const errmsg = checklist.map(e => _.isString(e) ? e : e.message).join("<br />");
                    message.warn(errmsg);
                    return;
                }
            }
            this.setState({ valueObj: datas }, () => {
                if(this.props.handleClose) this.props.handleClose(false);
                super.handleEvent(e, { type: "change", source: "", target: "" }, "", null, null, datas);
            });
        }
    }

    __handleModal = () => {
        this.setState({ visible: true });
    }

    __renderTemplete = (style, children) => {
        return <div >
            {children}
        </div>;
    }

    __getStyle = () => { // 获取样式
        // 主要是layout，如果layout
        const {
            layout, // 如果layout存在，并且layout.normal存在，则表示为固定布局
            style, // 如果未固定布局，需要根据style.width来进行计算宽度
            field
        } = this.props.arg;
        const {
            error,
        } = this.state;

        let normal = _.get(this.props.arg, "layout.normal", "");
        let className = _.get(this.props.arg, "layout.grid.direction", "") === "v" ? "vformfield" : "formfield";
        if (error) {
            className += " has-error";
        }
        if (normal == "") { //为空表示不是固定布局
            let innerflex;
            if (field.indexOf("-") > 0) {
                innerflex = _.get(this.props.arg, "layout.grid.col.innerflex", 1)
            } else {
                innerflex = _.get(this.props.arg, "layout.grid.col.innerflex", 2)
            }
            return {
                contentstyle: { className: className },
                labelstyle: "width: " + _.get(this.props.arg, "labelStyle.width", 120) + "px; text-align:right",
                style: {},
                groupstyle: { display: "flex" },
                controlstyle: { flex: innerflex, minWidth: "120px" }
            };
        } else {
            let width = _.get(this.props.arg, "style.width", 230); // 默认为230
            if (this.props.arg.field.indexOf("-") > 0) {
                width = (width - 30) / 2;
            }
            return {
                contentstyle: { className: className },
                labelstyle: "width: " + _.get(this.props.arg, "labelStyle.width", 120) + "px; text-align:right",
                style: {},
                groupstyle: {},
                controlstyle: { width: width + "px" }
            };
        }
    }
}
export default FormTableModal
