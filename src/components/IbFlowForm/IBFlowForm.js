/* eslint-disable no-param-reassign */
import React, {
    useState,
    useEffect,
} from 'react';
import {
    Form,
    message,
} from 'antd';
import { pick } from 'lodash';

import { LinkFlow, utils } from './gtjaLinkWeb';

const { linkRequest } = utils;

const flowStateNames = [
    'flowDispatcher',
    'template',
    'flowCode',
    'flowVer',
    'curNode',
    'piid',
    'tiid',
    'groupFlag',
    'SYS_GUID',
];

const IBFlowForm = (props) => {
    const {
        // 外部传参
        form = null,
        todoTitleField = null,
        onGetFormData = null,
        onGetChildFormData = null,
        onBeforeSubmitForm = null,
        onAfterSubmit = null,
        checkAuth = true,

        children,

        // 流程参数
        flowDispatcher,
        template,
        flowCode,
        flowVer,
        curNode,
        piid,
        tiid,
        groupFlag,
        SYS_GUID,

        ...restProps
    } = props;
    useEffect(() => {
        flowDispatcher.setStateSilence({ ibFlowForm: form });
    }, [form]);
    const [isFormInit, setFormInit] = useState(false);
    const [isMainFormInit, setMainFormInit] = useState(false);
    const [isFormConfigInit, setFormConfigInit] = useState(false);

    const checkForm = ({ payload }, { getState, setState, dispatch }) => {
        return new Promise((res, rej) => {
            try {
                form.validateFieldsAndScroll(async (err, values) => {
                    if (err) {
                        let parsedFormValues = values;
                        if (typeof onBeforeSubmitForm === 'function') {
                            try {
                                parsedFormValues = onBeforeSubmitForm(parsedFormValues) || formValues;
                                if (typeof parsedFormValues === 'object' && typeof parsedFormValues.then === 'function') {
                                    parsedFormValues = (await parsedFormValues) || formValues;
                                }
                            } catch (error) {
                                return error.message;
                            }
                        }
                        const otherParams = pick(flowDispatcher.getState(), ['piid', 'tiid', 'groupFlag', 'SYS_GUID', 'todoTitle']);
                        const result = await linkRequest('FLOW_MAINFORM_U0006', {
                            ...parsedFormValues,
                            ...otherParams
                        });
                        if (result.success && result.Data.SYS_GUID) {
                            flowDispatcher.setState({
                                SYS_GUID: result.Data.SYS_GUID,
                            });
                            if (typeof onAfterSubmit === 'function') {
                                onAfterSubmit(result.Data.SYS_GUID, otherParams);
                            }
                        }
                        res('请检查表单');
                    }
                    else res(true);
                });
            } catch (error) {
                res(error.message);
            }
        });
    }

    const submitForm = async ({ payload }, { getState, setState, dispatch }) => {
        const submitType = payload.type;
        const formValues = form.getFieldsValue();
        let parsedFormValues = formValues;
        if (typeof onBeforeSubmitForm === 'function') {
            // 尝试执行回调，并获取新的formValues
            try {
                parsedFormValues = onBeforeSubmitForm(parsedFormValues, submitType) || formValues;
                if (todoTitleField && parsedFormValues[todoTitleField]) {
                    const title = { todoTitle: parsedFormValues[todoTitleField] };
                    flowDispatcher.setState(title);
                }
                if (typeof parsedFormValues.then === 'function') {
                    parsedFormValues = (await parsedFormValues) || formValues;
                }
                if (parsedFormValues instanceof Error) {
                    return parsedFormValues.message;
                }
            } catch (error) {
                return error.message;
            }
        }
        const otherParams = pick(flowDispatcher.getState(), ['piid', 'tiid', 'groupFlag', 'SYS_GUID', 'todoTitle']);
        const result = await linkRequest(submitType === 'save' ? 'FLOW_MAINFORM_U0006' : 'FLOW_MAINFORM_U0007', {
            ...parsedFormValues,
            ...otherParams
        });
        if (result.success) {
            if (result.Data.SYS_GUID) {
                // 更新表单id
                flowDispatcher.setState({
                    SYS_GUID: result.Data.SYS_GUID,
                });
                if (typeof onAfterSubmit === 'function') {
                    onAfterSubmit(result.Data.SYS_GUID, otherParams, submitType);
                }
            }
            return true;
        } else {
            if (typeof onAfterSubmit === 'function') {
                onAfterSubmit(result.Data.SYS_GUID, otherParams, submitType);
            }
        }
        return result.ErrMsg;
    };

    useEffect(() => {
        if (!flowDispatcher) return;
        flowDispatcher.registerAction('checkForm', checkForm);
        flowDispatcher.registerAction('submitForm', submitForm);
        flowDispatcher.registerAction('clickPrint', () => window.print());
    }, [flowDispatcher]);
    useEffect(() => {
        initForm();
    }, [flowCode, flowVer, curNode]);
    useEffect(() => {
        initMainFormConfig();
    }, [piid, tiid, groupFlag]);
    useEffect(() => {
        initFormItemsConfig();
    }, [flowCode, flowVer, curNode, groupFlag, template]);

    /**
     * 获取流程表单基础数据
     * 非起草情况下，加载流程表单内容
     */
    const initForm = async () => {
        if (!flowCode || !flowVer || !curNode) return;

        const formConfigResult = await linkRequest('FLOW_FORM_Q0001', {
            flowCode,
            flowVer,
            nodeCode: curNode.nodeCode,
        });

        let groupFlag;
        if (formConfigResult.success || formConfigResult.State === 0) {
            try {
                const group = formConfigResult.Data.find(item => item.multiline === '0');
                groupFlag = group.groupFlag;
                let {
                    display,
                    editable,
                } = group;

                const newFlowState = { isFormInit: true, groupFlag };
                // 非起草、待办情况下，初始化为不可编辑
                if (curNode.personType !== '0' && curNode.personType !== '1') {
                    editable = '0';
                }
                newFlowState.isEdit = editable === '1'; // 流程可编辑
                flowDispatcher.setState(newFlowState);  // 更新流程状态
                setFormInit(true);
            } catch (e) {
                message.error(`转换流程表单配置失败：${e.message}`, 300000);
            }
        } else {
            console.warn(`查询流程表单模板信息失败：${formConfigResult.ErrMsg}`);
        }

    };

    const initMainFormConfig = async () => {
        if (!piid || !groupFlag) return;
        const formDataResult = await linkRequest('FLOW_MAINFORM_Q0001', {
            piid,
            tiid,
            groupFlag,
        });
        if (!formDataResult.success) {
            // TODO:
            console.warn(`查询流程表单数据失败：${formDataResult.ErrMsg}`);
            return;
        }
        if (!formDataResult.Data || !formDataResult.Data[0]) return; // 没有查询到流程表单数据
        const valueData = formDataResult.Data[0];
        const { SYS_GUID } = valueData;
        const newFlowState = { SYS_GUID };
        if (todoTitleField && valueData[todoTitleField]) {
            newFlowState.todoTitle = valueData[todoTitleField];
        }
        let parsedValueData = valueData;
        if (typeof onGetFormData === 'function') {
            // 尝试执行回调，并获取新的valueData
            // 传递Q0003_data
            const res = pick(flowDispatcher.getState(), ['Q0003_data']);
            parsedValueData = onGetFormData(parsedValueData, SYS_GUID, curNode, res.Q0003_data) || valueData;
            if (typeof parsedValueData.then === 'function') {
                parsedValueData = (await parsedValueData) || valueData;
            }
        }
        form.setFieldsValue(parsedValueData);
        flowDispatcher.setState(newFlowState);  // 保存表单id、todoTitle等
        setMainFormInit(true);
    }

    const initFormItemsConfig = async () => {
        if (!flowCode || !curNode || !curNode.nodeCode) return;
        const result = await linkRequest('FLOW_FORM_Q0003', {
            flowCode,
            flowVer,
            nodeCode: curNode.nodeCode
        });

        if (!result.success) {
            // TODO: 查询流程表单字段数据失败
            console.warn(`查询流程表单字段数据失败：${result.ErrMsg}`);
            return;
        }
        // 保存Q0003结果，即表单域是否可编辑的元数据
        flowDispatcher.setState({
            Q0003_data: result?.Data
        });

        let formLayout = {};
        let fields = [];
        let editorArg;  // 正文字段
        try {
            // 根据全连接表单配置的格式获取所配置的字段
            formLayout = eval(`(${template.formLayout})`);
            if (!formLayout) return;
            fields = formLayout.form.fields;
        } catch (e) {
            console.warn('获取表单布局配置失败', e);
        }

        const childData = [];
        // 以下代码为全连接表单的字段权限配置代码
        result.Data.forEach(d => {
            if (d.groupFlag === groupFlag) { // 主表单
                const field = fields.find(f => f.field && f.field.indexOf('-') > 0 ? (f.field.indexOf('-' + d.formelFlag) > 0 || f.field.indexOf(d.formelFlag + '-') > 0) : f.field === d.formelFlag);
                if (field) {
                    if (!('hidden' in field)) {// 如果表单里定义了隐藏，那就以表单配置为准
                        field.hidden = d.display === "0" ? true : false;
                    }
                    if (!('edit' in field)) { // 不判断权限的话，就设置为可编辑
                        field.edit = checkAuth === false ? true : d.editable === "0" ? false : true;
                    }
                    if (!('require' in field)) {
                        field.require = d.notnull === "1" ? true : false;
                    }

                    if (field.field === formLayout.form.zwField) {
                        editorArg = field;
                    }
                    // else if (field.field === page.form.deptField) {
                    //     if (curNode.personType !== "0") { // 仅起草才能修改部门控件，因为该控件与路经有关
                    //         field.edit = false;
                    //     }
                    // }
                }
            } else { // 子表单
                // TODO:
                // 非起草、待办情况下，初始化为不可编辑
                if (curNode.personType !== '0' && curNode.personType !== '1') {
                    d.editable = '0';
                }
                childData.push(d);
            }
        });
        let parsedValueData = childData;
        if (typeof onGetChildFormData === 'function') {
            // 尝试执行回调，并获取新的valueData
            parsedValueData = onGetChildFormData(parsedValueData, SYS_GUID) || childData;
            if (typeof parsedValueData.then === 'function') {
                parsedValueData = (await parsedValueData) || childData;
            }
        }

        flowDispatcher.setState({
            fields, // 字段显隐配置 [{hidden, edit, require}]
            editorArg,
        });
        setFormConfigInit(true);
    };

    if (isFormInit && isFormConfigInit) {
        const formProps = pick(restProps, Object.keys(Form.propTypes));

        return (
            <Form {...formProps}>
                {children}
            </Form>
        );
    }
    return <span>表单加载中...</span>;
};

export default LinkFlow.withFlowContext(IBFlowForm, flowStateNames);
