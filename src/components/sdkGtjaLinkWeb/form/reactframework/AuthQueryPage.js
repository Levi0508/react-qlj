import React, { Component } from 'react';
import QueryPage from './QueryPage';

import Tool from './Tool';
import _ from 'lodash';

export default class AuthQueryPage extends Component {

    constructor(props) {
        super(props);
        this.tool = new Tool();
        this.state = { page: null};
    }

    __getAuthPage = (pageoption) => {
        let btnIds = [];

        if (pageoption.tabs) {
            pageoption.tabs.forEach(tab => {
                if (tab.btnId) {
                    btnIds.push(tab.btnId);
                }
            })
        }

        if (!pageoption.menuId) { // 如果页面配置了验证权限
            this.setState({page: pageoption});
        } else {
            var that = this;
            this.tool.auth(pageoption.menuId, btnIds, function (userAuths) {
                if (userAuths && userAuths.length) {
                    const page = _.cloneDeep(pageoption);
                    let authtabs = page.tabs ? [] : null;
                    userAuths.forEach(auth => {
                        // 配置面包屑
                        if (auth.MENUID == page.menuId) {
                            page.path = auth.MENUNAME_PATH;
                            if (auth.MENUNAME_PATH) {
                                document.title = auth.MENUNAME_PATH.substring(auth.MENUNAME_PATH.lastIndexOf("/") + 1);
                            }
                        };

                        // 过滤无权限tabs
                        if (page.tabs) {
                            page.tabs.forEach(tab => {
                                if ( tab.isAuthed) return true;
                                if ( !tab.btnId) {
                                    tab.isAuthed = true;
                                    authtabs.push(tab);
                                } else if ( tab.btnId === auth.MENUID) {
                                    tab.isAuthed = true;
                                    authtabs.push(tab);
                                }
                            });
                        };
                        //导出权限
                        if(pageoption.menuId === auth.MENUID){
                            for (let  exportpagename in page.pageinfos) {
                                if (page.pageinfos[exportpagename].grid &&page.pageinfos[exportpagename].grid.export !==false && auth.EXPORTFLAG=='1' && auth.AUTH_EXPORT=='1') {
                                   if(page.pageinfos[exportpagename].grid.toolbar === undefined){
                                    page.pageinfos[exportpagename].grid.toolbar=[];
                                   }
                                   page.pageinfos[exportpagename].grid.toolbar.push({ field: "export",displaytype:'export', labelname: "导出", type: "button" })
                                }
                            }
                        }
                        // 设置页面按钮的权限
                        if (auth.BUTTON_JSON && auth.BUTTON_JSON.butlist.length) {
                            auth.BUTTON_JSON.butlist.forEach(bauth => {
                                // 遍历pageinfos找到所有有btnid的field
                                for (var pagename in page.pageinfos) {
                                    if (page.pageinfos[pagename].form && page.pageinfos[pagename].form.fields && page.pageinfos[pagename].form.fields.length) {
                                        page.pageinfos[pagename].form.fields.forEach(field => {
                                            if (field.btnId && !field.isAuthed) {
                                                field.hidden = true;
                                                if (field.btnId === bauth.menuid || field.btnId === auth.MENUID) {
                                                    field.isAuthed = true;
                                                    field.hidden = false;
                                                }
                                            }
                                        })
                                    }
                                    if (page.pageinfos[pagename].grid && page.pageinfos[pagename].grid.toolbar && page.pageinfos[pagename].grid.toolbar.length) {
                                        page.pageinfos[pagename].grid.toolbar.forEach(toolBtn => {
                                            if (toolBtn.btnId && !toolBtn.isAuthed) {
                                                toolBtn.hidden = true;
                                                if (toolBtn.btnId === bauth.menuid || toolBtn.btnId === auth.MENUID) {
                                                    toolBtn.isAuthed = true;
                                                    toolBtn.hidden = false;
                                                }
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    });
                    page.tabs = authtabs;
                    that.setState({ page: page});
                }
            });
        }
    }

    componentDidMount() {
        if (this.props.onRef)
            this.props.onRef(this); // 需要对外声明被调用

        // 权限验证
        this.__getAuthPage(this.props.page);
    }

    render() {
        const { page} = this.state;
        return page ? <QueryPage page={page}></QueryPage> : null;
    }
}
