import React from 'react';
import {
    Form,
} from 'antd';
import { get, pick } from 'lodash';
import classnames from 'classnames';

import { LinkFlow } from './gtjaLinkWeb';

import styles from './styles.less';

const flowStateNames = [
    'isEdit',
    'ibFlowForm',
    'fields',
];

/**
 * 表单字段包裹对象
 * 支持编辑模式和查看模式的渲染
 * 当流程的isEdit属性为true时，渲染编辑模式，否则渲染查看模式
 */
class Item extends React.Component {

    static defaultProps = {

        /**
         * 字段名称，默认会从children中获取
         * 当第一个children不是通过form.getFieldDecorator生成时需要设置此字段
         */
        field: null,

        /**
         * 接管判断是否应该渲染本字段的查看模式
         * 格式为 (fieldValue, fields) => boolean
         */
        isEditable: null,

        isRequire: null,

        isHidden: null,

        /**
         * 渲染查看模式
         */
        renderText: (fieldValue, fields) => fieldValue,
    }

    getFieldName = () => {
        let {
            field,
            children,
        } = this.props;
        if (!field) {
            // 尝试从children中获取field
            if (Array.isArray(children)) {
                for (let i = 0; i < children.length; i += 1) {
                    field = get(children, `[${i}].props.data-__field.name`);
                    if (field) break;
                }
                if (!field) field = null;
            } else if (children) field = get(children, 'props.data-__field.name');
            else field = null;
        }
        return field;
    }

    getFieldValue = (field) => {
        const {
            ibFlowForm,
        } = this.props;
        if (!field) field = this.getFieldName(); // 如果不传field，则默认取自身的field
        if (!field) return null;
        return ibFlowForm ? ibFlowForm.getFieldValue(field) : null;
    }

    isEditable = () => {
        const {
            isEdit,
            fields,
            isEditable,
        } = this.props;
        if (!isEdit) return false;   // 全局配置
        const fieldName = this.getFieldName();
        const fieldConfig = (fields || []).find(item => item.field === fieldName);
        const editable = fieldConfig && fieldConfig.edit;
        if (typeof isEditable === 'boolean') return isEditable;
        if (typeof isEditable === 'function') {
            // 允许自定义
            return isEditable(this.getFieldValue(fieldName), fields);
        }
        return editable;
    }

    isRequire = () => {
        const {
            isEdit,
            fields,
            isRequire,
        } = this.props;
        if (!isEdit) return false;   // 全局配置
        const fieldName = this.getFieldName();
        const fieldConfig = (fields || []).find(item => item.field === fieldName);
        const required = fieldConfig && fieldConfig.require;
        if (typeof isRequire === 'boolean') return isRequire;
        if (typeof isRequire === 'function') {
            // 允许自定义
            return isRequire(this.getFieldValue(fieldName), fields);
        }
        return required;
    }

    isHidden = () => {
        const {
            isEdit,
            fields,
            isHidden,
        } = this.props;
        if (!isEdit) return false;   // 全局配置
        const fieldName = this.getFieldName();
        const fieldConfig = (fields || []).find(item => item.field === fieldName);
        const hidden = fieldConfig && fieldConfig.hidden;
        if (typeof isHidden === 'boolean') return isHidden;
        if (typeof isHidden === 'function') {
            // 允许自定义
            return isHidden(this.getFieldValue(fieldName), fields);
        }
        return hidden;
    }

    renderText = () => {
        const {
            fields,
            renderText,
            children,
            ...restProps
        } = this.props;
        let fieldValue = null;
        let text = null;
        const fieldName = this.getFieldName();
        try {
            fieldValue = this.getFieldValue(fieldName);
            text = renderText(fieldValue, fields);
            if (typeof text === 'string' || typeof text === 'number') text = <span>{text}</span>;
        } catch (e) {
            console.warn(e);
            console.warn(`渲染查看模式报错：fieldName = ${fieldName} , fieldValue =`, fieldValue);
        }
        return text;
    }

    render() {
        const {
            dispatch,
            label,
            field,
            renderText,
            children,
            className,
            ...restProps
        } = this.props;
        // const childrenStyle = {};
        // if (!isEdit) childrenStyle.display = 'none';

        const itemProps = pick(restProps, Object.keys(Form.Item.propTypes));
        const editable = this.isEditable();
        const required = this.isRequire();
        const hidden = this.isHidden();

        if (hidden) return <div />;

        return (
            <Form.Item
                {...itemProps}
                label={label}
                required={editable && required}
                className={editable ? className : classnames(className, styles.viewMode)}
            >
                {editable ? children : this.renderText()}
            </Form.Item>
        );
    }
}

export default LinkFlow.withFlowContext(Item, flowStateNames);
