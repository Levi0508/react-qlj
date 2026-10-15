import React, { Component } from 'react';
import QueryForm from './QueryForm';
import QueryTable from './QueryTable';

import _ from 'lodash';

class QueryOnePage extends React.Component {

    constructor(props) {
        super(props);
        this.state = { page: this.props.page, queryObj: {} };
    }

    //为了调用子组件方法
    _onTableRef = (ref) => {
        this.grid = ref;
    }

    _onFormRef = (ref) => {
        this.form = ref;
    }
    componentDidMount() {
        if (this.props.onRef)
            this.props.onRef(this);//需要对外声明被调用
        if (this.props.page && this.props.page.initdata) {
            this.initdata = this.props.page.initdata
        }
        
        if(this.props.parent) {
            this.parent = this.props.parent;
        }

        if(this.queryref){
            var scroll = { x: this.queryref.clientWidth };

            this.setState({ scroll: scroll});
        }
    }

    // 触发查询按钮
    _handleEvent = (event, field, value, text, object, arg) => {
        if(event.source === event.target) { // 如果是相等，则是从控件级别向上冒泡的
            if (event && event.type == 'click') {
                if (arg && arg.type === 'button' && arg.displaytype === 'search') {
                    this.state.queryObj = this.form.call('getValue');
                    this.grid.call("search", this.state.queryObj);
                }
            }
        }
    }

    render() {
        const {
            page,
            parent,
        } = this.props;

        if(!page) return null;

        if(page.brothers){
            this.brothers = page.brothers
        }
        const {
            title,
            form,
            grid,
        } = page;

        const {
            scroll
        } = this.state;

        const that = this;

        return <div className="querypage" ref={(ref) => { this.queryref = ref; }}>
            {
                title ?
                <div className="title">{title}</div>
                :
                null
            }
            {
                form ?
                <QueryForm parent={parent} page={page} handleEvent={this._handleEvent} onRef={this._onFormRef.bind(that)} onepage={that} ></QueryForm>
                :
                null
            }
            {
                grid ?
                <QueryTable parent={parent} scroll={scroll} page={page} grid={grid} onRef={this._onTableRef.bind(that)} onepage={that}></QueryTable>
                :
                null
            }
        </div>
    }
}

export default QueryOnePage