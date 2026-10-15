import { Radio, Checkbox, TreeSelect,  Select, Tree, Badge, Tooltip, Icon } from 'antd';

import React, { Component } from 'react';

import FormBaseComponent from './FormBaseComponent';
import FormExtraLabel from './FormExtraLabel';
import FormLabel from './FormLabel';
import QueryTable from './QueryTable';

import Tool from './Tool';

import _ from 'lodash';

class FormTable extends FormBaseComponent {

    constructor(props) {
        super(props);

        this.tool = new Tool();

        this.state = {
            ref: {},
            scroll: null,
        };
    }

    componentDidMount() {
        if (this.props.onRef)
            this.props.onRef(this); //需要对外声明被调用
    }

    _getValue() {
        const {
            fieldtext,
        } = this.props.arg;

        const {
            valueObj,
            textfield,
            ref,
        } = this.state;

        if(!ref && !ref.table) {
            return null;
        }

        const data = ref.table.call("getData");
        if(!data) {
            return null;
        }

        return { field: fieldtext, value: null, text: null, valueObj: data };
    }

    _add = (row, flag = true) => {
        const {
            ref
        } = this.state;

        if(ref && ref.table) {
            ref.table.call("add", row, flag);
        }
    }

    _edit = (row) => {
        const {
            ref
        } = this.state;

        if(ref && ref.table) {
            ref.table.call("edit", row);
        }
    }

    _search = (param) => {
        const {
            ref
        } = this.state;

        if(ref && ref.table) {
            ref.table.call("search", param);
        }
    }

    _onRef = (ref, field) => {
        this.state.ref[field] = ref;
        if(field === "table") {
            if(this.tablecontainer) {
                this.setState({ scroll: {x : this.tablecontainer.clientWidth}});
            }
        }
    }

    render() {
        return !!this.props.hidden ? this.__renderHidden() : this.__renderDisplay();
    }

    __renderHidden = () => {
        const {
            require,
            field,
            labelname,
            tip
        } = this.props.arg;

        let style = this.__getStyle();

        return <div data-field={field}
                    style={{display: "none"}}
                    className={style.contentstyle.className}
                >
                    <FormLabel labelname={labelname} labelStyle={style.labelStyle} tip={tip}>
                            {!!require && <FormExtraLabel></FormExtraLabel>}
                    </FormLabel>
                    <div className="fieldcontent"
                         ref={(ref) => {if(ref) this.tablecontainer = ref}}>
                    </div>
                </div>;
    }

    __renderDisplay = () => {
        const {
            arg,
            page,
            draggable,
            edit,
            disabled,
        } = this.props;

        const {
            scroll,
        } = this.state;

        let style = this.__getStyle();

        return this.__renderTemplete(style,
            <QueryTable key={arg.field} page={page} grid={arg.grid} edit={!!edit} disabled={!!disabled}
                    scroll={scroll}
                    draggable={draggable}
                    onDragStart={(e, item) => this.dragItem(e, item)}
                    onRef={(ref) => this._onRef(ref, "table")}/>
        );
    }

    __renderTemplete = (style, children) => {
        const {
            error,
            errormsg,
        } = this.state;

        const {
            require,
            field,
            labelname,
            tip
        } = this.props.arg;

        return <div data-field={field}
                    className={style.contentstyle.className}
                    draggable={this.props.draggable}
                    onDragStart={(e) => this.props.onDragStart(e, this.props.arg)}
                >
                    <FormLabel labelname={labelname} labelStyle={style.labelStyle} tip={tip}>
                            {!!require && <FormExtraLabel></FormExtraLabel>}
                    </FormLabel>
                    <div className="fieldcontent"
                         ref={(ref) => {if(ref) this.tablecontainer = ref;}}>
                        {children}
                        {error ? <Tooltip title={errormsg}><Icon className="errormsg" style={{color: "#FF0000"}} type="exclamation-circle" /></Tooltip> : null }
                    </div>
                </div>;
    }

    __getStyle = () => { // 获取样式
        // 主要是layout，如果layout
        const {
            layout, // 如果layout存在，并且layout.normal存在，则表示为固定布局
            style, // 如果未固定布局，需要根据style.width来进行计算宽度
            field,
            labelStyle,
        } = this.props.arg;
        const {
            error,
            errormsg,
        } = this.state;

        let normal = _.get(this.props.arg, "layout.normal", "");
        let className = _.get(this.props.arg, "layout.grid.direction", "") === "v" ? "vformfield formtable": "formfield formtable";
        if(error) {
            className += " has-error";
        }
        if( normal == "") { //为空表示不是固定布局
            let controlstyle;
            if(field.indexOf("-") > 0) {
                controlstyle = { innerflex: _.get(this.props.arg, "layout.grid.col.innerflex", 1), minWidth: _.get(this.props.arg,"style.width", "120") + "px"};
            } else {
                controlstyle = { innerflex: _.get(this.props.arg, "layout.grid.col.innerflex", 2), minWidth: _.get(this.props.arg,"style.width", "120") + "px"};
            }
            return {
                contentstyle: {className: className},
                labelStyle: labelStyle,
                style: {},
                groupstyle: { display: "flex" },
                controlstyle
            };
        } else {
            let width = _.get(this.props.arg,"style.width", 230); // 默认为230
            if(this.props.arg.field.indexOf("-") > 0) {
                width = (width - 30) / 2;
            }
            return {
                contentstyle: {className: className},
                labelStyle: labelStyle,
                style: {},
                groupstyle: {},
                controlstyle: {width: width + "px"}
            };
        }
    }
}
export default FormTable
