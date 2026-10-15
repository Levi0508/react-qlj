import React, { Component } from 'react';
import ReactDOM from 'react-dom'

import {
    Tooltip,
    message,
    Divider,
    Modal,
    Popover,
    Button,
} from 'antd';

import BusinessCard from '../../components/BusinessCard';
import QueryPage from './QueryPage';

import linkRequest from '../../utils/linkRequest';
import qs from 'querystring';
import request from '../../utils/request';
import _ from 'lodash';

Tool.__modalLength = 0;
Tool.__modalRefs = [];

function Tool(control) {

    this.page = control;

    this.ajaxHandler = function (ajaxObj) {
        let modelPara = {}; // 请求数据

        if (ajaxObj.getParam) { // 建议使用getParam方法
            if (typeof ajaxObj.getParam === "function") {
                modelPara = ajaxObj.getParam();
            } else {
                modelPara = ajaxObj.getParam;
            }
        } else if (ajaxObj.model) { // 仅仅为了兼容以前的代码
            if (typeof ajaxObj.model === "function") {
                modelPara = ajaxObj.model();
            } else {
                modelPara = ajaxObj.model;
            }
        }

        const urlType = _.get(ajaxObj, "urlType", "");
        const url = _.get(ajaxObj, "url", "");
        const method = _.get(ajaxObj, "method", null);
        const options = _.get(ajaxObj, "options", null)
        return linkRequest(urlType, modelPara, url, ajaxObj.Page, ajaxObj.ColOrder, method, options).then((data) => {
            let after = _.get(ajaxObj, "after", null);
            if (after && _.isFunction(after)) {
                let afterData = after.call(this, data);
                if (after !== undefined) {
                    data = afterData;
                }
            }
            if (data && data.State === 0) {
                if (ajaxObj.dataComplete) {
                    let retData = ajaxObj.dataComplete(data.Data, data.Page, data);
                    if (retData !== undefined) {
                        data.Data = retData;
                    }
                }
                return Promise.resolve(data);
            }
            return Promise.reject(Object.assign({}, {
                status: (data && data.State) || -1,
                statusText: !data ? "出现错误" : (data.ErrMsg || "")
            }));
        });
    }

    this.import = function (ajaxObj) {
        let modelPara = {}; // 请求数据

        if (ajaxObj.getParam) { // 建议使用getParam方法
            if (typeof ajaxObj.getParam === "function") {
                modelPara = ajaxObj.getParam();
            } else {
                modelPara = ajaxObj.getParam;
            }
        } else if (ajaxObj.model) { // 仅仅为了兼容以前的代码
            if (typeof ajaxObj.model === "function") {
                modelPara = ajaxObj.model();
            } else {
                modelPara = ajaxObj.model;
            }
        }

        const urlType = _.get(ajaxObj, "urlType", "");
        const url = _.get(ajaxObj, "url", "");
        return request.post(url, {
            headers: {
                'Content-type': 'application/x-www-form-urlencoded',
            },
            data: qs.stringify({
                data: JSON.stringify({
                    Type: urlType,
                    Download: modelPara,
                })
            })
        }).then((data) => {
            if (data && data.State === 0) {
                if (ajaxObj.dataComplete) ajaxObj.dataComplete(data.Data, data.Page, data);
                return Promise.resolve(data);
            }
            return Promise.reject(Object.assign({}, {
                status: (data && data.State) || -1,
                statusText: !data ? "出现错误" : (data.ErrMsg || "")
            }));
        });
    }
    this.export = function (params) {
        const { Url = "/link/export/apiajax/exportHandler" } = params;
        var url = Url;
        let fileName = '', ReturnType = ''
        ReturnType = params.ReturnType || 'csv';
        if (params.Download) {
            fileName = params.Download.FileName || '';
        }
        if (params.sysId) {
            url += (url.indexOf("?") >= 0 ? "&" : "?") + "sysId=" + params.sysId;//系统号
        } else {
            url += (url.indexOf("?") >= 0 ? "&" : "?") + "sysId=100";//系统号
        }
        if (params.menuId) {
            url += (url.indexOf("?") >= 0 ? "&" : "?") + "menuId=" + params.menuId;//菜单ID
        } else {
            let menuId = this.getUrlPara("menuId");
            if (menuId) {
                url += (url.indexOf("?") >= 0 ? "&" : "?") + "menuId=" + menuId;//菜单ID
            }
        }
        if (params.Type) {
            url += (url.indexOf("?") >= 0 ? "&" : "?") + "funId=" + params.Type;//功能ID
        }
        params = JSON.stringify(params)
        return request.post(url, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            responseType: 'blob',
            data: qs.stringify({ data: params })
        }).then(res => {
            let blob = new Blob([res], { type: 'application/vnd.ms-excel' });
            let a = document.createElement('a');
            let url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName + "." + ReturnType;
            a.click();
            window.URL.revokeObjectURL(url);
            a = null;
        })
    }
    this.auth = function (menuId, tabIds, callback) {
        let userAuthConfig = "userauth" + (this.getCookie('oem.sessionid') || "");
        var userAuthsStr = localStorage.getItem(userAuthConfig);
        let userAuths = null;
        var menuUserAuths = [];

        if (userAuthsStr) {
            userAuths = JSON.parse(userAuthsStr);

            if (userAuths && userAuths.length > 0) {
                userAuths.forEach(item => {
                    if (item.FMENUID == menuId || item.MENUID == menuId
                        || tabIds.indexOf(item.MENUID) >= 0) {
                        menuUserAuths.push(item);
                    }
                })
                callback(menuUserAuths);
            }
        } else {
            this.ajaxHandler({
                url: "/link/common/apiajax/ajaxMappingHandler",
                urlType: "SYS_AUTH_Q0022",
                dataComplete: function (data) {
                    let savefileds = ["MENUID", "MENUNAME_PATH", "MENUTYPE", "FMENUID", "BUTTON_JSON", "EXPORTFLAG", "AUTH_EXPORT"];
                    let savedata = data.map(item => {
                        let saveobj = {};
                        savefileds.forEach(field => {
                            if (field == "BUTTON_JSON") {
                                if (item[field]) saveobj[field] = JSON.parse(item[field]);
                            } else {
                                saveobj[field] = (item[field] || "").toString();
                            }
                        })
                        if (item.FMENUID == menuId || item.MENUID == menuId
                            || tabIds.indexOf(item.MENUID) >= 0) {
                            menuUserAuths.push(saveobj);
                        }
                        return saveobj;
                    });
                    localStorage.setItem(userAuthConfig, JSON.stringify(savedata));
                    callback(menuUserAuths);
                }
            })
        }
    }

    this.alert = function (msg) {
        alert(msg);
    }
    this.confirm = function (title, content, onOk, onCancel, config) {
        var confirmConfig = {
            title: title,
            content: <div dangerouslySetInnerHTML={{ __html: content }} />,
            okText: "确定",
            cancelText: "取消",
            onOk() {
                if (onOk)
                    onOk();
            },
            onCancel() {
                if (onCancel)
                    onCancel();
            },
        };
        if (config) {
            confirmConfig = Object.assign(confirmConfig, config)
        }
        Modal.confirm(confirmConfig);
    }
    this.tip = function (msg, config) {
        if (!config || config.type == "success")
            message.success(msg);
        else if (config.type == "error") {
            Modal.error({
                title: msg,
                content: '',
            });
        } else
            message.info(msg);
    }

    //打开弹框
    this.openModal = function (page, configObj, initdata) {
        Tool.__modalLength++;
        let modal;
        let openmodal = document.createElement("div");
        openmodal.id = "all_link_modal" + Tool.__modalLength || "";
        document.body.appendChild(openmodal);

        if (!configObj || !configObj.modeltype || configObj.modeltype == "config") {
            let assPage = _.cloneDeep(page);

            let parent = this.page || {};
            parent.modalRefHandler = (ref) => {
                parent.modalRef = ref;
                parent.close = function () {
                    Tool.__modalLength--;
                    this.modalRef._destroy();
                }
            };

            modal = React.createElement(FormModalComponent, { page: assPage, parent: parent, configObj: configObj, initdata: initdata, onRef: parent.modalRefHandler });
            ReactDOM.render(modal, openmodal);
        }
    }

    this.trim = function (msg) {
        if (msg === undefined || msg === null) return "";
        else return _.trim(msg);
    }
    this.math = {
        division: function (dividend, divisor, precision = 2) {
            let retVal = NaN;
            if (!_.isNumber(dividend)) {
                retVal = _.toNumber(dividend);
                if (retVal === NaN) return retVal;
            } else {
                retVal = dividend;
            }

            let divisors = divisor;
            if (!_.isArray(divisor)) {
                divisors = [divisor];
            }
            _.forEach(divisors, d => {
                let number_d = d;
                if (!_.isNumber(d)) {
                    number_d = _.toNumber(d);
                }
                if (number_d === 0 || number_d === NaN) {
                    retVal = NaN;
                    return false;
                }
                retVal = _.divide(retVal, number_d);
            });
            return _.round(retVal, precision);
        },
        randomNumber: function (digit) {
            return _.random(digit, false);
        },
        floor: function (number, precision = 0) {
            return _.floor(number, precision)
        },
    }
    this.table = {

        renderTip: function (text, tip) {
            return <><Tooltip title={tip}>
                <img style={{ width: "15px", height: "15px", top: "15px" }}
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAAXNSR0IArs4c6QAABUVJREFUSA3lV21I3WUUP+deXzObrWnozDkVt2YjqAzGGrjRh1oxxHBBDcTNUS3Z9FYUUaJRH/rQtYYtFlmXXj40a20tDIqwjcA2BHvbymXXF1KZS600Tb33nn7n730uz727dxP6FD3gfc5z3n7/55zznOeR6P82eLkbXtMqN3KIKoXpDtisJqFcYpoFPYa/X5ip03UVdfof4j+W4/OKwADcJkIvkshttkNmngc/mUhchs/EC6DbXW5qGWjgC4Yfb04IXHRYVgRnyCcklWoIoO+www8A0wk4//A+nqrokqTRXrp+keiWkFAl5FUikgXlGUSgcaiR34gH6viLJyj2SklA6ARA18NJPws9NfQYfxhP1+YVHJJreY6eBm8/bFNczAfL88nTsZODtp7Sl+y4+DXJCczSGRiugfjj9Cza1beHp23DZhGXr41Kk4Qm+vfzRVumdEGrbEY9HIWPHHz4K8MebojViQK+9bAk//YXdSFcmxHad2sbqaaZ4SI8Ct+SNJmi55DbfchthrKh1yduenT4AH9h9HQGeBEi9TV8ZUOnbsjD7bY8UhjKvDhDj4RBTycnUZ0NqrsEaCfkTyB/i3D2KVB7sF5HQfp8rVd22o6HG9nvdlMV9BZxAlpLDkq2LY8AQ3ANBM/CWRClugchnLcVfV7aC5CtcNSdnkIl2MF2hLDczbwDeiEk8VBhKwrLGv4D/BWWbQh55uIifFsjArwYoF0I3yrE/u1+D5+1dBwyxHSPQzDV/1TPE0Y+4OETaoPjdp0QbTJ8M+MjX8DH/on13rJX5WrDjwAjb86xQYOIyoVRxIyGwRO3r6ZvLZ4hnQ9FTksNw8zhjzyOXadNL9Bdhu8Ab/JKOvJWgQYwvruBuo3Qnl1M1dDZEns0nBQJ1YV1v7FtIjTTMaVRpncbXpISF9yULwFJBvD3dkEZJZ0HG3nQXiutVb4wRZ8gResRzo8GPXwyVkfXSMHSBzEVGbmzY1RGnsNgGjWCK83hKn8Pud2iBQcHDyaycWWF/UoYB4pLOXZRWtjo70TGsfw3W+kZVHkVonQOFXNvtwc9K8EozyB0VQSaIzhLwKhKvWE0JrkJbKPY1UfEjUJ6HMU260ql7Wc9PBmlELM4M0I5cK6bjETU2XFqEo2EdYtibOIue8ZREzib+NCegXoeiqtkMd0uKg4vo4G15DVkcLYBTaDQsolLukPkFCUihRBeeQSCSz0A+qeMtrNjXSAQx3VGY45qfcqLHfkbaQgF1YWcHY2Vxa61CMG7T/mcsnSsHFp/dOgLQ0L0A87qBPp0CVqmdpt/PQq9UhMS8eFDT6LNVhiHkR3j0v4RofChUrMXgtRiFBLNmhJtPInkyi/zykpE8Hml2UVP6mxGBFgZqUxNqNRJCkkDIpDwXEJWhReHHxV5vuyIpBhn9qyvkxmiDpzzfOz2ncEGPm3Lo4DPe3iE3JpjDqBi2wteElwccYbQWjhkHKmc4DhlxmroZeDvxTNJZBuKtndVBj0cq4PoXjqQl1rs6HWUXJI+X1wZ1GS/HjXEOPg1CN85POpO2R6KXpbyQAgXjchG7LQP9XIn6uVXW0fpuMAqCL8uNVQrEX4cN/LiYu/AHfuzyu2hL5fJOaoIhpzLolqjAZvPcLHcjx7/u61r6ITAqgDwXIS8BU1+N5y5HSM8/sAbQM8bw9nTWy0P65vQA1aE5SPgNdU2kK/ZejY5MuvnssBGr6hNSkPz9AD2UYm83Wz4kZmdPq07PJYr9P7l+raxWRawUdZ5XbtkLkxTHh4O+p/EnDuZRm/YQGNfbkVB/hfGPyac8XEnYx4XAAAAAElFTkSuQmCC"></img>
            </Tooltip>
                {text}
            </>;
        },

        renderlink: (title, func, columnNames, params, cls) => {
            if (typeof (title) == "string") {//单个模式
                return <Button type="link" onClick={(e) => this.page ? this.page.props.grid.functions[func].apply(this.page, [params]) : null}>{title}</Button>
            } else if (Array.isArray(title)) {//多个模式
                if (Array.isArray(func) && func.length == title.length
                    && (columnNames == null || (Array.isArray(columnNames) && columnNames.length == title.length))
                    && (params == null || (Array.isArray(params) && params.length == title.length))) {
                    return <div>
                        {title.map((link, index) => {
                            if (index > 0) {
                                return <span key={index}><Divider type="vertical" /><Button type="link" style={{ paddingLeft: "0px", paddingRight: "0px" }} onClick={(e) => this.page ? this.page.props.grid.functions[func[index]].apply(this.page, [params[index]]) : null}>{link}</Button></span>
                            } else {
                                return <Button key={index} type="link" style={{ paddingLeft: "0px", paddingRight: "0px" }} onClick={(e) => this.page ? this.page.props.grid.functions[func[index]].apply(this.page, [params[index]]) : null}>{link}</Button>
                            }
                        })}
                    </div>
                }
            }
            return null;
        },

        renderHtml: function (row, html) {
            if (!html) return null;
            let _html = html;
            _.each(row, (value, key) => {
                let r = new RegExp("\\${" + key + "}?");
                _html = _html.replace(r, value);
            });
            return <div dangerouslySetInnerHTML={{ __html: _html }}></div>;
        },

        renderHover: function (text, row, html) {
            if (!html) return null;
            let _html = html;
            _.each(row, (value, key) => {
                let r = new RegExp("\\${" + key + "}?");
                _html = _html.replace(r, value);
            });
            return <Popover content={<div dangerouslySetInnerHTML={{ __html: _html }}></div>}>{text}</Popover>
        },

        // type: tip, hover, html, card
        render: function (type, text, row, templete) {
            switch (type) {
                case "card":
                    return <BusinessCard emp_no={templete}><a>{text}</a></BusinessCard>;
                case "html":
                    return this.renderHtml(row, templete);
                case "tip":
                    return this.renderTip(text, templete);
                case "hover":
                    return this.renderHover(text, row, templete);
            }
            return text;
        }
    }
    this.format = {
        money: function (s, n) {
            if (s == undefined) return 0;
            n = n && n >= 0 && n <= 20 ? n : 2;
            s = parseFloat((s + "").replace(/[^\d\.-]/g, "")).toFixed(n) + "";
            //是否是负数
            var prestr = '';
            if (s.substring(0, 1) == "-") {
                s = s.substring(1, s.length);
                prestr = '-';
            }
            var l = s.split(".")[0].split("").reverse(),
                r = s.split(".")[1];
            var t = "";
            for (var i = 0; i < l.length; i++) {
                t += l[i] + ((i + 1) % 3 == 0 && (i + 1) != l.length ? "," : "");
            }

            if (n == 0)
                return prestr + t.split("").reverse().join("");
            else
                return prestr + t.split("").reverse().join("") + "." + r;
        }
    }
    this.getUrlPara = function (name, url) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        if (url) {
            if (url.indexOf("?") != -1)
                url = url.split("?")[1];
        } else if (window.location.search.length > 1) {
            url = decodeURI(window.location.search.substr(1));
        } else {
            return '';
        }
        var r = url.match(reg);
        if (r != null) return unescape(r[2]); return '';
    }
    this.getCookie = function (a) {
        a = a.toLowerCase();
        for (var b = document.cookie.split(";"), e, c, g = 0; g < b.length; g++) {
            if (e = b[g].split("="), c = _.trim(e[0]), c === a)
                return decodeURIComponent(1 < e.length ? e[1] : "");
        }
        return null
    }
    this.setCookie = function (a, b) {
        document.cookie = encodeURIComponent(a) + "=" + encodeURIComponent(b) + ";path=/"
    }
    this.date = {
        getCurrentDay: function (n, basicDate) {
            var today = basicDate || new Date();
            if (n) {
                today = new Date(today.valueOf() + n * 24 * 60 * 60 * 1000);
            }
            var day = today.getDate();

            var month = today.getMonth() + 1;
            var year = today.getFullYear();
            if (month < 10) {
                var strMonth = "0" + month;
            }
            else {
                strMonth = month;
            }
            if (day < 10) {
                var strDay = "0" + day;
            } else {
                strDay = day;
            }
            var date = year + "-" + strMonth + "-" + strDay;

            return date;
        }
    }
}

class FormModalComponent extends Component {
    constructor(props) {
        super(props);

        this.state = {
            visible: true,
            page: this.props.page,
            ref: null,
        };
    }

    __handleCancel = e => {
        this.setState({
            visible: false,
        });
    };

    _destroy() {
        this.setState({ visible: false, ref: null });
    }

    __handleClick = (pagename, arg) => {
        const form = _.get(this.state, "ref.state.pageRef." + pagename + ".form", null);
        if (form) {
            form.call("_handleEvent", { type: "click", source: "", target: arg.field }, arg.field, null, null, null, arg);
        }
    }

    //弹框取得当前page
    __onOnePageRef = (ref) => {
        this.state.ref = ref;
    }

    componentDidMount() {
        if (this.props.onRef)
            this.props.onRef(this);
    }

    render() {
        if (!this.state.visible) {
            return null;
        }

        const { configObj, initdata } = this.props;

        const { page } = this.state;

        let modelConfig = Object.assign({
            title: page.title || "",
            centered: true,
            destroyOnClose: true,
            closable: true,
            maskClosable: false,
            width: 600,
        }, configObj);

        let btns = [];

        if (!page.pageinfos) {
            return null;
        }

        Object.keys(page.pageinfos).forEach(pagename => {
            if (page.pageinfos[pagename] && page.pageinfos[pagename].form) {
                if (initdata)
                    // page.pageinfos[pagename].form.initdata = initdata;Queryform中initdata取自page
                    page.pageinfos[pagename].initdata = initdata;
                if (page.pageinfos[pagename].form.fields && page.pageinfos[pagename].form.fields.length) {
                    page.pageinfos[pagename].form.fields.forEach(field => {
                        if (field.type === "button" && !field.hidden && field.options && field.options.isFooter) {
                            let arg = { ...field };
                            btns.push({ page: pagename, arg });
                            field.hidden = true;
                        }
                    });
                }
            }
        });

        let style = { overflow: "auto" };
        if (this.props.configObj && this.props.configObj.height) {
            style.height = this.props.configObj.height + "px";
        }

        let content = <div style={style}><QueryPage page={page} onRef={this.__onOnePageRef} parent={this.props.parent}></QueryPage></div>
        return (
            <Modal
                {...modelConfig}

                visible={this.state.visible}
                onCancel={this.__handleCancel}
                footer={
                    btns.length == 0 ?
                        null
                        :
                        btns.map(btn => {
                            let pagename = btn.page;

                            return <Button key={btn.arg.field} type={btn.arg.btntype || ''} icon={btn.arg.icon || ''} onClick={() => this.__handleClick(pagename, btn.arg)}>{btn.arg.labelname}</Button>
                        })}
            >
                {content}
            </Modal>
        );
    }
}

export default Tool;
