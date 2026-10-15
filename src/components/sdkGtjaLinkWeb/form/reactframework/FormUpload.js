import React, { Component } from 'react';
import { Upload, Icon, Button } from 'antd';

import FormLabel from './FormLabel';
import FormExtraLabel from './FormExtraLabel';
import FormBaseComponent from './FormBaseComponent';

import Tool from './Tool';

class FormUpload extends FormBaseComponent {
  constructor(props) {
    super(props);
    this.tool = new Tool();

    let textfield = _.get(props.arg, 'options.textfield', 'Name');
    let valuefield = _.get(props.arg, 'options.valuefield', 'Path');

    this.state = {
      valuefield,
      textfield,
      valueObj: [],
      error: false,
      errormsg: '',
    };
  }

  componentDidMount() {
    if (this.props.onRef && this.props.arg.field) this.props.onRef(this, this.props.arg.field);
  }

  _setValue(value) {
    const { textfield, valuefield } = this.state;
    let valueObj = [];
    if (!value) {
      this.setState({ valueObj:{} });
    } else if (typeof value === 'string') {
      const name = value.substring(value.lastIndexOf('/') + 1);
      valueObj.push({ uid: 1, name, status: 'done', value, text: name, url: '/attach' + value });
    //   this.setState({ valueObj }, () => {
    //     super.handleEvent(
    //       null,
    //       { type: 'change', target: this.props.arg.field, source: '' },
    //       this.props.arg.field,
    //       valueObj.map(v => v.value).join(),
    //       valueObj.map(v => v.text).join(),
    //       valueObj,
    //     );
    //   });
    } else if (Array.isArray(value)) {
    } else if (typeof value == 'object') {
    }
  }

  _getValue() {
    const { valuefield, textfield, valueObj } = this.state;
    if (valueObj && valueObj.length > 0) {
      return {
        field: this.props.arg.field,
        value: valueObj.map(v => v.value).join(),
        text: valueObj.map(v => v.text).join(),
        valueObj,
      };
    }
    return null;
  }

  render() {
    let edit = _.get(this.props, 'edit', true);
    return !!this.props.hidden
      ? this.__renderHidden()
      : !edit
      ? this.__renderDisplay()
      : this.__renderEdit();
  }

  __renderHidden = () => {
    return null;
  };

  __renderDisplay = () => {
    // 展示模式
    let style = this.__getStyle();
    const clickEvent = _.get(this.props.arg, 'event.click', null);
    if (clickEvent) {
      return this.__renderTemplete(
        style,
        <div className="displaycontent link" onClick={e => this.__displayClick()}>
          {this.state.value}
        </div>,
      );
    } else {
      return this.__renderTemplete(style, <div className="displaycontent">{this.state.value}</div>);
    }
  };

  __renderEdit = () => {
    const { disabled } = this.props;

    const { valueObj } = this.state;

    let options = Object.assign(
      { type: 'upload', displayType: 'drag', listType: 'text', exts: '' },
      this.props.arg.options,
    );

    let style = this.__getStyle();

    if (!this.props.arg.multiple && valueObj.length > 0) {
      return this.__renderTemplete(
        style,
        <div className="formfield" style={{ display: !!this.props.arg.hidden ? 'none' : '' }}>
          <div className="fieldcontent">
            <Upload
              listType={options.listType}
              fileList={valueObj}
              onChange={this.__onChange}
              disabled={disabled}
            ></Upload>
          </div>
        </div>,
      );
    } else {
      let fileServer = _.get(this.props.arg, 'submit.url', '/link/fileUpload');
      let action = 'type=' + _.get(this.props.arg, 'submit.urlType', 'commUpload');
      action = fileServer + (fileServer.indexOf('?') >= 0 ? '&' : '?') + action;
      const displaytype = _.get(this.props.arg, 'displaytype', 'drag');
      const placeholder = _.get(
        this.props.arg,
        'placeholder',
        displaytype === 'drag' ? '点击或者拖动文件到此处上传' : '选择文件',
      );
      const config = {
        action: action,
        withCredentials: true,
        disabled: !!this.props.disabled,
        multiple: true, // before里面判定是多选还是单选
        showUploadList: false,
        listType: displaytype === 'image' ? 'picture-card' : 'text',
        beforeUpload: this.__beforeUpload,
        onChange: this.__onChange,
      };
      return this.__renderTemplete(
        style,
        <>
          {displaytype === 'drag' ? (
            <Upload.Dragger {...config}>
              <p className="ant-upload-drag-icon">
                <Icon type="inbox" />
              </p>
              <p className="ant-upload-text">{placeholder}</p>
            </Upload.Dragger>
          ) : displaytype === 'image' ? (
            <Upload {...config}>
              <div>
                <Icon type="plus" />
                <div className="ant-upload-text">{placeholder}</div>
              </div>
            </Upload>
          ) : (
            <Upload {...config}>
              <Button>
                <Icon type="upload" />
                {placeholder}
              </Button>
            </Upload>
          )}
          <Upload
            listType={options.listType}
            fileList={this.state.fileList}
            onChange={this.__onChange}
          ></Upload>
        </>,
      );
    }
  };

  __onChange = info => {
    if (!info || !info.file) {
      return;
    }

    const { file } = info;
    const { status, response } = file;

    if (status === 'done') {
      if (response) {
        const { Data, ErrMsg, State } = response;

        if (State == 0) {
          // 上传成功
          const serverFile = Data ? Data[0] : {};

          const { textfield, valuefield } = this.state;

          let { valueObj } = this.state;

          let value = _.pick(file, ['uid', 'name', 'status']);
          _.extend(value, {
            value: serverFile[valuefield],
            text: value.name,
            url: '/attach' + serverFile[valuefield],
          });
          valueObj = [value];
          this.setState({ valueObj }, () => {
            super.handleEvent(
              null,
              { type: 'change', target: this.props.arg.field, source: this.props.arg.field },
              this.props.arg.field,
              valueObj.map(v => v.value).join(),
              valueObj.map(v => v.text).join(),
              valueObj,
            );
          });
        } else {
          //上传失败
          this.tool.tip(file.file.response.ErrMsg || '上传文件错误', 'error');
        }
      }
    } else if (status === 'removed') {
      // 移除
      let { valueObj } = this.state;

      const index = valueObj.findIndex(f => f.uid === file.uid);
      if (index >= 0) {
        valueObj.splice(index, 1);
        this.setState({ valueObj }, () => {
          super.handleEvent(
            null,
            { type: 'change', target: this.props.arg.field, source: this.props.arg.field },
            this.props.arg.field,
            valueObj.map(v => v.value).join(),
            valueObj.map(v => v.text).join(),
            valueObj,
          );
        });
      }
    } else if (status == 'error') {
      const { error } = response;
      this.tool.tip(`上传文件错误:${error}`, 'error');
    } else {
      // 不允许上传
      const { error, errormsg } = this.state;
      if (error) {
        this.tool.tip(errormsg, 'error');
      }
    }
  };

  __beforeUpload = (file, fileList) => {
    let { error, errormsg } = this.state;

    error = true;

    const multiple = _.get(this.props, 'arg.multiple', false);

    if (multiple && fileList.length > 1) {
      errormsg = '不支持上传多个附件';
      error = false;
      if (!error) {
        // 不支持多个
        this.setState({ error, errormsg });
        return error;
      }
    }

    let exts = _.get(this.props.arg, 'submit.exts', '').toLowerCase();
    if (exts) {
      let currExt = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();
      let flag = false;
      exts.split(',').forEach(ext => {
        if (currExt == ext) {
          flag = true;
        }
      });
      if (!flag) {
        errormsg = `格式不允许，仅允许：${exts}`;
        error = false;
        if (!error) {
          // 格式不允许
          this.setState({ error, errormsg });
          return error;
        }
      }
    }

    let maxsize = _.get(this.props.arg, 'submit.maxsize', 0);
    if (maxsize > 0 && file.size > maxsize) {
      errormsg = `文件超大，仅允许：${maxsize}`;
      error = false;
      if (!error) {
        // 格式不允许
        this.setState({ error, errormsg });
        return error;
      }
    }

    return error;
  };

  __renderTemplete = (style, children) => {
    const { error, errormsg } = this.state;

    const { require, field, labelname, tip } = this.props.arg;

    return (
      <div
        data-field={field}
        className={style.contentstyle.className}
        draggable={this.props.draggable}
        onDragStart={e => this.props.onDragStart(e, this.props.arg)}
      >
        <FormLabel labelname={labelname} labelStyle={style.labelStyle} tip={tip}>
          {!!require && <FormExtraLabel></FormExtraLabel>}
        </FormLabel>
        <div className="fieldcontent">
          {children}
          {error ? (
            <Tooltip title={errormsg}>
              <Icon className="errormsg" style={{ color: '#FF0000' }} type="exclamation-circle" />
            </Tooltip>
          ) : null}
        </div>
      </div>
    );
  };

  __getStyle = () => {
    // 获取样式
    // 主要是layout，如果layout
    const {
      layout, // 如果layout存在，并且layout.normal存在，则表示为固定布局
      style, // 如果未固定布局，需要根据style.width来进行计算宽度
      field,
      labelStyle,
    } = this.props.arg;
    const { error, errormsg } = this.state;

    let normal = _.get(this.props.arg, 'layout.normal', '');
    let className =
      _.get(this.props.arg, 'layout.grid.direction', '') === 'v' ? 'vformfield' : 'formfield';
    if (error) {
      className += ' has-error';
    }
    if (normal == '') {
      //为空表示不是固定布局
      let controlstyle;
      if (field.indexOf('-') > 0) {
        controlstyle = { innerflex: _.get(this.props.arg, 'layout.grid.col.innerflex', 1) };
      } else {
        controlstyle = { innerflex: _.get(this.props.arg, 'layout.grid.col.innerflex', 2) };
      }

      controlstyle.minWidth =
        _.get(this.props.arg, 'style.minWidth', _.get(this.props.arg, 'style.width', '120')) + 'px';
      let width = _.get(this.props.arg, 'style.width', null);
      if (width !== null) {
        controlstyle.width = width + 'px';
      }

      return {
        contentstyle: { className: className },
        labelStyle: labelStyle,
        style: {},
        groupstyle: { display: 'flex' },
        controlstyle,
      };
    } else {
      let width = _.get(this.props.arg, 'style.width', 230); // 默认为230
      if (this.props.arg.field.indexOf('-') > 0) {
        width = (width - 30) / 2;
      }
      return {
        contentstyle: { className: className },
        labelStyle: labelStyle,
        style: {},
        groupstyle: {},
        controlstyle: { width: width + 'px' },
      };
    }
  };
}
export default FormUpload;
