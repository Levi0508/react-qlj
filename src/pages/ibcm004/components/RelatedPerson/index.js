import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Table, Button, message, Modal, Form, Input, Select, DatePicker, Radio, Divider, AutoComplete, Tooltip, Icon } from 'antd';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import moment from 'moment';
import services from '../../services/index';
import store from '@/store';
import useFilePreviewWindow from '@/hooks/useFilePreviewWindow';

const { Option } = Select;
const { TextArea } = Input;

// ========== 可拖拽表头组件 ==========
const ResizeableTitle = (props) => {
    const { onResize, width, ...restProps } = props;

    if (!width) {
        return <th {...restProps} />;
    }

    return (
        <Resizable
            width={width}
            height={0}
            onResize={onResize}
            draggableOpts={{ enableUserSelectHack: false }}
        >
            <th {...restProps} />
        </Resizable>
    );
};

function RelatedPerson({
    title,
    id,
    relatedType,
    relatedInfo = [],
    attachments = [],
    dictData,
    clientId,
    editable = false,
    tiid,
    piid,
    onUpdate,
    form, // 从Form.create()获取的form实例
    attachmentUpdateTime = 0,
    isSpecial = '0', // 反洗钱特殊情况：'1'是，'0'否
    curNode = {} // 当前节点信息
}) {
    // 是否政府部门状态（用于判断是否跳过某些字段校验）
    const [isGovernmentDept, setIsGovernmentDept] = useState('0');

    // 附件表格列宽（可拖拽调整）
    const [attachmentColumnWidths, setAttachmentColumnWidths] = useState({
        name: 200,
        extension: 120,
        createBy: 150,
        createTime: 180,
        action: 120
    });

    const handleAttachmentColumnResize = (columnKey) => (e, { size }) => {
        setAttachmentColumnWidths(prev => ({
            ...prev,
            [columnKey]: size.width
        }));
    };

    const attachmentTableComponents = {
        header: {
            cell: ResizeableTitle,
        },
    };

    // 证件号码校验提示状态（已移除，校验逻辑已统一到baseActions.js中）
    // const [idNoError, setIdNoError] = useState('');

    // 校验证件号码 - 用于表单提交校验（自然人）
    const validateIdNoForFormGr = (rule, value, callback) => {
        const idType = form.getFieldValue('id_type');
        
        // 必填校验
        if (isFieldRequired('id_no')) {
            if (!value) {
                callback('请输入证件号码');
                return;
            }
        }
        
        // 格式校验（身份证和营业执照）
        if (value && idType) {
            // 身份证格式校验
            if (idType === '1') {
                const idCardRegex = /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
                if (!idCardRegex.test(value)) {
                    callback('请输入正确的证件号码');
                    return;
                }
            }
            // 营业执照格式校验
            else if (idType === '3') {
                const businessLicenseRegex = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
                if (!businessLicenseRegex.test(value)) {
                    callback('请输入正确的证件号码');
                    return;
                }
            }
        }
        
        callback();
    };

    // 校验证件号码 - 用于表单提交校验（法人/机构）
    const validateIdNoForFormJg = (rule, value, callback) => {
        const idType = form.getFieldValue('id_type');
        
        // 必填校验
        if (isFieldRequired('id_no')) {
            if (!value) {
                callback('请输入证照号码');
                return;
            }
        }
        
        // 格式校验（身份证和营业执照）
        if (value && idType) {
            // 身份证格式校验
            if (idType === '1') {
                const idCardRegex = /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
                if (!idCardRegex.test(value)) {
                    callback('请输入正确的证件号码');
                    return;
                }
            }
            // 营业执照格式校验
            else if (idType === '3') {
                const businessLicenseRegex = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
                if (!businessLicenseRegex.test(value)) {
                    callback('请输入正确的证件号码');
                    return;
                }
            }
        }
        
        callback();
    };

    // 根据反洗钱特殊情况动态返回字段是否必填
    const isFieldRequired = (fieldName) => {
        // 如果反洗钱特殊情况为"是"（is_special === '1'），只有姓名必填
        if (isSpecial === '1') {
            return fieldName === 'related_name';
        }

        // 受益所有人特有逻辑：当受益所有人类型为A1、A2、B1、D1时，股权/表决权比例必填，其他情况不必填
        if (fieldName === 'shareholding_ratio' && relatedType === '5') {
            const requiredTypes = ['A1', 'A2', 'B1', 'D1'];
            return requiredTypes.includes(beneficiaryType);
        }

        // 如果反洗钱特殊情况为"否"（is_special === '0'）
        // 且是否政府部门为"是"（is_government_dept === '1'），则跳过以下字段校验：
        // 证件类型、证件号码、证件有效期起始、证件有效期截止、国家或地区
        // 注意: isGovernmentDept 需要从表单中获取最新值
        const currentIsGovernmentDept = form.getFieldValue('is_government_dept') || isGovernmentDept;
        if (currentIsGovernmentDept === '1') {
            const skipFields = ['id_type', 'id_no', 'id_begindate', 'id_enddate', 'nationality'];
            if (skipFields.includes(fieldName)) {
                return false;
            }
        }

        // 其他情况所有字段都必填
        return true;
    };

    // 格式化数据字典显示
    const formatDictMap = (dictType, key) => {
        const dict = dictData[dictType] || [];
        const item = dict.find(item => item.k === key);
        return item ? item.v : '-';
    };

    // 响应附件刷新事件

    // 重新加载所有关联人信息的函数
    const reloadAllRelatedInfo = async (operationType, relatedName) => {
        try {
            // 重新加载所有类型的关联人信息（relatedType从1到5）
            const relatedTypes = ['1', '2', '3', '4', '5'];
            const typeKeys = ['legalRep', 'controllingShareholder', 'actualController', 'authorizedRep', 'beneficialOwner'];

            const promises = relatedTypes.map(type =>
                services.selectRelatedInfo({
                    clientId: clientId,
                    relatedType: type,
                    dataType: '1' //1-正式 0-草稿 能在流程中发起审核的一定是正式客户
                }).then(response => {
                    if (response && response.success && response.data) {
                        const data = Array.isArray(response.data) ? response.data : JSON.parse(response.data || '[]');
                        return {
                            relatedType: type,
                            data: data
                        };
                    }
                    return {
                        relatedType: type,
                        data: []
                    };
                }).catch(error => {
                    console.error(`加载关联人类型${type}失败:`, error);
                    return {
                        relatedType: type,
                        data: []
                    };
                })
            );

            const results = await Promise.all(promises);

            // 构建完整的数据对象并进行字段映射
            const allRelatedInfo = {};
            results.forEach((result, index) => {
                // 添加字段名映射，将驼峰式转换为下划线式
                const mappedData = result.data.map(item => ({
                        address: item.address,
                        beneficiary: item.beneficiary,
                        birthday: item.birthday,
                        client_id: item.clientId,
                        create_time: item.createTime,
                        create_user: item.createUser,
                        id_begindate: item.idBegindate,
                        id_enddate: item.idEnddate,
                        id_no: item.idNo,
                        id_type: item.idType,
                        is_government_dept: item.isGovernmentDept || item.isGovermentDept,
                        nationality: item.nationality,
                        object_id: item.objectId,
                        organ_flag: item.organFlag,
                        related_id: item.relatedId,
                        related_name: item.relatedName,
                        related_type: item.relatedType,
                        shareholding_ratio: item.shareholdingRatio,
                        update_time: item.updateTime,
                        update_user: item.updateUser,
                        data_status: item.dataStatus,
                        mobno1: item.mobno1
                    }));
                allRelatedInfo[typeKeys[index]] = mappedData;
            });

            if (typeof onUpdate === 'function') {
                onUpdate({
                    type: operationType,
                    relatedType: relatedType,
                    relatedName: relatedName,
                    allRelatedInfo: allRelatedInfo,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('重新加载所有关联人信息失败:', error);
            // 即使失败也通知父组件
            if (typeof onUpdate === 'function') {
                onUpdate({
                    type: operationType,
                    relatedType: relatedType,
                    relatedName: relatedName,
                    timestamp: Date.now()
                });
            }
        }
    };

    // 编辑弹窗相关状态
    const [editVisible, setEditVisible] = useState(false);
    const [editMode, setEditMode] = useState('add'); // 'add' 或 'edit'
    const [currentRecord, setCurrentRecord] = useState({});
    const [organFlag, setOrganFlag] = useState('1'); // '1'法人 '0'自然人
    const [tempBatchList, setTempBatchList] = useState([]); // 存储编辑时的完整 batchList 数据
    const [relatedNameOptions, setRelatedNameOptions] = useState([]); // 姓名/主体名称下拉选项
    const [relatedNameLoading, setRelatedNameLoading] = useState(false); // 下拉框加载状态
    const [allRelatedEntities, setAllRelatedEntities] = useState([]); // 存储所有关联主体数据，用于选中后填充
    const [beneficiaryType, setBeneficiaryType] = useState(''); // 受益所有人类型

    // 加载关联主体下拉选项
    const loadRelatedNameOptions = async (organFlagValue) => {
        setRelatedNameLoading(true);
        try {
            const response = await services.selectOrganEntity({
                clientId: clientId,
                organFlag: organFlagValue
            });

            if (response && response.success && response.data) {
                const items = Array.isArray(response.data) ? response.data : JSON.parse(response.data || '[]');

                // 去重：按relatedName去重
                const uniqueMap = new Map();
                items.forEach(item => {
                    if (!uniqueMap.has(item.relatedName)) {
                        uniqueMap.set(item.relatedName, item);
                    }
                });

                const uniqueItems = Array.from(uniqueMap.values());
                setAllRelatedEntities(uniqueItems);
                setRelatedNameOptions(uniqueItems.map(item => ({
                    key: item.relatedName,
                    value: item.relatedName,
                    label: item.relatedName
                })));
            }
        } catch (error) {
            console.error('加载关联主体选项失败:', error);
            setRelatedNameOptions([]);
            setAllRelatedEntities([]);
        } finally {
            setRelatedNameLoading(false);
        }
    };

    // 处理姓名/主体名称下拉框选择变化
    const handleRelatedNameChange = (value) => {
        const selectedEntity = allRelatedEntities.find(item => item.relatedName === value);
        if (selectedEntity) {
            const formValues = {
                id_type: selectedEntity.idType || '',
                id_no: selectedEntity.idNo || '',
                mobno1: selectedEntity.mobno1 || '',
                id_begindate: selectedEntity.idBegindate ? moment(selectedEntity.idBegindate) : null,
                id_enddate: selectedEntity.idEnddate ? moment(selectedEntity.idEnddate) : null,
                nationality: selectedEntity.nationality || '',
                is_government_dept: selectedEntity.isGovernmentDept || '0',
                birthday: selectedEntity.birthday ? moment(selectedEntity.birthday) : null
            };

            // 受益所有人特有字段
            if (relatedType === '5') {
                formValues.beneficiary = selectedEntity.beneficiary || '';
                formValues.shareholding_ratio = selectedEntity.shareholdingRatio || '';
                formValues.address = selectedEntity.address || '';
            }

            form.setFieldsValue(formValues);
        }
    };

    // 处理添加
    const handleAdd = async () => {
        setCurrentRecord({});
        setEditMode('add');
        setRelatedNameOptions([]);
        setAllRelatedEntities([]);
        setEditVisible(true);
        setIsGovernmentDept('0'); // 重置是否政府部门状态
        setBeneficiaryType(''); // 重置受益所有人类型

        // 根据关联类型确定organFlag
        // 法定代表人(1)、授权代表人(4)、受益所有人(5) 只能是自然人
        // 控股股东(2)、实际控制人(3) 可以是法人或自然人，默认法人
        let defaultOrganFlag = '1';
        if (relatedType === '1' || relatedType === '4' || relatedType === '5') {
            defaultOrganFlag = '0'; // 自然人
        }
        setOrganFlag(defaultOrganFlag);
        setTempBatchList([]);

        // 加载关联主体选项
        await loadRelatedNameOptions(defaultOrganFlag);

        // 延迟重置表单，确保弹窗和表单已渲染
        setTimeout(() => {
            if (form && form.resetFields) {
                form.resetFields();
                // 设置默认值
                form.setFieldsValue({
                    organ_flag: defaultOrganFlag,
                    is_government_dept: '0'
                });
            }
        }, 300);
    };

    // 处理编辑
    const handleEdit = async (record) => {
        try {
            // 设置初始状态
            setCurrentRecord(record || {});
            setEditMode('edit');
            const recordOrganFlag = record?.organ_flag || record?.organFlag || '0';
            setOrganFlag(recordOrganFlag);
            setRelatedNameOptions([]);
            setAllRelatedEntities([]);
            setEditVisible(true);
            // 设置是否政府部门状态（用于校验逻辑）
            setIsGovernmentDept(record?.is_government_dept || record?.isGovernmentDept || '0');
            // 设置受益所有人类型（用于字段显示和校验逻辑）
            setBeneficiaryType(record?.beneficiary || '');

            // 先加载下拉选项数据
            await loadRelatedNameOptions(recordOrganFlag);

            // 调用接口查询该关联人的所有关联信息
            const response = await services.selectOrganEntity({
                clientId: clientId,
                organFlag: recordOrganFlag,
                relatedName: record.related_name || record.relatedName
            });

            if (response && response.success && response.data) {
                const items = Array.isArray(response.data) ? response.data : JSON.parse(response.data || '[]');
                const batchList = items.map(pItem => {
                    const mappedItem = {
                        clientId: pItem.clientId,
                        relatedId: pItem.relatedId,
                        relatedType: pItem.relatedType,
                        relatedName: pItem.relatedName,
                        organFlag: (pItem.relatedType == '2' || pItem.relatedType == '3') ? pItem.organFlag : '0',//法定代表人、授权代表人、受益所有人 只能是自然人 无需选类型
                        idType: pItem.idType,
                        idNo: pItem.idNo,
                        mobno1: pItem.mobno1,
                        idBegindate: pItem.idBegindate,
                        idEnddate: pItem.idEnddate,
                        nationality: pItem.nationality,
                        birthday: pItem.birthday,
                        isGovernmentDept: pItem.isGovernmentDept,
                        dataStatus: pItem.dataStatus,
                        objectId: pItem.objectId,
                        beneficiary: pItem.beneficiary,
                        shareholdingRatio: pItem.shareholdingRatio,
                        address: pItem.address
                    };
                    return mappedItem;
                });

                setTempBatchList(batchList);

                // 延迟设置表单值，确保弹窗和表单已渲染
                setTimeout(() => {
                    if (form && form.setFieldsValue) {
                        const formValues = {
                                organ_flag: recordOrganFlag,
                                related_name: record?.related_name || record?.relatedName || '',
                                id_type: record?.id_type || record?.idType || '',
                                id_no: record?.id_no || record?.idNo || '',
                                mobno1: record?.mobno1 || '',
                                id_begindate: (record?.id_begindate || record?.idBegindate) ? moment(record?.id_begindate || record?.idBegindate) : null,
                                id_enddate: (record?.id_enddate || record?.idEnddate) ? moment(record?.id_enddate || record?.idEnddate) : null,
                                nationality: record?.nationality || '',
                                is_government_dept: record?.is_government_dept || record?.isGovernmentDept || '0',
                                birthday: (record?.birthday) ? moment(record?.birthday) : null,
                                beneficiary: record?.beneficiary || '',
                                shareholding_ratio: record?.shareholding_ratio || record?.shareholdingRatio || '',
                                address: record?.address || ''
                            };
                            form.setFieldsValue(formValues);
                    }
                }, 100);
            }

        } catch (error) {
            console.error('查询关联人信息失败:', error);
        }
    };

    // 处理删除
    const handleDelete = (record) => {

        Modal.confirm({
            title: '确认删除',
            content: `确定要删除关联人"${record.relatedName || record.related_name}"吗？`,
            okText: '确定',
            cancelText: '取消',
            onOk: async () => {
                try {
                    // 调用删除接口
                    const response = await services.deleteOrganEntity({
                        clientId: clientId,
                        organFlag: record.organFlag || record.organ_flag,
                        relatedType: relatedType,
                        relatedId: record.relatedId || record.related_id,
                        dataStatus: record.dataStatus || record.data_status || '0'
                    });

                    if (response && response.success) {
                        // 检查是否真正删除了数据（影响行数大于0）
                        const affectedRows = parseInt(response.data || '0');
                        if (affectedRows > 0) {
                            message.success('删除成功');

                            // 调用reloadAllRelatedInfo重新加载所有关联人信息
                            await reloadAllRelatedInfo('delete', record.relatedName || record.related_name);
                        } else {
                            message.warning('未找到要删除的记录或删除失败');
                        }
                    } else {
                        message.error(response?.message || '删除失败');
                    }
                } catch (error) {
                    console.error('删除失败:', error);
                    message.error('删除失败：' + (error.message || '未知错误'));
                }
            }
        });
    };

    // 保存关联人信息
    const handleSave = async (submitType = '2') => {
        if (!form) return;

        try {
            const values = await form.validateFields();

            const baseParams = {
                clientId: clientId,
                relatedName: values.related_name,
                organFlag: values.organ_flag || '0',
                idType: values.id_type,
                idNo: values.id_no,
                mobno1: values.mobno1,
                idBegindate: values.id_begindate ? values.id_begindate.format('YYYY-MM-DD') : '',
                idEnddate: values.id_enddate ? values.id_enddate.format('YYYY-MM-DD') : '',
                nationality: values.nationality,
                birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : '',
                isGovernmentDept: values.is_government_dept || '0',
                dataStatus: '0'
            };

            let beneficiaryParams = {}
            if (relatedType === '5') {
                beneficiaryParams.beneficiary = values.beneficiary;
                beneficiaryParams.shareholdingRatio = values.shareholding_ratio;
                beneficiaryParams.address = values.address;
            }

            // 新增逻辑
            if (editMode === 'add') {
                // 先查询是否已存在相同的关联人
                const checkResponse = await services.selectOrganEntity({
                    clientId: clientId,
                    organFlag: baseParams.organFlag,
                    relatedName: baseParams.relatedName
                });

                if (checkResponse && checkResponse.success && checkResponse.data) {
                    const items = Array.isArray(checkResponse.data) ? checkResponse.data : JSON.parse(checkResponse.data || '[]');
                    const hasDuplicate = items.some(item =>
                        String(item.relatedName) === String(baseParams.relatedName) &&
                        String(item.relatedType) === String(relatedType)
                    );

                    if (hasDuplicate) {
                        message.error(`已存在主体名称为"${baseParams.relatedName}"的【${title}】信息，请勿重复添加！`);
                        return;
                    }
                }

                // 获取当前登录用户信息
                const userInfo = store.getModelState('user');
                const createUser = userInfo?.username || userInfo?.userId || '';
                // 构建保存数据
                const saveData = { ...baseParams };
                if(relatedType === '5'){
                    saveData.beneficiary = beneficiaryParams.beneficiary;
                    saveData.shareholdingRatio = beneficiaryParams.shareholdingRatio;
                    saveData.address = beneficiaryParams.address;
                }
                saveData.relatedType = relatedType;
                saveData.createUser = createUser; // 添加创建用户字段
                saveData.updateUser = createUser;

                // 调用保存接口 - 根据后端接口文档，直接传递对象数组
                const saveResponse = await services.saveOrganEntity([saveData]);
                if (saveResponse && saveResponse.success) {
                    // 检查是否真正保存了数据（影响行数大于0）
                    const affectedRows = parseInt(saveResponse.data || '0');
                    if (affectedRows > 0) {
                        message.success('添加成功');

                        // 先处理弹窗状态
                        if (submitType === '2') {
                            // 提交 - 关闭弹窗
                            setEditVisible(false);
                            setCurrentRecord({});
                            setTempBatchList([]);
                        } else {
                            // 提交并录入下一条 - 清空表单准备录入下一条
                            setCurrentRecord({});
                            setTempBatchList([]);
                            setRelatedNameOptions([]);
                            setAllRelatedEntities([]);

                            // 根据关联类型确定默认organFlag
                            let defaultOrganFlag = '1';
                            if (relatedType === '1' || relatedType === '4' || relatedType === '5') {
                                defaultOrganFlag = '0';
                            }
                            setOrganFlag(defaultOrganFlag);

                            // 重新加载下拉选项
                            await loadRelatedNameOptions(defaultOrganFlag);

                            // 重置表单并设置默认值
                            setTimeout(() => {
                                if (form && form.resetFields) {
                                    form.resetFields();
                                    form.setFieldsValue({
                                        organ_flag: defaultOrganFlag,
                                        is_government_dept: '0'
                                    });
                                }
                            }, 100);
                        }

                        // 调用selectRelatedInfo接口重新加载数据
                        try {
                            const selectResponse = await services.selectRelatedInfo({
                                clientId: clientId,
                                relatedType: relatedType,
                                dataType: '1'
                            });

                            if (selectResponse && selectResponse.success && selectResponse.data) {
                                // 添加字段名映射，将驼峰式转换为下划线式
                                const rawData = Array.isArray(selectResponse.data) ? selectResponse.data : JSON.parse(selectResponse.data || '[]');
                                const mappedData = rawData.map(item => ({
                                    address: item.address,
                                    beneficiary: item.beneficiary,
                                    birthday: item.birthday,
                                    client_id: item.clientId,
                                    create_time: item.createTime,
                                    create_user: item.createUser,
                                    id_begindate: item.idBegindate,
                                    id_enddate: item.idEnddate,
                                    id_no: item.idNo,
                                    id_type: item.idType,
                                    is_government_dept: item.isGovernmentDept || item.isGovermentDept,
                                    nationality: item.nationality,
                                    object_id: item.objectId,
                                    organ_flag: item.organFlag,
                                    related_id: item.relatedId,
                                    related_name: item.relatedName,
                                    related_type: item.relatedType,
                                    shareholding_ratio: item.shareholdingRatio,
                                    update_time: item.updateTime,
                                    update_user: item.updateUser,
                                    data_status: item.dataStatus,
                                    mobno1: item.mobno1
                                }));

                                // 将数据传递给父组件
                                setTimeout(() => {
                                    if (typeof onUpdate === 'function') {
                                        onUpdate({
                                            type: 'add',
                                            relatedType: relatedType,
                                            relatedName: baseParams.relatedName,
                                            data: mappedData,
                                            timestamp: Date.now()
                                        });
                                    }
                                }, 100);
                            }
                        } catch (error) {
                            console.error('调用selectRelatedInfo失败:', error);
                            // 即使selectRelatedInfo失败，也通知父组件刷新
                            setTimeout(() => {
                                if (typeof onUpdate === 'function') {
                                    onUpdate({
                                        type: 'add',
                                        relatedType: relatedType,
                                        relatedName: baseParams.relatedName,
                                        timestamp: Date.now()
                                    });
                                }
                            }, 100);
                        }
                    } else {
                        message.warning('保存成功但未影响任何记录');
                    }
                } else {
                    message.error(saveResponse?.message || '添加失败');
                }
            }
            // 编辑逻辑
            else {
                if (tempBatchList.length === 0) {
                    message.error('编辑数据异常，未找到关联信息，请重新打开弹窗。');
                    return;
                }

                // 更新 batchList 中的数据
                const updatedBatchList = tempBatchList.map(item => {
                    const itemType = String(item.relatedType);
                    const updatedItem = { ...item };
                    updatedItem.idType = baseParams.idType;
                    updatedItem.idNo = baseParams.idNo;
                    // mobno1 是法定代表人/授权代表人特有字段，只对这两种类型用表单值覆盖，其他类型保持原值
                    if (relatedType === '1' || relatedType === '4') {
                        updatedItem.mobno1 = baseParams.mobno1;
                    }
                    updatedItem.idBegindate = baseParams.idBegindate;
                    updatedItem.idEnddate = baseParams.idEnddate;
                    updatedItem.nationality = baseParams.nationality;
                    updatedItem.birthday = baseParams.birthday;
                    updatedItem.isGovernmentDept = baseParams.isGovernmentDept;
                    updatedItem.dataStatus = baseParams.dataStatus;
                    // 受益所有人特有字段
                    if (itemType === '5' && relatedType === '5') {
                        updatedItem.beneficiary = beneficiaryParams.beneficiary;
                        updatedItem.shareholdingRatio = beneficiaryParams.shareholdingRatio;
                        updatedItem.address = beneficiaryParams.address;
                    }
                    return updatedItem;
                });

                // 获取当前登录用户信息
                const userInfo = store.getModelState('user');
                const createUser = userInfo?.username || userInfo?.userId || '';

                // 调用更新接口 - 根据后端接口文档调整参数格式
                const updateResponse = await services.updateOrganEntity({
                    clientId: clientId,
                    relatedName: baseParams.relatedName,
                    organEntityList: updatedBatchList,
                    createUser: createUser
                });
                if (updateResponse && updateResponse.success) {
                    // 检查是否真正更新了数据（影响行数大于0）
                    const affectedRows = parseInt(updateResponse.data || '0');
                    if (affectedRows > 0) {
                        message.success('修改成功');

                        // 先关闭弹窗
                        if (submitType === '2') {
                            setEditVisible(false);
                            setCurrentRecord({});
                            setTempBatchList([]);
                        }

                        // 调用reloadAllRelatedInfo重新加载所有关联人信息
                        await reloadAllRelatedInfo('edit', baseParams.relatedName);
                    } else {
                        message.warning('更新成功但未影响任何记录');
                    }
                } else {
                    message.error(updateResponse?.message || '修改失败');
                }
            }
        } catch (error) {
            if (error.errorFields) {
                message.error('请检查表单填写是否完整');
            }
        }
    };

    // 取消编辑
    const handleCancel = () => {
        setEditVisible(false);
        setIsGovernmentDept('0'); // 重置是否政府部门状态
        setBeneficiaryType(''); // 重置受益所有人类型
        // 重置表单
        if (form) {
            form.resetFields();
        }
        // 延迟清理状态
        setTimeout(() => {
            setCurrentRecord({});
            setTempBatchList([]);
        }, 300);
    };

    // 预览相关状态
    const { previewLoading, handlePreview: openPreviewInWindow } = useFilePreviewWindow();

    // 下载附件
    const handleDownload = async (file) => {
        if (!file || !file.id) {
            message.error('文件信息不完整，无法下载');
            return;
        }

        // 显示加载状态
        const hideLoading = message.loading(`正在下载: ${file.name}.${file.extension}`, 0);

        try {
            // 构建完整文件名
            const fullFileName = file.extension
                ? `${file.name}.${file.extension}`
                : file.name;

            // 使用服务中的下载方法，传递文件名和ID
            const result = await services.downloadFile(fullFileName, file.id);
            hideLoading();

            if (result && result.success) {
                message.success(`下载开始: ${fullFileName}`);
            } else {
                message.success(`下载已开始: ${fullFileName}`);
            }
        } catch (error) {
            hideLoading();
            message.error(`下载失败: ${error.message || '未知错误'}`);
        }
    };

    // 预览附件（在独立的浏览器窗口打开）
    const handlePreview = (file) => {
        openPreviewInWindow(file, async (f) => {
            const fileName = `${f.name}.${f.extension}`;
            const result = await services.previewFile({
                id: f.id,
                clientId: clientId,
                fileName: fileName,
                extension: f.extension
            });
            if (result && result.success && result.data && result.data.previewUrl) {
                return result.data.previewUrl;
            }
            return null;
        });
    };

    // 监听organFlag变化，加载下拉选项数据
    useEffect(() => {
        // 当organFlag变化且弹窗可见时，加载对应的下拉选项
        if (editVisible && editMode === 'add') {
            loadRelatedNameOptions(organFlag);
        }
    }, [organFlag, editVisible]);

    // 注入样式：让附件表格单元格支持换行，防止antd默认white-space:nowrap导致内容溢出
    useEffect(() => {
        const styleId = 'related-person-attachment-table-style-ibcm004';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                .related-person-attachment-table .ant-table-tbody > tr > td {
                    white-space: normal !important;
                    word-break: break-all;
                }
                .related-person-attachment-table .ant-table-thead > tr > th {
                    white-space: normal !important;
                    position: relative;
                }
                .related-person-attachment-table .react-resizable {
                    position: relative;
                    background-clip: padding-box;
                }
                .related-person-attachment-table .react-resizable-handle {
                    position: absolute;
                    right: -5px;
                    bottom: 0;
                    z-index: 1;
                    width: 10px;
                    height: 100%;
                    cursor: col-resize;
                    background: transparent;
                }
                .related-person-attachment-table .react-resizable-handle::after {
                    content: '';
                    position: absolute;
                    right: 4px;
                    top: 20%;
                    height: 60%;
                    width: 2px;
                    background: #d9d9d9;
                }
            `;
            document.head.appendChild(style);
        }
        return () => {
        };
    }, []);

    //附件表格列定义（支持拖拽调整列宽）
    const attachmentColumns = [
        {
            title: '附件名称',
            dataIndex: 'name',
            key: 'name',
            width: attachmentColumnWidths.name || 200,
            sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
            render: (text) => (
                <Tooltip title={text} placement="topLeft">
                    <span style={{ whiteSpace: 'normal', wordBreak: 'break-all', display: 'inline-block' }}>{text || '-'}</span>
                </Tooltip>
            ),
            onHeaderCell: (column) => ({
                width: column.width,
                onResize: handleAttachmentColumnResize('name'),
            }),
        },
        {
            title: '附件类型',
            dataIndex: 'extension',
            key: 'extension',
            width: attachmentColumnWidths.extension || 120,
            sorter: (a, b) => (a.extension || '').localeCompare(b.extension || ''),
            render: (text) => text || '-',
            onHeaderCell: (column) => ({
                width: column.width,
                onResize: handleAttachmentColumnResize('extension'),
            }),
        },
        {
            title: '上传人',
            dataIndex: 'createBy',
            key: 'createBy',
            width: attachmentColumnWidths.createBy || 150,
            ellipsis: true,
            sorter: (a, b) => (a.createBy || '').localeCompare(b.createBy || ''),
            render: (text) => text || '-',
            onHeaderCell: (column) => ({
                width: column.width,
                onResize: handleAttachmentColumnResize('createBy'),
            }),
        },
        {
            title: '上传时间',
            dataIndex: 'createTime',
            key: 'createTime',
            width: attachmentColumnWidths.createTime || 180,
            ellipsis: true,
            sorter: (a, b) => (a.createTime || '').localeCompare(b.createTime || ''),
            render: (text) => text || '-',
            onHeaderCell: (column) => ({
                width: column.width,
                onResize: handleAttachmentColumnResize('createTime'),
            }),
        },
        {
            title: '操作',
            key: 'action',
            width: attachmentColumnWidths.action || 120,
            render: (_, record) => (
                <div style={{ display: 'flex', flexWrap: 'nowrap', overflow: 'hidden' }}>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => handleDownload(record)}
                        style={{ padding: '0 4px', color: '#1890ff', whiteSpace: 'nowrap' }}
                    >
                        下载
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => handlePreview(record)}
                        style={{ padding: '0 4px', color: '#1890ff', whiteSpace: 'nowrap' }}
                        loading={previewLoading[record.id] || false}
                    >
                        预览
                    </Button>
                </div>
            ),
            onHeaderCell: (column) => ({
                width: column.width,
                onResize: handleAttachmentColumnResize('action'),
            }),
        }
    ];

    if (relatedInfo.length === 0 && !editable) {
        return (
            <Card className="box-card" id={id} title={title}>
                <div style={{ color: '#8d8b8b', textAlign: 'center', padding: '40px 0' }}>
                    暂无数据
                </div>
            </Card>
        );
    }

    return (
        <Card
            className="box-card"
            id={id}
            title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{title}</span>
                    {/* 对于法定代表人和授权代表人，只能有一个，如果有数据则隐藏添加按钮 */}
                    {editable && (
                        (relatedType === '1' || relatedType === '4') && relatedInfo.length > 0 ? null : (
                            <Button type="primary" size="small" onClick={handleAdd}>
                                添加
                            </Button>
                        )
                    )}
                </div>
            }
        >
            {relatedInfo.map((item) => (
                <div key={item.related_id}>
                    <div className="client-info" style={{
                        padding: '16px',
                        background: '#fafafa',
                        borderRadius: '4px',
                        marginBottom: '12px'
                    }}>
                        <div className="client-title" style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#303133',
                            marginBottom: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span>{item.related_name || '-'}</span>
                                <Tag
                                    color="green"
                                    style={{ marginLeft: '10px' }}
                                >
                                    {item.organ_flag === '0' ? '自然人' : '法人'}
                                </Tag>
                            </div>
                            {editable && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Button size="small" onClick={() => handleEdit(item)}>编辑</Button>
                                    <Button size="small" type="danger" onClick={() => handleDelete(item)}>删除</Button>
                                </div>
                            )}
                        </div>

                        <Row gutter={10} style={{ marginBottom: '8px' }}>
                            <Col span={8}>
                                <span style={{ color: '#909399', fontWeight: '500', marginRight: '8px' }}>
                                    {item.organ_flag === '1' ? '国家或地区:' : '国籍:'}
                                </span>
                                {formatDictMap('nationality_list', item.nationality) || '-'}
                            </Col>
                            <Col span={8}>
                                <span style={{ color: '#909399', fontWeight: '500', marginRight: '8px' }}>
                                    证件类型:
                                </span>
                                {formatDictMap('id_type_list', item.id_type) || '-'}
                            </Col>
                            <Col span={8}>
                                <span style={{ color: '#909399', fontWeight: '500', marginRight: '8px' }}>
                                    证件号码:
                                </span>
                                {item.idNo || item.id_no || '-'}
                            </Col>
                        </Row>


                        <Row gutter={10} style={{ marginBottom: '8px' }}>
                            <Col span={8}>
                                <span style={{ color: '#909399', fontWeight: '500', marginRight: '8px' }}>
                                    证件有效期起始:
                                </span>
                                {item.id_begindate || '-'}
                            </Col>
                            <Col span={8}>
                                <span style={{ color: '#909399', fontWeight: '500', marginRight: '8px' }}>
                                    证件有效期截止:
                                </span>
                                {item.id_enddate || '-'}
                            </Col>
                            {item.organ_flag === '1' ? (
                                <Col span={8}>
                                    <span style={{ color: '#909399', fontWeight: '500', marginRight: '8px' }}>
                                        是否政府部门:
                                    </span>
                                    {item.is_government_dept === '1' ? '是' : (item.is_government_dept === '0' ? '否' : '-')}
                                </Col>
                            ) : (
                                <Col span={8}>
                                    <span style={{ color: '#909399', fontWeight: '500', marginRight: '8px' }}>
                                        出生年月:
                                    </span>
                                    {item.birthday || '-'}
                                </Col>
                            )}
                        </Row>
                        {(relatedType === '1' || relatedType === '4') && (
                            <Row gutter={10} style={{ marginBottom: '8px' }}>
                                <Col span={8}>
                                    <span style={{ color: '#909399', fontWeight: '500', marginRight: '8px' }}>
                                        联系方式:
                                    </span>
                                    {item.mobno1 || '-'}
                                </Col>
                            </Row>
                        )}

                        {relatedType === '5' && (<Row gutter={10}>
                            <Col span={8}>
                                <span style={{ color: '#909399', fontWeight: '500', marginRight: '8px' }}>
                                    受益所有人类型:
                                </span>
                                {dictData.beneficiary_list?.find(b => b.k === item.beneficiary)?.v || item.beneficiary || '-'}
                            </Col>

                            <Col span={8}>
                                <span style={{ color: '#909399', fontWeight: '500', marginRight: '8px' }}>
                                    股权/表决权比例:
                                </span>
                                {item.shareholding_ratio ? `${item.shareholding_ratio}%` : '-'}
                            </Col>

                            <Col span={8}>
                                <span style={{ color: '#909399', fontWeight: '500', marginRight: '8px' }}>
                                    联系地址:
                                </span>
                                {item.address || '-'}
                            </Col>
                        </Row>)}
                    </div>
                </div>
            ))}

            {/* 附件信息 */}
            {
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                    <h3 style={{ marginBottom: '10px', fontSize: '14px', color: '#303133' }}>
                        附件信息&nbsp;
                        <Tooltip placement="right" title={
                            relatedType === '1' ? '请上传法定代表人身份证明文件的复印件' :
                            relatedType === '2' ? '请上传营业执照复印件（控股股东如为非自然人-公司）、控股股东身份证明文件的复印件（如为自然人）' :
                            relatedType === '3' ? '请上传营业执照复印件（实际控制人如为非自然人-公司）、实际控制人身份证明文件的复印件（如为自然人）' :
                            relatedType === '4' ? '请上传授权代表人身份证明文件的复印件、授权委托书（授权代表人非法代时适用）' :
                            relatedType === '5' ? '请上传受益所有人的身份证明文件的复印件；确认受益所有人的证明文件，包括但不限于股权架构图、公司章程、委托持股协议、一致行动协议、表决权差异安排协议、任命文件等；关于股权/表决权等比例计算的说明（如涉及比例）；在受益所有人信息查询管理系统（BOMIS系统）备案的信息截图（如有）。' :
                            ''
                        }>
                            <Icon type="question-circle" />
                        </Tooltip>
                    </h3>
                    <Table
                        dataSource={attachments}
                        columns={attachmentColumns}
                        components={attachmentTableComponents}
                        pagination={false}
                        size="small"
                        className="related-person-attachment-table"
                        scroll={{ x: 770 }}
                    />
                </div>
            }

            {/* 编辑/添加关联人弹窗 */}
            <Modal
                title={editMode === 'add' ? `添加${title}` : `编辑${title}`}
                visible={editVisible}
                onCancel={handleCancel}
                maskClosable={false}
                footer={(() => {
                    // 法定代表人和授权代表人只能有一个，不需要"提交并录入下一条"按钮
                    const isSinglePersonType = relatedType === '1' || relatedType === '4';

                    if (isSinglePersonType) {
                        return [
                            <Button key="cancel" onClick={handleCancel}>取消</Button>,
                            <Button key="submit2" type="primary" onClick={() => handleSave('2')}>
                                提交
                            </Button>
                        ];
                    } else {
                        return [
                            <Button key="cancel" onClick={handleCancel}>取消</Button>,
                            <Button key="submit" type="primary" onClick={() => handleSave('1')}>
                                提交并录入下一条
                            </Button>,
                            <Button key="submit2" type="primary" onClick={() => handleSave('2')}>
                                提交
                            </Button>
                        ];
                    }
                })()}
                width="70%"
            >
                <Form layout="vertical">
                    {/* 法定代表人、授权代表人、受益所有人 - 只能是自然人 */}
                    {relatedType === '1' || relatedType === '4' || relatedType === '5' ? (
                        <>
                            <Row gutter={20}>
                                <Col span={8}>
                                    <Form.Item label="姓名">
                                        {form.getFieldDecorator('related_name', {
                                            rules: [{ required: true, message: '请输入或选择姓名' }]
                                        })(
                                            <AutoComplete
                                                placeholder="请输入或选择姓名"
                                                dataSource={relatedNameOptions.map(item => item.label)}
                                                filterOption={(inputValue, option) =>
                                                    option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                                }
                                                loading={relatedNameLoading}
                                                onSelect={(value) => handleRelatedNameChange(value)}
                                                disabled={editMode === 'edit'}
                                                allowClear
                                            />
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label="出生年月">
                                        {form.getFieldDecorator('birthday', {
                                            rules: [{ required: isFieldRequired('birthday'), message: '请选择出生年月' }]
                                        })(
                                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label="国籍">
                                        {form.getFieldDecorator('nationality', {
                                            rules: [{ required: isFieldRequired('nationality'), message: '请选择国籍' }]
                                        })(
                                            <Select
                                                placeholder="请选择国籍"
                                                showSearch
                                                allowClear
                                                filterOption={(input, option) =>
                                                    option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                }
                                            >
                                                {dictData.nationality_list && dictData.nationality_list.map(item => (
                                                    <Option key={item.k} value={item.k}>{item.v}</Option>
                                                ))}
                                            </Select>
                                        )}
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={20}>
                                <Col span={8}>
                                    <Form.Item label="证件类型">
                                        {form.getFieldDecorator('id_type', {
                                            rules: [{ required: isFieldRequired('id_type'), message: '请选择证件类型' }]
                                        })(
                                            <Select
                                                placeholder="请选择证件类型"
                                                showSearch
                                                allowClear
                                                filterOption={(input, option) =>
                                                    option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                }
                                            >
                                                {dictData.id_type_gr_list && dictData.id_type_gr_list.map(item => (
                                                    <Option key={item.k} value={item.k}>{item.v}</Option>
                                                ))}
                                            </Select>
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label="证件号码" required={isFieldRequired('id_no')}>
                                        {form.getFieldDecorator('id_no', {
                                            rules: [{ validator: validateIdNoForFormGr }]
                                        })(
                                            <Input placeholder="请输入证件号码" />
                                        )}
                                    </Form.Item>
                                </Col>
                                {(relatedType === '1' || relatedType === '4') && (
                                    <Col span={8}>
                                        <Form.Item label="联系方式">
                                            {form.getFieldDecorator('mobno1', {
                                                rules: [{ required: isFieldRequired('mobno1'), message: '请输入联系方式' }]
                                            })(
                                                <Input placeholder="请输入联系方式" />
                                            )}
                                        </Form.Item>
                                    </Col>
                                )}
                            </Row>

                            <Row gutter={20}>
                                <Col span={8}>
                                    <Form.Item label="证件有效期起始">
                                        {form.getFieldDecorator('id_begindate', {
                                            rules: [{ required: isFieldRequired('id_begindate'), message: '请选择起始日期' }]
                                        })(
                                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label="证件有效期截止">
                                        {form.getFieldDecorator('id_enddate', {
                                            rules: [{ required: isFieldRequired('id_enddate'), message: '请选择截止日期' }]
                                        })(
                                            <DatePicker
                                                style={{ width: '100%' }}
                                                format="YYYY-MM-DD"
                                                renderExtraFooter={() => {
                                                    // 创建一个ref来存储DatePicker实例
                                                    let datePickerRef = null;

                                                    return (
                                                        <div style={{ padding: '8px', textAlign: 'center' }}>
                                                            <a
                                                                onClick={() => {
                                                                    const longTermDate = moment('2100-12-31');
                                                                    form.setFieldsValue({
                                                                        id_enddate: longTermDate
                                                                    });
                                                                    // 手动触发change事件，确保表单验证
                                                                    form.validateFields(['id_enddate']);

                                                                    // 方法1：尝试关闭弹窗 - 查找antd的日历弹窗并模拟点击外部
                                                                    const calendarPanel = document.querySelector('.ant-calendar-picker-container');
                                                                    if (calendarPanel) {
                                                                        // 模拟点击弹窗外部来关闭
                                                                        const event = new MouseEvent('mousedown', {
                                                                            view: window,
                                                                            bubbles: true,
                                                                            cancelable: true
                                                                        });
                                                                        document.body.dispatchEvent(event);
                                                                    }

                                                                    // 方法2：查找并关闭所有打开的DatePicker
                                                                    // const datePickerInputs = document.querySelectorAll('.ant-calendar-picker-input');
                                                                    // datePickerInputs.forEach(input => {
                                                                    //     if (input.classList.contains('ant-calendar-picker-input-active')) {
                                                                    //         input.blur();
                                                                    //     }
                                                                    // });
                                                                }}
                                                                style={{ margin: '0 8px', color: '#0962c1', cursor: 'pointer' }}
                                                            >
                                                                长期
                                                            </a>
                                                        </div>
                                                    );
                                                }}
                                            />
                                        )}
                                    </Form.Item>
                                </Col>
                            </Row>


                            {/* 受益所有人特有字段 */}
                            {relatedType === '5' && (
                                <Row gutter={20}>
                                    <Col span={8}>
                                        <Form.Item label="受益所有人类型">
                                            {form.getFieldDecorator('beneficiary', {
                                                rules: [{ required: isFieldRequired('beneficiary'), message: '请选择受益所有人类型' }]
                                            })(
                                                <Select
                                                    placeholder="请选择受益所有人类型"
                                                    showSearch
                                                    allowClear
                                                    filterOption={(input, option) =>
                                                        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                    }
                                                    onChange={(value) => {
                                                        setBeneficiaryType(value || '');
                                                        // 当受益所有人类型不是A1、A2、B1、D1时,清空股权/表决权比例
                                                        const requiredTypes = ['A1', 'A2', 'B1', 'D1'];
                                                        if (!requiredTypes.includes(value)) {
                                                            form.setFieldsValue({
                                                                shareholding_ratio: undefined
                                                            });
                                                        }
                                                    }}
                                                >
                                                    {dictData.beneficiary_list && dictData.beneficiary_list.map(item => (
                                                        <Option key={item.k} value={item.k}>{item.v}</Option>
                                                    ))}
                                                </Select>
                                            )}
                                        </Form.Item>
                                    </Col>
                                    {/* 当受益所有人类型为A1、A2、B1、D1时显示股权/表决权比例字段 */}
                                    {['A1', 'A2', 'B1', 'D1'].includes(beneficiaryType) && (
                                        <Col span={8}>
                                            <Form.Item label="股权/表决权比例（%）">
                                                {form.getFieldDecorator('shareholding_ratio', {
                                                    rules: [
                                                        { required: isFieldRequired('shareholding_ratio'), message: '请输入股权比例' },
                                                        {
                                                            validator: (rule, value, callback) => {
                                                                if (value === '' || value === undefined || value === null) {
                                                                    callback();
                                                                    return;
                                                                }

                                                                const numValue = Number(value);
                                                                if (isNaN(numValue)) {
                                                                    callback('请输入有效的数字');
                                                                } else if (numValue < 0 || numValue > 100) {
                                                                    callback('请输入0-100的有效值');
                                                                } else {
                                                                    callback();
                                                                }
                                                            }
                                                        }
                                                    ]
                                                })(
                                                    <Input type="number" placeholder="请输入股权比例" />
                                                )}
                                            </Form.Item>
                                        </Col>
                                    )}
                                    <Col span={8}>
                                        <Form.Item label="联系地址">
                                            {form.getFieldDecorator('address',{rules: [{ required: isFieldRequired('address'), message: '请输入联系地址' }]})(
                                                <Input placeholder="请输入联系地址" />
                                            )}
                                        </Form.Item>
                                    </Col>
                                </Row>
                            )}
                        </>
                    ) : (
                        /* 控股股东、实际控制人 - 可以是法人或自然人 */
                        <>
                            <Row gutter={20}>
                                <Col span={8}>
                                    <Form.Item label={`${title}类型`}>
                                        {form.getFieldDecorator('organ_flag', {
                                            rules: [{ required: isFieldRequired('organ_flag'), message: '请选择类型' }],
                                            initialValue: '1'
                                        })(
                                            <Radio.Group
                                                onChange={(e) => {
                                                    setOrganFlag(e.target.value);
                                                    // 清空姓名、证件类型、证件号码字段（法人和自然人的证件类型不同）
                                                    form.setFieldsValue({
                                                        id_type: undefined,
                                                        id_no: undefined
                                                    });
                                                }}
                                                disabled={editMode === 'edit'}
                                            >
                                                <Radio value="1">法人</Radio>
                                                <Radio value="0">自然人</Radio>
                                            </Radio.Group>
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label={organFlag === '1' ? `${title}（法人）` : `${title}（自然人）`}>
                                        {form.getFieldDecorator('related_name', {
                                            rules: [{ required: true, message: '请输入或选择名称' }]
                                        })(
                                            <AutoComplete
                                                placeholder={`请输入或选择${organFlag === '1' ? '法人名称' : '姓名'}`}
                                                dataSource={relatedNameOptions.map(item => item.label)}
                                                filterOption={(inputValue, option) =>
                                                    option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                                }
                                                loading={relatedNameLoading}
                                                onSelect={(value) => handleRelatedNameChange(value)}
                                                disabled={editMode === 'edit'}
                                                allowClear
                                            />
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    {/* 法人显示是否政府部门 */}
                                    {organFlag === '1' && (
                                        <Form.Item label="是否政府部门">
                                            {form.getFieldDecorator('is_government_dept', {
                                                rules: [{ required: isFieldRequired('is_government_dept'), message: '请选择' }],
                                                initialValue: '0'
                                            })(
                                                <Radio.Group onChange={(e) => setIsGovernmentDept(e.target.value)}>
                                                    <Radio value="1">是</Radio>
                                                    <Radio value="0">否</Radio>
                                                </Radio.Group>
                                            )}
                                        </Form.Item>
                                    )}
                                    {/* 自然人显示出生年月 */}
                                    {organFlag === '0' && (
                                        <Form.Item label="出生年月">
                                            {form.getFieldDecorator('birthday', {
                                                rules: [{ required: isFieldRequired('birthday'), message: '请选择出生年月' }]
                                            })(
                                                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                                            )}
                                        </Form.Item>
                                    )}
                                </Col>
                            </Row>

                            <Row gutter={20}>
                                <Col span={8}>
                                    <Form.Item label="证照类型">
                                        {form.getFieldDecorator('id_type', {
                                            rules: [{ required: isFieldRequired('id_type'), message: '请选择证照类型' }]
                                        })(
                                            <Select
                                                placeholder="请选择证件类型"
                                                showSearch
                                                allowClear
                                                filterOption={(input, option) =>
                                                    option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                }
                                            >
                                                {dictData[organFlag === '1' ? 'id_type_jg_list' : 'id_type_gr_list']?.map(item => (
                                                    <Option key={item.k} value={item.k}>{item.v}</Option>
                                                ))}
                                            </Select>
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label="证照号码" required={isFieldRequired('id_no')}>
                                        {form.getFieldDecorator('id_no', {
                                            rules: [{ validator: validateIdNoForFormJg }]
                                        })(
                                            <Input placeholder="请输入证照号码" />
                                        )}
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={20}>
                                <Col span={8}>
                                    <Form.Item label="证件有效期起始">
                                        {form.getFieldDecorator('id_begindate', {
                                            rules: [{ required: isFieldRequired('id_begindate'), message: '请选择起始日期' }]
                                        })(
                                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label="证件有效期截止">
                                        {form.getFieldDecorator('id_enddate', {
                                            rules: [{ required: isFieldRequired('id_enddate'), message: '请选择截止日期' }]
                                        })(
                                            <DatePicker
                                                style={{ width: '100%' }}
                                                format="YYYY-MM-DD"
                                                renderExtraFooter={() => {
                                                    // 创建一个ref来存储DatePicker实例
                                                    let datePickerRef = null;

                                                    return (
                                                        <div style={{ padding: '8px', textAlign: 'center' }}>
                                                            <a
                                                                onClick={() => {
                                                                    const longTermDate = moment('2100-12-31');
                                                                    form.setFieldsValue({
                                                                        id_enddate: longTermDate
                                                                    });
                                                                    // 手动触发change事件，确保表单验证
                                                                    form.validateFields(['id_enddate']);

                                                                    // 方法1：尝试关闭弹窗 - 查找antd的日历弹窗并模拟点击外部
                                                                    const calendarPanel = document.querySelector('.ant-calendar-picker-container');
                                                                    if (calendarPanel) {
                                                                        // 模拟点击弹窗外部来关闭
                                                                        const event = new MouseEvent('mousedown', {
                                                                            view: window,
                                                                            bubbles: true,
                                                                            cancelable: true
                                                                        });
                                                                        document.body.dispatchEvent(event);
                                                                    }

                                                                    // 方法2：查找并关闭所有打开的DatePicker
                                                                    const datePickerInputs = document.querySelectorAll('.ant-calendar-picker-input');
                                                                    datePickerInputs.forEach(input => {
                                                                        if (input.classList.contains('ant-calendar-picker-input-active')) {
                                                                            input.blur();
                                                                        }
                                                                    });
                                                                }}
                                                                style={{ margin: '0 8px', color: '#0962c1', cursor: 'pointer' }}
                                                            >
                                                                长期
                                                            </a>
                                                        </div>
                                                    );
                                                }}
                                            />
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label={organFlag === '1' ? '国家或地区' : '国籍'}>
                                        {form.getFieldDecorator('nationality', {
                                            rules: [{ required: isFieldRequired('nationality'), message: `请选择${organFlag === '1' ? '国家或地区' : '国籍'}` }]
                                        })(
                                            <Select
                                                placeholder={`请选择${organFlag === '1' ? '国家或地区' : '国籍'}`}
                                                showSearch
                                                allowClear
                                                filterOption={(input, option) =>
                                                    option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                }
                                            >
                                                {dictData.nationality_list && dictData.nationality_list.map(item => (
                                                    <Option key={item.k} value={item.k}>{item.v}</Option>
                                                ))}
                                            </Select>
                                        )}
                                    </Form.Item>
                                </Col>
                            </Row>
                        </>
                    )}
                </Form>
            </Modal>

            {/* 修复Antd 3.x图标显示问题的样式 */}
            <style jsx>{`

                /* 修复Antd 3.x图标显示问题 */
                .ant-btn .anticon {
                    display: inline-block;
                    font-style: normal;
                    font-weight: normal;
                    line-height: 1;
                    text-rendering: optimizeLegibility;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    font-family: anticon !important;
                }

                .ant-btn-icon-only {
                    min-width: 32px;
                    height: 32px;
                    padding: 0;
                    font-size: 16px;
                    border-radius: 4px;
                    display: inline-flex !important;
                    align-items: center;
                    justify-content: center;
                    vertical-align: middle;
                }

                .ant-btn-icon-only .anticon {
                    font-size: 14px !important;
                    line-height: 1 !important;
                    margin: 0 !important;
                    display: block !important;
                }

                .ant-btn-circle.ant-btn-icon-only {
                    border-radius: 50%;
                    min-width: 32px;
                    width: 32px;
                    height: 32px;
                }

                .ant-btn-sm.ant-btn-icon-only {
                    min-width: 24px;
                    height: 24px;
                    font-size: 14px;
                }

                .ant-btn-sm.ant-btn-icon-only .anticon {
                    font-size: 12px !important;
                }

                /* 确保图标字体正确加载 */
                @font-face {
                    font-family: 'anticon';
                    src: url('https://at.alicdn.com/t/font_148784_v4ggb6wrjmkotj4i.eot');
                    src: url('https://at.alicdn.com/t/font_148784_v4ggb6wrjmkotj4i.eot?#iefix') format('embedded-opentype'),
                         url('https://at.alicdn.com/t/font_148784_v4ggb6wrjmkotj4i.woff2') format('woff2'),
                         url('https://at.alicdn.com/t/font_148784_v4ggb6wrjmkotj4i.woff') format('woff'),
                         url('https://at.alicdn.com/t/font_148784_v4ggb6wrjmkotj4i.ttf') format('truetype'),
                         url('https://at.alicdn.com/t/font_148784_v4ggb6wrjmkotj4i.svg#iconfont') format('svg');
                }
            `}</style>
        </Card>
    );
};

// 使用Form.create()包装组件以获取form实例
export default Form.create()(RelatedPerson);