import React, { Component } from 'react';
import { Breadcrumb, Tabs, ConfigProvider, Button } from 'antd';
import QueryOnePage from './QueryOnePage';

import Tool from './Tool';
import zhCN from 'antd/es/locale/zh_CN';
import _ from 'lodash';

export default class QueryPage extends Component {

    constructor(props) {
        super(props);
        this.tool = new Tool();
        this.state = { page: this.props.page, activeKey: '0', pageRef: {} };
    }

    componentDidMount() {
        if (this.props.onRef)
            this.props.onRef(this); // 需要对外声明被调用

        // 添加activekey属性
        const { page, pageRef } = this.state;
        const tabs = page.tabs;

        for (var pagename in page.pageinfos) {
            //子page组件的props.page有brother属性
            page.pageinfos[pagename].brothers = pageRef;
        }

        if (tabs) {
            const url = window.location.href;
            const activeKey = this.tool.getUrlPara('activeKey', url)
            if (activeKey) {
                const activeKeyIndexx = tabs.findIndex(tab => tab.pageinfo[0] === activeKey)
                if (activeKeyIndexx > -1) {
                    this.setState({
                        activeKey: activeKeyIndexx
                    })
                }
            }
        }
    }

    handleChange = (key) => {
        this.setState({
            activeKey: key
        })
    }

    onPageRef = (pagename, ref) => {
        this.state.pageRef[pagename] = ref;
    }

    render() {
        const { page, activeKey } = this.state;
        const tabs = page.tabs;
        let content = [], btnContent = [];  // Tabs如果用额外的按钮btnContent
        if (!tabs) {
            for (let pagename in page.pageinfos) {
                if (typeof (page.pageinfos[pagename]) == "object") {
                    content.push(<QueryOnePage key={pagename} onRef={(ref) => this.onPageRef(pagename, ref)} page={page.pageinfos[pagename]} parent={this.props.parent}></QueryOnePage>)
                }
            }
            return (
                <div>
                    {
                        page.path
                        ?
                            <Breadcrumb>
                                { page.path.split("/").map((pathname, pathindex) => <Breadcrumb.Item key={pathindex}>{pathname}</Breadcrumb.Item>)}
                            </Breadcrumb>
                        :
                            null
                    }
                    <ConfigProvider locale={zhCN}>
                        <div className="pageinfos">{content}</div>
                    </ConfigProvider>
                </div>
            )
        } else {
            tabs.forEach((tab, index) => {
                if (tab.type && tab.type === 'button') {
                    btnContent.push(<Button onClick={tab.click} key={index} style={{ zIndex: 1 }}>{tab.title}</Button>)
                } else {
                    content.push(<Tabs.TabPane tab={tab.title} key={index}>{
                        tab.pageinfo.map(pagename => {
                            return <QueryOnePage key={pagename} onRef={(ref) => this.onPageRef(pagename, ref)} page={page.pageinfos[pagename]} parent={this.props.parent}></QueryOnePage>
                        })
                    }</Tabs.TabPane>)
                }
            });
            return (
                <div>
                    {
                        page.path
                        ?
                            <Breadcrumb>
                                {page.path.split("/").map((pathname, pathindex) => <Breadcrumb.Item key={pathindex}>{pathname}</Breadcrumb.Item>)}
                            </Breadcrumb>
                        :
                            null
                    }
                    <div className="pageinfos">
                        <Tabs animated={false} tabBarExtraContent={btnContent} onChange={this.handleChange} activeKey={`${activeKey}`}>
                            {content}
                        </Tabs>
                    </div>
                </div>
            )
        }
    }
}
