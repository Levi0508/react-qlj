import { Checkbox, Col, DatePicker, Form, Icon, Input, Radio, Row, Select, Tooltip, Button, Space, Popconfirm, message, Modal, Card, Upload } from 'antd';
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import dataManager from '../../utils/dataManager';
import services from '../../services/index';
import store from '@/store';
import useFilePreviewWindow from '@/hooks/useFilePreviewWindow';

const FxqSpecial = forwardRef(({ basicInfo, dictData, clientId, editable = false, form, onAttachmentUpdate = () => {}, attachmentUpdateTime = 0 }, ref) => {
    // 格式化数据字典显示
    const formatDictMap = (dictType, key) => {
        const dict = dictData[dictType] || [];
        const item = dict.find(item => item.k === key);
        return item ? item.v : '-';
    };

    const isOrganization = basicInfo.organ_flag === '1';

    // 根据organFlag和附件类型获取fileTypeNo
    const getFileTypeNo = (type) => {
        const organFlag = basicInfo.organ_flag;
        if (organFlag === '1') {
            // 机构户
            if (type === 'communication') {
                return '72'; // 与客户沟通记录
            } else {
                return '72'; // 二级部门负责人同意的记录 和 其他底稿
            }
        } else {
            // 自然人
            return '3'; // 所有类型都为3
        }
    };

    // 附件数据状态管理
    const [communicationAttachments, setCommunicationAttachments] = useState([]);
    const [agreeAttachments, setAgreeAttachments] = useState([]);
    const [otherAttachments, setOtherAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // 上传相关状态
    const [uploadingCommunication, setUploadingCommunication] = useState(false);
    const [uploadingAgree, setUploadingAgree] = useState(false);
    const [uploadingOther, setUploadingOther] = useState(false);
    
    // 删除相关状态
    const [deletingFileIds, setDeletingFileIds] = useState({});
    
    // 预览相关状态
    const { previewLoading, handlePreview: openPreviewInWindow } = useFilePreviewWindow();

    // 监听表单值变化，当is_special变化时重新加载附件
    useEffect(() => {
        fetchAttachments();
    }, [clientId, basicInfo.organ_flag, form.getFieldValue('is_special')]);

    // 监听附件更新时间戳变化，重新加载附件数据
    useEffect(() => {
        if (attachmentUpdateTime > 0) {
            fetchAttachments();
        }
    }, [attachmentUpdateTime]);

    // 下载附件
    const handleDownload = async (file) => {

        // 验证文件信息
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
            let attachmentType = 'communication';
            if (agreeAttachments.some(a => a.id === f.id)) {
                attachmentType = 'agree';
            } else if (otherAttachments.some(a => a.id === f.id)) {
                attachmentType = 'other';
            }
            const fileTypeNo = getFileTypeNo(attachmentType);
            const fileName = `${f.name}.${f.extension}`;
            const result = await services.previewFile({
                id: f.id,
                clientId: clientId,
                fileTypeNo: fileTypeNo,
                fileName: fileName,
                extension: f.extension
            });
            if (result && result.success && result.data && result.data.previewUrl) {
                return result.data.previewUrl;
            }
            return null;
        });
    };

    // 处理鼠标移动（拖动位置和调整大小）

    // 组件销毁时清理blob URL

    // 渲染附件列表
    const renderAttachmentList = (attachments, emptyText, type) => {
        const uploadProps = getUploadProps(type);

        return (
            <div>
                {attachments.length === 0 ? (
                    <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                        {emptyText}
                    </div>
                ) : (
                    attachments.map((item) => (
                        <div key={item.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: '1px solid #f0f0f0'
                        }}>
                            <span style={{ color: '#595959', fontSize: '14px' }}>{item.name}.{item.extension}</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button
                                    type="link"
                                    size="small"
                                    onClick={() => handleDownload(item)}
                                    style={{ padding: '0 4px', color: '#1890ff' }}
                                >
                                    下载
                                </Button>
                                <Button
                                    type="link"
                                    size="small"
                                    onClick={() => handlePreview(item)}
                                    style={{ padding: '0 4px', color: '#1890ff' }}
                                    loading={previewLoading[item.id] || false}
                                >
                                    预览
                                </Button>
                                {/* {editable && (
                                    <Button
                                        type="link"
                                        size="small"
                                        onClick={() => handleDelete(item, type)}
                                        style={{ padding: '0 4px', color: '#ff4d4f' }}
                                        loading={deletingFileIds[item.id] || false}
                                    >
                                        删除
                                    </Button>
                                )} */}
                            </div>
                        </div>
                    ))
                )}
                
                {/* 上传按钮区域 */}
                {editable && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #f0f0f0' }}>
                        <Upload
                            name="file"
                            showUploadList={false}
                            beforeUpload={(file) => beforeUpload(file)}
                            customRequest={(options) => handleUpload(options, type)}
                        >
                            <Button 
                                type="dashed" 
                                size="small" 
                                icon="upload"
                                loading={
                                    (type === 'communication' && uploadingCommunication) ||
                                    (type === 'agree' && uploadingAgree) ||
                                    (type === 'other' && uploadingOther)
                                }
                                style={{ width: '100%' }}
                            >
                                上传文件
                            </Button>
                        </Upload>
                    </div>
                )}
            </div>
        );
    };

    // 获取上传配置
    const getUploadProps = (type) => {
        const objectId = `${clientId}${type}`;
        const fileTypeNo = getFileTypeNo(type);
        
        return {
            clientId: clientId,
            fileTypeNo: fileTypeNo,
            objectId: objectId
        };
    };

    // 上传前文件验证
    const beforeUpload = (file) => {
        // 检查文件大小（50MB限制）
        const isLt50M = file.size / 1024 / 1024 < 50;
        if (!isLt50M) {
            message.error('文件大小不能超过50MB');
            return false;
        }

        // 检查文件类型
        const allowedExtensions = [
            'zip', 'rar', 'xlsx', 'xls', 'doc', 'docx', 'pdf', 
            'jpg', 'jpeg', 'svg', 'gif', 'png', 'txt', 'mp3', 'mp4'
        ];
        
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const isFileTypeValid = allowedExtensions.includes(fileExtension);
        
        if (!isFileTypeValid) {
            message.error(`不支持的文件类型，仅支持: ${allowedExtensions.join(', ')}`);
            return false;
        }

        return true;
    };

    // 文件上传处理
    const handleUpload = async (options, type) => {
        const { file, onSuccess, onError } = options;
        
        // 设置对应的上传状态
        if (type === 'communication') setUploadingCommunication(true);
        else if (type === 'agree') setUploadingAgree(true);
        else if (type === 'other') setUploadingOther(true);

        try {
            // 执行文件验证
            if (!beforeUpload(file)) {
                onError(new Error('文件验证失败'));
                return;
            }

            // 生成objectId
            const objectId = `${clientId}${type}`;
            
            // 获取文件名和扩展名
            const fileName = file.name;
            const fileExtension = fileName.split('.').pop().toLowerCase();
            
            // 获取当前登录用户信息
            const userInfo = store.getModelState('user');
            const createBy = userInfo?.username || userInfo?.userId || userInfo?.displayName || '未知用户';
            
            // 根据organFlag和附件类型获取fileTypeNo
            const fileTypeNo = getFileTypeNo(type);
            
            // 构建上传参数
            const uploadParams = {
                clientId: clientId,
                fileTypeNo: fileTypeNo,
                name: fileName,
                fileSize: file.size,
                extension: fileExtension,
                createBy: createBy,
                createTime: new Date().toISOString(),
                objectId: objectId,
                file: file
            };
            
            console.log('上传文件参数:', uploadParams);
            
            // 使用services中的uploadFile方法
            const result = await services.uploadFile(uploadParams);

            if (result && result.success) {
                onSuccess(result, file);
                message.success(`上传成功`);
                
                // 清除缓存
                const cacheKey = `attachments_${clientId}_${objectId}`;
                if (dataManager.cache.attachments[cacheKey]) {
                    delete dataManager.cache.attachments[cacheKey];
                }
                
                // 重新加载附件数据
                await fetchAttachments();
                
                // 通知父组件附件已更新（不刷新整个页面）
                onAttachmentUpdate();
            } else {
                onError(new Error(result?.message || '上传失败'));
            }
        } catch (error) {
            console.error('上传文件失败:', error);
            onError(error);
        } finally {
            // 重置上传状态
            if (type === 'communication') setUploadingCommunication(false);
            else if (type === 'agree') setUploadingAgree(false);
            else if (type === 'other') setUploadingOther(false);
        }
    };

    // 删除附件
    const handleDelete = async (file, type) => {
        if (!file || !file.id) {
            message.error('文件信息不完整，无法删除');
            return;
        }

        // 确认删除
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除文件 "${file.name}.${file.extension}" 吗？`,
            okText: '确认',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
                // 设置删除状态
                setDeletingFileIds(prev => ({ ...prev, [file.id]: true }));

                try {
                    // 调用删除接口
                    const result = await services.deleteFile({
                        filePkId: file.id,
                        clientId: clientId,
                        fileTypeNo: getFileTypeNo(type),
                        objectId: `${clientId}${type}`
                    });

                    if (result && result.success) {
                        message.success('文件删除成功');

                        // 清除缓存
                        const cacheKey = `attachments_${clientId}_${clientId}${type}`;
                        if (dataManager.cache.attachments[cacheKey]) {
                            delete dataManager.cache.attachments[cacheKey];
                        }

                        // 重新加载附件数据（不刷新页面）
                        await fetchAttachments();

                        // 通知父组件附件已更新（不刷新整个页面）
                        onAttachmentUpdate();
                    } else {
                        message.error(result?.message || '删除失败');
                    }
                } catch (error) {
                    console.error('删除文件失败:', error);
                    message.error('删除失败，请稍后重试');
                } finally {
                    // 清除删除状态
                    setDeletingFileIds(prev => ({ ...prev, [file.id]: false }));
                }
            }
        });
    };

    // 使用useImperativeHandle暴露方法给父组件
    useImperativeHandle(ref, () => ({
        getFxqSpecialAttachments: () => {
            return {
                communicationAttachments,
                agreeAttachments,
                otherAttachments
            };
        }
    }));

    // 重新加载附件数据
    const fetchAttachments = async () => {
        const isSpecial = form.getFieldValue('is_special');
        
        if (!clientId || !basicInfo.organ_flag || isSpecial !== '1') {
            setCommunicationAttachments([]);
            setAgreeAttachments([]);
            setOtherAttachments([]);
            return;
        }

        setLoading(true);
        try {
            // 分别查询三种类型的附件
            const communicationObjectId = `${clientId}communication`;
            const agreeObjectId = `${clientId}agree`;
            const otherObjectId = `${clientId}other`;

            const [communicationRes, agreeRes, otherRes] = await Promise.all([
                dataManager.selectFileList(clientId, communicationObjectId),
                dataManager.selectFileList(clientId, agreeObjectId),
                dataManager.selectFileList(clientId, otherObjectId)
            ]);

            // 转换数据格式
            const formatAttachments = (attachments) => {
                return attachments.map(item => ({
                    id: item.id,
                    name: item.name || '未命名文件',
                    extension:  item.extension || 'unknown',
                    create_by: item.createBy || '未知',
                    create_time: item.createTime || new Date().toLocaleString()
                }));
            };

            setCommunicationAttachments(formatAttachments(communicationRes));
            setAgreeAttachments(formatAttachments(agreeRes));
            setOtherAttachments(formatAttachments(otherRes));

        } catch (error) {
            console.error('获取反洗钱附件列表失败:', error);
            message.error('获取反洗钱附件列表失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="box-card" id="fxqSpecial" title="反洗钱特殊情况">

            {/* 反洗钱特殊情况申请 */}
            <div style={{ marginTop: '20px', padding: '20px' }}>
                <Form layout="vertical" style={{ border: 'none' }}>
                    <Form.Item
                        label="是否存在反洗钱特殊情况申请"
                        style={{ marginBottom: '10px' }}
                    >
                        {form.getFieldDecorator('is_special', {
                            initialValue: basicInfo.is_special || '0',
                            rules: [{ required: true, message: '请选择是否存在反洗钱特殊情况申请' }]
                        })(
                            <Radio.Group disabled={!editable}>
                                <Radio value="1">是</Radio>
                                <Radio value="0">否</Radio>
                            </Radio.Group>
                        )}
                        <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                            如目前存在未获取的反洗钱信息或底稿材料，请选择"是"
                        </div>
                    </Form.Item>

                    {form.getFieldValue('is_special') === '1' && (
                        <div>
                            <Form.Item label="客户类型">
                                {form.getFieldDecorator('client_type', {
                                    initialValue: basicInfo.client_type ? basicInfo.client_type.split(',') : [],
                                    rules: [{ required: true, message: '请选择客户类型' }]
                                })(
                                    <Checkbox.Group disabled={!editable}>
                                        <Row>
                                            {dictData.client_type_list && dictData.client_type_list.map(item => (
                                                <Col span={6} key={item.k} style={{ marginBottom: '8px', width: '150px' }}>
                                                    <Checkbox value={item.k}>{item.v}</Checkbox>
                                                </Col>
                                            ))}
                                        </Row>
                                    </Checkbox.Group>
                                )}
                            </Form.Item>
                            {form.getFieldValue('client_type') && form.getFieldValue('client_type').includes('99') && (
                                <Form.Item label="具体说明">
                                    {form.getFieldDecorator('client_type_other', {
                                        initialValue: basicInfo.client_type_other || '',
                                        rules: [{ required: true, message: '请输入客户类型具体说明' }]
                                    })(
                                        <Input disabled={!editable} />
                                    )}
                                </Form.Item>
                            )}

                            <Form.Item label="特殊事项">
                                {form.getFieldDecorator('special_matters', {
                                    initialValue: basicInfo.special_matters ? basicInfo.special_matters.split(',') : [],
                                    rules: [{ required: true, message: '请选择特殊事项' }]
                                })(
                                    <Checkbox.Group disabled={!editable}>
                                        <Row>
                                            {dictData.special_matters_list && dictData.special_matters_list.map(item => (
                                                <Col span={6} key={item.k} style={{ marginBottom: '8px', width: '150px' }}>
                                                    <Checkbox value={item.k}>{item.v}</Checkbox>
                                                </Col>
                                            ))}
                                        </Row>
                                    </Checkbox.Group>
                                )}
                            </Form.Item>

                            {form.getFieldValue('special_matters') && form.getFieldValue('special_matters').includes('1') && (
                                <Form.Item label="具体说明缺失的信息">
                                    {form.getFieldDecorator('missing_information', {
                                        initialValue: basicInfo.missing_information || '',
                                        rules: [{ required: true, message: '请输入具体说明缺失的信息' }]
                                    })(
                                        <Input.TextArea disabled={!editable} />
                                    )}
                                </Form.Item>
                            )}

                            {form.getFieldValue('special_matters') && form.getFieldValue('special_matters').includes('2') && (
                                <Form.Item label="具体说明缺失的底稿">
                                    {form.getFieldDecorator('missing_draft', {
                                        initialValue: basicInfo.missing_draft || '',
                                        rules: [{ required: true, message: '请输入具体说明缺失的底稿' }]
                                    })(
                                        <Input.TextArea disabled={!editable} />
                                    )}
                                </Form.Item>
                            )}

                            {form.getFieldValue('special_matters') && form.getFieldValue('special_matters').includes('99') && (
                                <Form.Item label="具体说明">
                                    {form.getFieldDecorator('special_matters_other', {
                                        initialValue: basicInfo.special_matters_other || '',
                                        rules: [{ required: true, message: '请输入特殊事项具体说明' }]
                                    })(
                                        <Input disabled={!editable} />
                                    )}
                                </Form.Item>
                            )}

                            <Form.Item label="特殊事项原因">
                                {form.getFieldDecorator('special_reason', {
                                    initialValue: basicInfo.special_reason || '',
                                    rules: [{ required: true, message: '请输入特殊事项原因' }]
                                })(
                                    <Input.TextArea disabled={!editable} />
                                )}
                            </Form.Item>

                            <Form.Item label="已开展的反洗钱尽职调查工作">
                                {form.getFieldDecorator('completed_cdd', {
                                    initialValue: basicInfo.completed_cdd || '',
                                    rules: [{ required: true, message: '请输入已开展的反洗钱尽职调查工作' }]
                                })(
                                    <Input.TextArea disabled={!editable} />
                                )}
                            </Form.Item>

                            <Form.Item label="客户洗钱风险较低的评估说明">
                                {form.getFieldDecorator('low_risk_explanation', {
                                    initialValue: basicInfo.low_risk_explanation || '',
                                    rules: [{ required: true, message: '请输入客户洗钱风险较低的评估说明' }]
                                })(
                                    <Input.TextArea disabled={!editable} />
                                )}
                            </Form.Item>

                            <Form.Item label="后续措施">
                                {form.getFieldDecorator('take_measures', {
                                    initialValue: basicInfo.take_measures || '',
                                    rules: [{ required: true, message: '请输入后续措施' }]
                                })(
                                    <Input.TextArea disabled={!editable} />
                                )}
                            </Form.Item>
                        </div>
                    )}
                </Form>

                {/* 反洗钱附件展示 */}
                {form.getFieldValue('is_special') === '1' && (
                    <div style={{ marginTop: '30px', padding: '20px', borderTop: '1px solid #f0f0f0' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>附件信息</div>

                        {/* 与客户沟通记录 */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#262626' }}>
                                 <span style={{ color: '#ff4d4f', marginRight: '4px' }}>*</span>与客户沟通记录
                            </div>
                            <div style={{ backgroundColor: '#fafafa', padding: '10px', borderRadius: '4px' }}>
                                {renderAttachmentList(communicationAttachments, '暂无与客户沟通记录附件', 'communication')}
                            </div>
                        </div>

                        {/* 二级部门负责人同意的记录 */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#262626' }}>
                                 <span style={{ color: '#ff4d4f', marginRight: '4px' }}>*</span>二级部门负责人同意的记录
                            </div>
                            <div style={{ backgroundColor: '#fafafa', padding: '10px', borderRadius: '4px' }}>
                                {renderAttachmentList(agreeAttachments, '暂无二级部门负责人同意记录附件', 'agree')}
                            </div>
                        </div>

                        {/* 其他底稿 */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#262626' }}>
                                其他底稿
                            </div>
                            <div style={{ backgroundColor: '#fafafa', padding: '10px', borderRadius: '4px' }}>
                                {renderAttachmentList(otherAttachments, '暂无其他底稿附件', 'other')}
                            </div>
                        </div>

                        {/* 加载状态 */}
                        {loading && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                正在加载附件数据...
                            </div>
                        )}
                    </div>
                )}

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
            </div>
        </Card>
    );
})

export default FxqSpecial;
