import React, { Component } from 'react';

import FormBaseComponent from './FormBaseComponent';

import { Row, Col } from 'antd';

import _ from 'lodash';

class FormTextEditor extends FormBaseComponent {

    constructor(props) {
        super(props);
        const value = _.get(props, "arg.defval", "");

        this.state = {
            value,
            init: false,
            richTextName: `richtext_${Math.random() * 100000}`,
        };
    }

    _getValue = () => {
        const {
            richTextName,
            init,
            value,
        } = this.state;
        if(init)// 如果初始化完成，则使用控件的值
            return CKEDITOR.instances[richTextName].getData();
        return value;// 否则使用直接设置进来的值
    }

    _setValue = (value) => {
        const {
            richTextName,
            init,
        } = this.state;

        this.setState({value}, () => {
            if(init) // 如果初始化完成，需要对控件进行设置值
                CKEDITOR.instances[richTextName].setData(value);
        });
    }

    componentDidMount() {
        if(this.props.onRef) {
            const field = _.get(this.props, "arg.field", "");
            if(field) {
                this.props.onRef(this, field);
            }
        }

        const edit = _.get(this.props, "arg.edit", false);
        if(edit) { // 加载富文本框
            this.__initControl();
        }
    }

    componentWillReceiveProps(nextProps) {
        const {
            richTextName,
        } = this.state;
        const edit = _.get(nextProps, "arg.edit", false);
        // 当前改为可编辑，并且未初始化完成就需要初始化
        if(edit && !this.state.init && !_.isEqual(edit, _.get(this.props, "arg.edit", false))) {
            this.__initControl();
        }
    }

    render() {
        const edit = _.get(this.props, "arg.edit", false);
        return !edit ? this.__renderDisplay() : this.__renderEdit();
    }

    __initControl = () => {
        const {
            richTextName
        } = this.state;

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = '/thirdlib/ckeditor/ckeditor.js';
        script.addEventListener("load", () => {
            const editor = CKEDITOR.replace(richTextName, {height: "500px"});

            const config = editor.config;

            CKEDITOR.stylesSet.add( 'default', [
                // Block Styles
                { name: '自定义样式', element: 'span', styles: { 'font-size': '16px', "font-weight": "600" } }
            ]);

            // 调整为全连接上传
            config.filebrowserUploadUrl = "/api/eoafilegw/fileUpload?type=FLOW_ATTACH_PIC_U0002";
            config.cloudServices_uploadUrl = "/api/eoafilegw/fileUpload?type=FLOW_ATTACH_PIC_U0002";
            config.filepathOnloadUrlPrefix = "/attach";

            config.removePlugins = 'elementspath'; //移除元素路径

            config.font_names='宋体/SimSun;新宋体/NSimSun;仿宋/FangSong;仿宋_GB2312/FangSong_GB2312;楷体_GB2312/KaiTi_GB2312;黑体/SimHei;微软雅黑/Microsoft YaHei;'+ config.font_names;
            config.font_defaultLabel = '宋体';
            config.fontSize_defaultLabel = '18px';

            CKEDITOR.on('instanceReady', function (e) {
                e.editor.document.getBody().$.style="font-size:18px;font-family:宋体" ;
                CKEDITOR.instances[richTextName].on('contentDom', function() {
                    if(CKEDITOR.instances[richTextName].document && CKEDITOR.instances[richTextName].document.getBody() &&
                       CKEDITOR.instances[richTextName].document.getBody().$ && CKEDITOR.instances[richTextName].document.getBody().$!="undefined"){
                        CKEDITOR.instances[richTextName].document.getBody().$.style="font-size:18px;font-family:宋体" ;
                    }
                });
            });

            const {
                value
            } = this.state;
            this.state.init = true;
            CKEDITOR.instances[richTextName].setData(value);
        });
        document.head.appendChild(script);
    }

    __renderHidden = () => {
        return null;
    }

    __renderEdit = () => {
        const {
            richTextName,
        } = this.state;

        return <textarea style={{display: "none"}} name={richTextName}></textarea>;
    }

    __renderDisplay = () => {
        const {
            value
        } = this.state;
        return <div class="formtexteditor" dangerouslySetInnerHTML={{__html: value}}></div>;
    }
}

export default FormTextEditor;
