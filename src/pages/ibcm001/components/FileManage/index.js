/*
 * @Author: 程婧
 * @Date: 2025-11-25 17:56:25
 * @LastEditors: 114398 chenhaiyang@gtht.com
 * @LastEditTime: 2026-08-25 09:11:20
 * @FilePath: \ibcm-flow-ui\src\pages\ibcm001\componens\fileManage\index.js
 * @Description: 附件清单
 */
import { Checkbox, Col, DatePicker, Form, Icon, Input, Radio, Row, Select, Tooltip, Button, Space, Popconfirm, message, Modal, Card, Tree, Table, Upload } from 'antd';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import React, { useState, useEffect, useRef } from 'react';
import { SearchOutlined } from '@ant-design/icons';
import { directoryConfig } from '../../data/mockData';
import dataManager from '../../utils/dataManager';
import services from '../../services/index';  //'../../services';
import store from '@/store';
import useFilePreviewWindow from '@/hooks/useFilePreviewWindow';


const { TreeNode } = Tree;

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

function FileManage({
    organFlag = organFlag,
    clientId = clientId,
    editable = true,
    onAttachmentUpdate = () => { }
}) {
    const [filterText, setFilterText] = useState('');
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [attachmentList, setAttachmentList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [treeData, setTreeData] = useState([]);
    const [expandedKeys, setExpandedKeys] = useState([]);
    const { previewLoading, handlePreview: openPreviewInWindow } = useFilePreviewWindow();

    // ========== 列宽状态管理 ==========
    const [columnWidths, setColumnWidths] = useState({
        name: 200,
        extension: 120,
        create_by: 100,
        create_time: 180,
        action: 120
    });

    // 左侧目录树宽度（可拖拽调整）
    const [leftPanelWidth, setLeftPanelWidth] = useState(300);

    // 上传相关状态
    const [uploading, setUploading] = useState(false);
    const [uploadFileList, setUploadFileList] = useState([]);
    const [draggingFile, setDraggingFile] = useState(null);
    const [isDragOverTree, setIsDragOverTree] = useState(false);
    const [dropTargetNode, setDropTargetNode] = useState(null); // 接收拖拽的树节点

    const treeRef = useRef();
    const leftPanelRef = useRef();
    const uploadRef = useRef();

    // ========== 列宽调整处理函数 ==========
    const handleResize = (columnKey) => (e, { size }) => {
        setColumnWidths(prev => ({
            ...prev,
            [columnKey]: size.width
        }));
    };

    // ========== 左侧面板宽度拖拽 ==========
    const handleLeftPanelResizeStart = (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = leftPanelWidth;
        const onMove = (ev) => {
            const next = Math.min(Math.max(startWidth + (ev.clientX - startX), 180), 520);
            setLeftPanelWidth(next);
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    useEffect(() => {
        // 根据机构类型设置树形数据
        const config = organFlag === '1'
            ? directoryConfig.directoryConfig1
            : directoryConfig.directoryConfig2;
        setTreeData(config);

        // 默认展开所有节点
        const allKeys = getAllKeys(config);
        setExpandedKeys(allKeys);
    }, [organFlag]);

    // 获取所有节点的key（用于默认展开）
    const getAllKeys = (data) => {
        let keys = [];
        data.forEach(item => {
            // 确保key是字符串类型
            const key = String(item.key || item.value);
            keys.push(key);
            if (item.children) {
                keys = keys.concat(getAllKeys(item.children));
            }
        });
        return keys;
    };

    // 递归渲染树节点
    const renderTreeNodes = (data) => {
        return data.map(item => {
            // 确保key是字符串类型
            const treeKey = String(item.key || item.value);

            // 自定义树节点渲染，添加拖拽事件（仅当editable为true时）
            const customTitle = (
                <div
                    className="custom-tree-node"
                    data-node-key={item.value}
                    onDragEnter={editable ? (e) => handleTreeDragEnter(e, item) : undefined}
                    onDragOver={editable ? (e) => handleTreeDragOver(e, item) : undefined}
                    onDragLeave={editable ? (e) => handleTreeDragLeave(e, item) : undefined}
                    onDrop={editable ? (e) => handleTreeDrop(e, item) : undefined}
                    style={{
                        padding: '4px 0',
                        width: '100%',
                        backgroundColor: editable && dropTargetNode && dropTargetNode.value === item.value ? '#f0f9ff' : 'transparent',
                        transition: 'background-color 0.3s'
                    }}
                >
                    {item.label}
                </div>
            );

            if (item.children) {
                return (
                    <Tree.TreeNode
                        key={treeKey}
                        title={customTitle}
                        dataRef={item}
                    >
                        {renderTreeNodes(item.children)}
                    </Tree.TreeNode>
                );
            }
            return (
                <Tree.TreeNode
                    key={treeKey}
                    title={customTitle}
                    dataRef={item}
                />
            );
        });
    };
    // 过滤树节点
    const filterTreeData = (data, searchValue) => {
        if (!searchValue) return data;

        return data.reduce((acc, item) => {
            const newItem = { ...item };
            if (item.label.toLowerCase().includes(searchValue.toLowerCase())) {
                acc.push(newItem);
            } else if (item.children) {
                const filteredChildren = filterTreeData(item.children, searchValue);
                if (filteredChildren.length) {
                    newItem.children = filteredChildren;
                    acc.push(newItem);
                }
            }
            return acc;
        }, []);
    };

    const handleNodeClick = (selectedKeys, e) => {
        if (selectedKeys.length > 0) {
            const selectedNode = e.node.props.dataRef;
            setSelectedMenu(selectedNode);
            loadAttachments(selectedKeys[0]);
        }
    };

    // 加载附件列表
    const loadAttachments = async (directoryId) => {
        setLoading(true);

        try {
            const attachments = await dataManager.getAttachments(clientId, directoryId);

            // 转换数据格式，确保所有必需字段都存在
            const formattedAttachments = attachments.map(item => ({
                id: item.id || `${directoryId}_${Math.random()}`,
                name: item.name || '未命名文件',
                extension: item.extension || 'unknown',
                create_by: item.createBy || '未知',
                create_time: item.createTime || new Date().toLocaleString()
            }));

            setAttachmentList(formattedAttachments);
        } catch (error) {
            console.error('加载附件失败:', error);
            // 如果API失败，使用空数组
            setAttachmentList([]);
            message.warning('加载附件失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

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
            const fileTypeNo = selectedMenu?.value || '';
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

    // 根据文件扩展名获取Content-Type
    const getContentType = (extension) => {
        const typeMap = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'webp': 'image/webp',
            'txt': 'text/plain',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
        return typeMap[extension?.toLowerCase()] || 'application/octet-stream';
    };

    // 删除附件
    const handleDelete = (file) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除 "${file.name}" 吗?`,
            okText: '确定',
            cancelText: '取消',
            onOk: async () => {
                try {
                    // 检查文件ID是否有效
                    if (!file.id) {
                        message.error('文件ID无效，无法删除');
                        return;
                    }

                    // 显示加载状态
                    const hideLoading = message.loading('正在删除文件...', 0);

                    // 调用deleteFile接口，传递filePkId参数
                    const result = await services.deleteFile({
                        filePkId: file.id  // 使用当前选中行数据的id字段值
                    });

                    hideLoading();

                    if (result && result.success) {
                        message.success('删除成功');

                        // 从列表中移除文件
                        const index = attachmentList.findIndex(item => item.id === file.id);
                        if (index !== -1) {
                            const newList = [...attachmentList];
                            newList.splice(index, 1);
                            setAttachmentList(newList);
                        }

                        // 仅清除当前目录的附件缓存
                        if (selectedMenu) {
                            const cacheKey = `attachments_${clientId}_${selectedMenu.value}`;
                            if (dataManager.cache.attachments[cacheKey]) {
                                delete dataManager.cache.attachments[cacheKey];
                            }
                        }
                        onAttachmentUpdate();
                    } else {
                        message.error(result?.message || '删除失败');
                    }
                } catch (error) {
                    console.error('删除文件失败:', error);
                    message.error(`删除失败: ${error.message || '未知错误'}`);
                }
            },
            onCancel: () => {
            }
        });
    };

    // 文件上传处理
    const handleUpload = async (info) => {
        const { file, fileList } = info;
        const { status } = file;

        if (status === 'uploading') {
            setUploading(true);
            setUploadFileList(fileList);
            return;
        }

        if (status === 'done') {
            setUploading(false);
            const { response } = file;

            if (response && response.success) {
                message.success(`${file.name} 上传成功`);
                // 刷新附件列表
                if (selectedMenu) {
                    // 清除当前目录的缓存
                    const cacheKey = `attachments_${clientId}_${selectedMenu.value}`;
                    if (dataManager.cache.attachments[cacheKey]) {
                        delete dataManager.cache.attachments[cacheKey];
                    }
                    loadAttachments(selectedMenu.value);
                }
                // 清空上传文件列表
                setUploadFileList([]);
                onAttachmentUpdate();
            } else {
                message.error(`${file.name} 上传失败: ${response?.message || '未知错误'}`);
            }
        }

        if (status === 'error') {
            setUploading(false);
            message.error(`${file.name} 上传失败`);
        }

        setUploadFileList(fileList);
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

    // 自定义上传请求
    const customUploadRequest = async (options) => {
        const { file, onSuccess, onError } = options;

        if (!selectedMenu) {
            message.error('请先从左侧选择目录');
            onError(new Error('未选择目录'));
            return;
        }

        // 执行文件验证
        if (!beforeUpload(file)) {
            onError(new Error('文件验证失败'));
            return;
        }

        try {
            // 生成objectId（前端唯一ID）
            const objectId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // 获取文件名和扩展名
            const fileName = file.name;
            const fileExtension = fileName.split('.').pop().toLowerCase();

            // 获取当前登录用户信息
            const userInfo = store.getModelState('user');
            const createBy = userInfo?.username || userInfo?.userId || userInfo?.displayName || '未知用户';

            // 构建上传参数
            const uploadParams = {
                clientId: clientId,
                fileTypeNo: selectedMenu.value,
                // id 由后端sysguid自动生成
                name: fileName,
                fileSize: file.size,
                extension: fileExtension,
                createBy: createBy,
                createTime: new Date().toISOString(), // 后端会覆盖这个时间
                objectId: objectId,
                file: file // 文件对象
            };
            const result = await services.uploadFile(uploadParams);
            if (result && result.success) {
                onSuccess(result, file);
            } else {
                onError(new Error(result?.message || '上传失败'));
            }
        } catch (error) {
            console.error('上传文件失败:', error);
            onError(error);
        }
    };

    // 文件拖拽开始（从右侧列表拖到左侧树）
    const handleDragStart = (e, file) => {
        e.dataTransfer.setData('text/plain', JSON.stringify(file));
        setDraggingFile(file);
    };

    // 树节点拖拽进入
    const handleTreeDragEnter = (e, nodeData) => {
        e.preventDefault();
        setDropTargetNode(nodeData);
        setIsDragOverTree(true);
    };

    // 树节点拖拽经过
    const handleTreeDragOver = (e, nodeData) => {
        e.preventDefault(); // 必须，否则 drop 不生效
        setDropTargetNode(nodeData);
        setIsDragOverTree(true);
    };

    // 树节点拖拽离开
    const handleTreeDragLeave = (e, nodeData) => {
        e.preventDefault();
        // 只有当离开的是当前悬停节点时才清除状态
        if (dropTargetNode && dropTargetNode.value === nodeData.value) {
            setDropTargetNode(null);
        }
        setIsDragOverTree(false);
    };

    // 树节点拖拽放下（更换目录）
    const handleTreeDrop = async (e, nodeData) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOverTree(false);

        try {
            const fileData = e.dataTransfer.getData('text/plain');
            if (!fileData) return;

            const file = JSON.parse(fileData);

            // 使用dropTargetNode（拖拽悬停的节点）或传入的nodeData
            const targetNode = dropTargetNode || nodeData;

            if (!targetNode || !targetNode.value) {
                message.warning('请拖拽到具体的目录节点上');
                return;
            }

            const targetDirectoryId = targetNode.value;

            if (!targetDirectoryId) {
                message.error('请选择有效的目录节点');
                return;
            }

            // 显示确认对话框
            Modal.confirm({
                title: '确认移动文件',
                content: `确定要把 "${file.name}" 移动到 "${targetNode.label}" 目录下吗？`,
                okText: '确定',
                cancelText: '取消',
                onOk: async () => {
                    try {
                        // 先立即从当前列表中移除文件，提供即时反馈
                        const currentFileIndex = attachmentList.findIndex(item => item.id === file.id);
                        if (currentFileIndex !== -1) {
                            const newList = [...attachmentList];
                            newList.splice(currentFileIndex, 1);
                            setAttachmentList(newList);
                        }

                        // 调用API移动文件到新目录
                        const result = await services.updateFileDir({
                            id: file.id,
                            fileTypeNo: targetDirectoryId
                        });

                        if (result && result.success) {
                            message.success(`已将文件移动到 ${targetNode.label}`);

                            // 仅清除特定目录的缓存，而不是所有缓存
                            const cacheKey = `attachments_${clientId}_${selectedMenu?.value || ''}`;
                            if (dataManager.cache.attachments[cacheKey]) {
                                delete dataManager.cache.attachments[cacheKey];
                            }

                            // 如果文件移动到其他目录，也需要清除目标目录的缓存
                            const targetCacheKey = `attachments_${clientId}_${targetDirectoryId}`;
                            if (dataManager.cache.attachments[targetCacheKey]) {
                                delete dataManager.cache.attachments[targetCacheKey];
                            }

                            // 只刷新当前显示的附件列表
                            if (selectedMenu) {
                                loadAttachments(selectedMenu.value);
                            }

                            // 通知父组件附件已更新（但不重新加载所有客户数据）
                            onAttachmentUpdate();
                        } else {
                            message.error(result?.message || '移动文件失败');
                            // 如果API失败，恢复文件到列表中
                            if (currentFileIndex !== -1) {
                                const originalList = [...attachmentList];
                                originalList.splice(currentFileIndex, 0, file);
                                setAttachmentList(originalList);
                            }
                        }
                    } catch (error) {
                        console.error('移动文件失败:', error);
                        message.error(`移动文件失败: ${error.message || '未知错误'}`);
                    }
                }
            });
        } catch (error) {
            console.error('处理拖拽失败:', error);
            message.error(`处理拖拽失败: ${error.message || '未知错误'}`);
        } finally {
            // 清理数据
            setDraggingFile(null);
            setDropTargetNode(null);
        }
    };

    // ========== 表格组件配置 ==========
    const tableComponents = {
        header: {
            cell: ResizeableTitle,
        },
    };

    // ========== 表格列定义（支持拖拽） ==========
    const getColumns = () => {
        return [
            {
                title: '附件名称',
                dataIndex: 'name',
                key: 'name',
                width: columnWidths.name || 200,
                sorter: (a, b) => a.name.localeCompare(b.name),
                render: (text, record) => (
                    <Tooltip title={text}>
                        <Button
                            type="link"
                            onClick={() => handleDownload(record)}
                            style={{
                                padding: 0,
                                maxWidth: '100%',
                                // overflow: 'hidden',
                                // textOverflow: 'ellipsis',
                                whiteSpace: 'normal',
                                display: 'inline-block',
                                textAlign: 'left'
                            }}
                            draggable={editable ? "true" : "false"}
                            onDragStart={editable ? (e) => handleDragStart(e, record) : undefined}
                            title={editable ? "拖拽到左侧目录树可移动文件到其他目录" : "点击下载文件"}
                        >
                            {text}
                        </Button>
                    </Tooltip>
                ),
                onHeaderCell: (column) => ({
                    width: column.width,
                    onResize: handleResize('name'),
                }),
            },
            {
                title: '附件类型',
                dataIndex: 'extension',
                key: 'extension',
                width: columnWidths.extension || 120,
                sorter: (a, b) => a.extension.localeCompare(b.extension),
                render: (extension) => extension.toUpperCase(),
                onHeaderCell: (column) => ({
                    width: column.width,
                    onResize: handleResize('extension'),
                }),
            },
            {
                title: '上传人',
                dataIndex: 'create_by',
                key: 'create_by',
                width: columnWidths.create_by || 100,
                sorter: (a, b) => a.create_by.localeCompare(b.create_by),
                onHeaderCell: (column) => ({
                    width: column.width,
                    onResize: handleResize('create_by'),
                }),
            },
            {
                title: '上传时间',
                dataIndex: 'create_time',
                key: 'create_time',
                width: columnWidths.create_time || 180,
                sorter: (a, b) => a.create_time.localeCompare(b.create_time),
                onHeaderCell: (column) => ({
                    width: column.width,
                    onResize: handleResize('create_time'),
                }),
            },
            {
                title: '操作',
                key: 'action',
                width: columnWidths.action || 120,
                fixed: 'right',
                render: (_, record) => (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => handleDownload(record)}
                            style={{ padding: '0 4px', color: '#1890ff' }}
                        >
                            下载
                        </Button>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => handlePreview(record)}
                            style={{ color: '#1890ff'}}
                            loading={previewLoading[record.id] || false}
                        >
                            预览
                        </Button>
                        {/* {editable && (
                            <Button
                                type="link"
                                size="small"
                                onClick={() => handleDelete(record)}
                                style={{ padding: '0 4px', color: '#ff4d4f' }}
                            >
                                删除
                            </Button>
                        )} */}
                    </div>
                ),
                onHeaderCell: (column) => ({
                    width: column.width,
                    onResize: handleResize('action'),
                }),
            }
        ];
    };

    const filteredTreeData = filterTreeData(treeData, filterText);

    return (
        <Card className="box-card" id="attachmentManager" title="附件清单" style={{ minHeight: '600px' }}>
            <div className="file-container" style={{ display: 'flex', minHeight: '500px' }}>
                {/* 左侧目录树 */}
                <div
                    className="left-panel"
                    ref={leftPanelRef}
                    style={{
                        width: `${leftPanelWidth}px`,
                        flexShrink: 0,
                        padding: '16px',
                        overflowY: 'auto'
                    }}
                >
                    <div className="panel-title" style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#303133',
                        marginBottom: '16px'
                    }}>
                        附件类型目录
                    </div>
                    <div className="search-box" style={{ marginBottom: '16px' }}>
                        <Input
                            placeholder="输入关键字进行过滤"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="search-input-with-icon"
                        />
                    </div>

                    <div
                        style={{
                            border: editable && isDragOverTree ? '2px dashed #1890ff' : 'none',
                            borderRadius: '4px',
                            padding: editable && isDragOverTree ? '8px' : '0',
                            transition: 'all 0.3s'
                        }}
                    >
                        <Tree
                            className="filter-tree"
                            ref={treeRef}
                            defaultExpandedKeys={getAllKeys(filteredTreeData)} // 默认展开所有节点
                            onSelect={handleNodeClick}
                            selectedKeys={selectedMenu ? [String(selectedMenu.value)] : []}
                        >
                            {renderTreeNodes(filteredTreeData)}
                        </Tree>
                    </div>
                </div>

                {/* 可拖拽分隔条：调整目录树与附件清单宽度 */}
                <div
                    onMouseDown={handleLeftPanelResizeStart}
                    title="拖拽调整目录宽度"
                    style={{
                        width: '6px',
                        flexShrink: 0,
                        cursor: 'col-resize',
                        background: '#f0f0f0',
                        position: 'relative',
                        zIndex: 2,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#91d5ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f0f0f0'; }}
                >
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '4px',
                        height: '48px',
                        background: '#bfbfbf',
                        borderRadius: '2px',
                        pointerEvents: 'none',
                    }} />
                </div>

                {/* 右侧附件列表 */}
                <div className="right-panel" style={{ flex: 1, minWidth: 0, padding: '16px', overflow: 'auto' }}>
                    {!selectedMenu ? (
                        <div style={{
                            color: '#8d8b8b',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            请先从左侧选择目录
                        </div>
                    ) : (
                        <div>
                            <div className="panel-title" style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#303133',
                                marginBottom: '16px'
                            }}>
                                附件清单 - {selectedMenu.label}
                            </div>
                            {/* 拖拽提示信息（仅当editable为true时显示） */}
                            {editable && draggingFile && dropTargetNode && (
                                <div style={{
                                    marginBottom: '10px',
                                    padding: '8px',
                                    backgroundColor: '#f0f9ff',
                                    border: '1px solid #91d5ff',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    color: '#1890ff'
                                }}>
                                    <span>释放鼠标将文件移动到: <strong>{dropTargetNode.label}</strong></span>
                                </div>
                            )}

                            <Table
                                dataSource={attachmentList}
                                columns={getColumns()}
                                loading={loading}
                                pagination={false}
                                size="small"
                                rowKey="id"
                                bordered
                                components={tableComponents}
                                scroll={{ x: 800 }}
                            />

                            {/* 文件上传区域 - 当选择"全部"节点时不显示 */}
                            {selectedMenu.label !== '全部' && (
                                <div style={{ marginTop: '20px', borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
                                <div className="panel-title" style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#F56C6C',
                                    marginBottom: '12px'
                                }}>
                                    【*附件上传后即为保存，将不允许修改和删除，如有错误可用新的同名文件更新替换】
                                </div>
                                <Upload.Dragger
                                    ref={uploadRef}
                                    name="file"
                                    multiple
                                    fileList={uploadFileList}
                                    customRequest={customUploadRequest}
                                    beforeUpload={beforeUpload}
                                    onChange={handleUpload}
                                    showUploadList={false}
                                    disabled={uploading || !selectedMenu || !editable}
                                >
                                    <p className="ant-upload-drag-icon">
                                        <Icon type={uploading ? "loading" : editable ? "inbox" : "lock"} />
                                    </p>
                                    <p className="ant-upload-text">
                                        {uploading ? '上传中...' :
                                            !editable ? '当前为只读模式，不能上传附件' :
                                                selectedMenu ? `点击或拖拽文件到此处上传到 "${selectedMenu.label}"` :
                                                    '请先从左侧选择目录'}
                                    </p>
                                    <p className="ant-upload-hint">
                                        {editable ? '支持扩展名: .zip .rar .xlsx .xls .doc .docx .pdf .jpg .jpeg .svg .gif .png .txt .mp3 .mp4' :
                                            '当前模式下只能查看和下载附件，不能上传、删除或移动文件'}
                                    </p>
                                </Upload.Dragger>
                                <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                                    <p>提示：</p>
                                    <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                                        {editable ? (
                                            <>
                                                <li>可以将文件直接拖拽到上传区域进行上传</li>
                                                <li>可以将右侧列表中的文件拖拽到左侧目录树节点，将文件移动到其他目录</li>
                                                <li>单个文件大小限制：50MB</li>
                                            </>
                                        ) : (
                                            <>
                                                <li>当前为只读模式，只能查看和下载附件</li>
                                                <li>不能上传、删除或移动文件</li>
                                            </>
                                        )}
                                    </ul>
                                </div>
                            </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

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
                
                /* 树节点拖拽样式 */
                .custom-tree-node {
                    cursor: pointer;
                }
                
                .custom-tree-node:hover {
                    background-color: #f5f5f5;
                }
                
                /* 按钮拖拽样式 */
                .ant-btn-link[data-draggable="true"] {
                    cursor: move !important;
                }
                
                .ant-btn-link[data-draggable="true"]:hover {
                    text-decoration: underline;
                }

                /* 表头列宽拖拽手柄 */
                #attachmentManager .react-resizable {
                    position: relative;
                    background-clip: padding-box;
                }
                #attachmentManager .react-resizable-handle {
                    position: absolute;
                    right: -5px;
                    bottom: 0;
                    z-index: 1;
                    width: 10px;
                    height: 100%;
                    cursor: col-resize;
                    background: transparent;
                }
                #attachmentManager .react-resizable-handle::after {
                    content: '';
                    position: absolute;
                    right: 4px;
                    top: 20%;
                    height: 60%;
                    width: 2px;
                    background: #d9d9d9;
                }
            `}</style>
        </Card>
    );
}

export default FileManage;