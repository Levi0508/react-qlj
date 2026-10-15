
/*
 * @Author: 程婧
 * @Date: 2025-11-25 17:56:25
 * @LastEditors: 114398 chenhaiyang@gtht.com
 * @LastEditTime: 2026-08-25 09:43:34
 * @FilePath: \ibcm-flow-ui\src\pages\ibcm001\componens\fileManage\index.js
 * @Description: 审核意见
 */
import React, { useState, useEffect, useRef } from 'react';
import { Card, Table, Tabs, Input, Button, Select, message, Dropdown, Menu } from 'antd';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import Icon from 'antd/lib/icon';
import { PlusOutlined } from '@ant-design/icons';
import services from '../../services';
import store from '@/store';

const { TabPane } = Tabs;
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

function ReviewRecord({ clientId = '', curNode = {}, editable = false, organFlag = '1', mode = 'full' }) {
  const [activeTab, setActiveTab] = useState('0');
  const [showHistoryLogs, setShowHistoryLogs] = useState(true);
  const [historyData, setHistoryData] = useState([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchInfo, setBatchInfo] = useState({
    display_name: '',
    create_time: '',
    remark: ''
  });

  // 审核编辑相关状态
  const [tableData, setTableData] = useState([]); // 当前审核详情
  const [remark, setRemark] = useState(''); // 备注
  const [errorTypeOptions, setErrorTypeOptions] = useState([]); // 错误类型下拉框选项
  const [isEditableMode, setIsEditableMode] = useState(false); // 是否为可编辑模式
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false); // 是否为只读模式（显示历史数据）
  const [initialLoadDone, setInitialLoadDone] = useState(false); // 标记是否已完成初次加载
  const [latestBatchData, setLatestBatchData] = useState([]); // 最新批次数据（fxqkhqr节点用于上方表格）

  // ========== 列宽状态管理（三个表格独立管理） ==========
  // 1. 审核问题录入表格列宽
  const [editColumnWidths, setEditColumnWidths] = useState({
    seq: 30,
    errorType: 140,
    problemDesc: 200,
    action: 20
  });

  // 2. 历史问题记录表格列宽
  const [historyColumnWidths, setHistoryColumnWidths] = useState({
    auditDesc: 150,
    disposeDesc: 250,
    createUser: 120,
    createTime: 160
  });

  // 用于跟踪组件是否已挂载
  const isMounted = React.useRef(true);

  // 使用ref来存储最新的数据，确保window.getReviewRecordData能获取到最新值
  const latestDataRef = React.useRef({
    tableData: [],
    remark: '',
    clientId: ''
  });

  // ========== 列宽调整处理函数 ==========
  // 审核问题录入表格列宽调整
  const handleEditResize = (columnKey) => (e, { size }) => {
    setEditColumnWidths(prev => ({
      ...prev,
      [columnKey]: size.width
    }));
  };

  // 历史问题记录表格列宽调整
  const handleHistoryResize = (columnKey) => (e, { size }) => {
    setHistoryColumnWidths(prev => ({
      ...prev,
      [columnKey]: size.width
    }));
  };

  useEffect(() => {
    const isEditMode = curNode?.nodeCode === 'fxqkhdy';
    setIsEditableMode(isEditMode);
    const isReadMode = curNode?.nodeCode === 'fxqkhqr';
    setIsReadOnlyMode(isReadMode);
    const loadInitialData = async () => {
      try {
        // 加载批次总数
        const response = await services.selectBatchTotal({
          clientId: clientId
        });

        if (response.success) {
          const total = parseInt(response.data || '0', 10);
          setBatchTotal(total);
          if (isMounted.current && !initialLoadDone && total > 0) {
            await loadHistoryDataByBatchWithTotal(0, total, isReadMode);
            setInitialLoadDone(true);
          }
        }
      } catch (error) {
        console.error('加载批次总数失败:', error);
      }
    };

    loadInitialData();

    if (isEditMode) {
      loadErrorTypeOptions();
    }

    // 更新ref中的最新数据
    latestDataRef.current = {
      tableData: [...tableData],
      remark: remark,
      clientId: clientId
    };

    // 注册全局方法，用于获取审核数据
    // 使用ref来确保总是返回最新的数据
    window.getReviewRecordData = () => {
      return {
        tableData: [...latestDataRef.current.tableData],
        remark: latestDataRef.current.remark,
        clientId: latestDataRef.current.clientId
      };
    };

    // 清理函数
    return () => {
      isMounted.current = false;
      if (window.getReviewRecordData) {
        delete window.getReviewRecordData;
      }
      if (window.errorTypeOptions) {
        delete window.errorTypeOptions;
      }
    };
  }, [clientId, curNode, editable]); // 只依赖这些外部props

  // 监听tableData和remark的变化，更新ref
  useEffect(() => {
    latestDataRef.current = {
      tableData: [...tableData],
      remark: remark,
      clientId: clientId
    };
  }, [tableData, remark, clientId]);



  // 处理标签页点击
  const handleTabClick = async (tabKey) => {
    const tabIndex = parseInt(tabKey);
    setActiveTab(tabKey);
    await loadHistoryDataByBatch(tabIndex);
  };

  // 加载历史审核数据（使用传入的total参数，避免依赖state的batchTotal）
  const loadHistoryDataByBatchWithTotal = async (tabIndex, total, isReadMode) => {
    try {
      // tabIndex 是从0开始的，批次号是从1开始的
      // 总批次数 = total
      // 历史批次编号 = 1, 2, ..., total
      // tabIndex 0 -> 批次 total（最新批次）
      // tabIndex 1 -> 批次 total-1

      // 统一使用新逻辑：批次1是最新的，批次4是最早的
      // 第一个tab页（tabIndex=0）获取批次1（最新）
      // 最后一个tab页获取批次4（最早）
      const batchNum = tabIndex + 1;
      if (batchNum >= 1 && batchNum <= total) {
        const response = await services.selectApprDetails({
          clientId: clientId,
          batchNum: String(batchNum)
        });
        if (response.success && response.data) {
          let historyRecords = [];
          try {
            historyRecords = JSON.parse(response.data);
          } catch (e) {
            console.error('解析历史审核记录数据失败:', e);
            historyRecords = response.data;
          }

          if (historyRecords && historyRecords.length > 0) {
            // 初次加载时，isReadMode为true且tabIndex=0，需要设置最新批次数据
            const isInitialLoad = isReadMode && tabIndex === 0 && !initialLoadDone;
            loadHistoryData(historyRecords, isReadMode, isInitialLoad);
          }
        } else {
          console.warn(`批次 ${batchNum} 没有数据`);
        }
      }
    } catch (error) {
      console.error('加载历史审核数据失败:', error);
    }
  };

  // 加载历史审核数据
  const loadHistoryDataByBatch = async (tabIndex) => {
    try {
      // tabIndex 是从0开始的，批次号是从1开始的
      // 批次总数 = batchTotal
      // 历史批次编号 = 1, 2, ..., batchTotal
      // tabIndex 0 -> 批次 batchTotal（最新批次）
      // tabIndex 1 -> 批次 batchTotal-1

      // 修改逻辑：如果批次1是最新的，批次4是最早的
      // 那么第一个tab页（tabIndex=0）应该获取批次1，而不是批次4
      // 所以：batchNum = tabIndex + 1
      const batchNum = tabIndex + 1;
      // 确保批次号有效
      if (batchNum >= 1 && batchNum <= batchTotal) {
        const response = await services.selectApprDetails({
          clientId: clientId,
          batchNum: String(batchNum)
        });

        if (response.success && response.data) {
          let historyRecords = [];
          try {
            historyRecords = JSON.parse(response.data);
          } catch (e) {
            console.error('解析历史审核记录数据失败:', e);
            historyRecords = response.data;
          }

          if (historyRecords && historyRecords.length > 0) {
            // fxqkhqr节点tab切换时，不更新上方表格数据（isInitialLoad=false）
            loadHistoryData(historyRecords, isReadOnlyMode, false);
          }
        } else {
          console.warn(`批次 ${batchNum} 没有数据`);
        }
      } else {
        console.warn(`batchNum=${batchNum} 不在有效范围内 [1, ${batchTotal}]，跳过加载`);
      }
    } catch (error) {
      console.error('加载历史审核数据失败:', error);
    }
  };

  // 加载错误类型选项
  const loadErrorTypeOptions = async () => {
    try {
      // 调用接口获取错误类型，传递主体标识
      const response = await services.selectErrType(organFlag);

      // 检查组件是否已挂载
      if (!isMounted.current) {
        return;
      }

      if (response.success && response.data) {
        let errorTypes = [];
        try {
          errorTypes = JSON.parse(response.data);

          const formattedErrorTypes = errorTypes.map((item, index) => ({
            errType: String(index + 1), // 使用索引+1作为key
            errDesc: item // 使用字符串作为显示值
          }));

          if (formattedErrorTypes && formattedErrorTypes.length > 0) {
            setErrorTypeOptions(formattedErrorTypes);

            // 将错误类型选项设置到window对象，供baseActions.js中的completeTask方法使用
            // 注意：这里需要设置到window对象，因为baseActions.js在另一个上下文中执行
            window.errorTypeOptions = formattedErrorTypes;
          } else {
            setErrorTypeOptions([]);
            window.errorTypeOptions = [];
          }
        } catch (e) {
          console.error('解析错误类型数据失败:', e);
          if (Array.isArray(response.data)) {
            const formattedErrorTypes = response.data.map((item, index) => ({
              errType: String(index + 1),
              errDesc: item
            }));
            setErrorTypeOptions(formattedErrorTypes);
            window.errorTypeOptions = formattedErrorTypes;
          } else {
            setErrorTypeOptions([]);
            window.errorTypeOptions = [];
          }
        }
      } else {
        setErrorTypeOptions([]);
        window.errorTypeOptions = [];
      }
    } catch (error) {
      console.error('加载错误类型失败:', error);
      // 检查组件是否已挂载
      if (isMounted.current) {
        // 出错时使用默认数据
        const defaultErrorTypes = [
          { errType: '1', errDesc: '信息填写不完整' },
          { errType: '2', errDesc: '附件缺失' },
          { errType: '3', errDesc: '信息不一致' },
          { errType: '4', errDesc: '资料不清晰' },
          { errType: '5', errDesc: '其他问题' }
        ];
        setErrorTypeOptions(defaultErrorTypes);
        window.errorTypeOptions = defaultErrorTypes;
      }
    }
  };

  // 添加行
  const addRow = () => {
    const newRow = {
      key: Date.now(),
      seq: tableData.length + 1,
      errorType: '',
      problemDesc: ''
    };
    setTableData([...tableData, newRow]);
  };

  // 处理限制措施
  const handleRestriction = async (opFlag) => {
    try {
      // 获取当前登录用户信息
      const userInfo = store.getModelState('user');
      const userName = userInfo?.username || userInfo?.userId || userInfo?.displayName || '';

      const response = await services.updateClientStatus({
        clientId: clientId,
        opFlag: opFlag,
        userName: userName
      });

      if (response && response.success) {
        message.success('操作成功');
      } else {
        message.error(response?.message || '操作失败');
      }
    } catch (error) {
      console.error('更新客户状态失败:', error);
      message.error('操作失败：' + (error.message || '未知错误'));
    }
  };

  // 限制措施菜单
  const restrictionMenu = (
    <Menu>
      <Menu.Item key="strong" onClick={() => handleRestriction('2')}>
        强限制
      </Menu.Item>
      <Menu.Item key="weak" onClick={() => handleRestriction('3')}>
        弱限制
      </Menu.Item>
      <Menu.Item key="release" onClick={() => handleRestriction('0')}>
        解除限制
      </Menu.Item>
    </Menu>
  );

  // 移除行
  const removeRow = (index) => {
    const newData = [...tableData];
    newData.splice(index, 1);
    // 更新序号
    const updatedData = newData.map((item, idx) => ({
      ...item,
      seq: idx + 1
    }));
    setTableData(updatedData);
  };

  // 更新行数据
  const updateRow = (index, field, value) => {
    const newData = [...tableData];
    newData[index] = {
      ...newData[index],
      [field]: value
    };
    setTableData(newData);
  };

  // 提交审核
  const submitApproval = async () => {
    // 校验数据
    const errors = [];
    tableData.forEach((row, index) => {
      if (!row.errorType) {
        errors.push(`请选择第${index + 1}行的错误类型`);
      }
      if (!row.problemDesc) {
        errors.push(`请填写第${index + 1}行的问题描述`);
      }
    });

    if (errors.length > 0) {
      message.error(errors.join('\n'));
      return;
    }

    try {
      message.success('审核提交成功');
      // 清空表单数据
      setTableData([]);
      setRemark('');
      const response = await services.selectBatchTotal({
        clientId: clientId
      });
      if (response.success) {
        const total = parseInt(response.data || '0', 10);
        setBatchTotal(total);
        const tabIndex = parseInt(activeTab);
        if (total > 0 && tabIndex < total) {
          await loadHistoryDataByBatchWithTotal(tabIndex, total, isReadOnlyMode);
        }
      }
    } catch (error) {
      console.error('提交审核失败:', error);
      message.error('提交审核失败');
    }
  };

  // 设置历史数据
  const loadHistoryData = (batchData, isReadMode = false, isInitialLoad = false) => {
    const historyItems = Array.isArray(batchData) ? batchData : [batchData];
    setHistoryData(historyItems.map((item, index) => ({
      key: String(index + 1),
      disposeDesc: item.disposeDesc || '',
      auditDesc: item.auditDesc || '',
      createUser: item.createUser || '', // 表格中显示"提出人"仍使用createUser
      createTime: item.createTime || ''  // 表格中显示"提出时间"仍使用createTime
    })));

    // fxqkhqr节点：只在初次加载时更新上方表格数据
    if (isReadMode && historyItems.length > 0 && isInitialLoad) {
      const tableDataItems = historyItems.map((item, index) => ({
        key: String(Date.now() + index),
        errorType: item.auditDesc || '',
        problemDesc: item.disposeDesc || ''
      }));
      setTableData(tableDataItems);
      setLatestBatchData(tableDataItems); // 保存最新批次数据
    }

    // 设置批次信息 - 从第一条记录获取批次信息（审核人、审核时间、备注）
    // 根据接口文档，使用 batchDisplayName、batchCreateTime、batchRemark 字段
    if (historyItems.length > 0) {
      const firstRecord = historyItems[0];
      const batchInfoData = {
        display_name: firstRecord.batchDisplayName || firstRecord.createUser || '',
        create_time: firstRecord.batchCreateTime || firstRecord.createTime || '',
        remark: firstRecord.batchRemark || firstRecord.remark || firstRecord.auditRemark || ''
      };
      setBatchInfo(batchInfoData);

      // fxqkhqr节点：只在初次加载时设置上方备注
      if (isReadMode && isInitialLoad) {
        const remarkValue = firstRecord.batchRemark || firstRecord.remark || firstRecord.auditRemark || '';
        setRemark(remarkValue);
      }
    }
  };

  // ========== 表格组件配置 ==========
  const tableComponents = {
    header: {
      cell: ResizeableTitle,
    },
  };

  // ========== 表格列定义 ==========
  // 1. 可编辑模式的表格列（支持拖拽）
  const getEditColumns = () => {
    const columns = [
      {
        title: '',
        key: 'seq',
        width: editColumnWidths.seq || 30,
        render: (_, __, index) => index + 1,
        onHeaderCell: (column) => ({
          width: column.width,
          onResize: handleEditResize('seq'),
        }),
      },
      {
        title: '错误类型',
        key: 'errorType',
        width: editColumnWidths.errorType || 140,
        render: (text, record, index) => (
          <Select
            value={record.errorType}
            onChange={(value) => updateRow(index, 'errorType', value)}
            placeholder="请选择"
            style={{ width: '100%' }}
            disabled={!isEditableMode || isReadOnlyMode}
          >
            {errorTypeOptions.map(option => (
              <Option key={option.errType} value={option.errType}>
                {option.errDesc}
              </Option>
            ))}
          </Select>
        ),
        onHeaderCell: (column) => ({
          width: column.width,
          onResize: handleEditResize('errorType'),
        }),
      },
      {
        title: '问题描述',
        key: 'problemDesc',
        width: editColumnWidths.problemDesc || 200,
        render: (text, record, index) => (
          <TextArea
            value={record.problemDesc}
            onChange={(e) => updateRow(index, 'problemDesc', e.target.value)}
            placeholder="请输入"
            autoSize={{ minRows: 1, maxRows: 8 }}
            disabled={!isEditableMode || isReadOnlyMode}
          />
        ),
        onHeaderCell: (column) => ({
          width: column.width,
          onResize: handleEditResize('problemDesc'),
        }),
      }
    ];

    // fxqkhqr节点（只读模式）不显示操作列
    if (!isReadOnlyMode) {
      columns.push({
        title: '',
        key: 'action',
        width: editColumnWidths.action || 20,
        render: (text, record, index) => (
          <Button
            type="link"
            size="small"
            style={{ color: '#F56C6C', padding: '0', border: 'none' }}
            onClick={() => removeRow(index)}
            disabled={!isEditableMode || isReadOnlyMode}
          >
            移除
          </Button>
        ),
        onHeaderCell: (column) => ({
          width: column.width,
          onResize: handleEditResize('action'),
        }),
      });
    }

    return columns;
  };

  // 2. 历史审核记录表格列（支持拖拽）
  const getHistoryColumns = () => {
    return [
      {
        title: '问题分类',
        dataIndex: 'auditDesc',
        width: historyColumnWidths.auditDesc || 150,
        ellipsis: true,
        onHeaderCell: (column) => ({
          width: column.width,
          onResize: handleHistoryResize('auditDesc'),
        }),
      },
      {
        title: '问题内容',
        dataIndex: 'disposeDesc',
        width: historyColumnWidths.disposeDesc || 250,
        render: (text) => (
          <div style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>{text}</div>
        ),
        onHeaderCell: (column) => ({
          width: column.width,
          onResize: handleHistoryResize('disposeDesc'),
        }),
      },
      {
        title: '提出人',
        dataIndex: 'createUser',
        width: historyColumnWidths.createUser || 120,
        ellipsis: true,
        onHeaderCell: (column) => ({
          width: column.width,
          onResize: handleHistoryResize('createUser'),
        }),
      },
      {
        title: '提出时间',
        dataIndex: 'createTime',
        width: historyColumnWidths.createTime || 160,
        ellipsis: true,
        onHeaderCell: (column) => ({
          width: column.width,
          onResize: handleHistoryResize('createTime'),
        }),
      }
    ];
  };

  // 审核表单部分（可复用）
  const renderEditForm = () => {
    // fxqkhqr节点下表格宽度足够时不需要横向滚动条，或者优化滚动条间距
    // const tableScroll = isReadOnlyMode ? undefined : { x: 400 };
    const tableScroll = { x: 400 };
    
    return (
      <div>
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ marginBottom: '16px', color: '#303133' }}>审核问题录入</h4>
          <div style={{ width: '100%', overflow: 'auto', marginBottom: '8px' }}>
            <Table
              dataSource={tableData}
              columns={getEditColumns()}
              pagination={false}
              bordered
              size="small"
              rowKey="key"
              components={tableComponents}
              scroll={tableScroll}
              tableLayout="auto"
            />
          </div>
          {!isReadOnlyMode && curNode?.personType === '1' && (
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <Button
                type="primary"
                onClick={addRow}
              >
                添加行
              </Button>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ color: '#4b4b4b', padding: '20px 0 10px 0' }}>
            备注
          </div>
          <TextArea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="请输入备注"
            rows={3}
            disabled={isReadOnlyMode}
          />
        </div>
      </div>
    );
  };

  // 历史问题记录部分
  const renderHistoryLogs = () => (
    <div>
      <div
        style={{
          color: '#4b4b4b',
          padding: '20px 0 10px 0',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={() => setShowHistoryLogs(!showHistoryLogs)}
      >
        <span>
          {showHistoryLogs ?
            <Icon type="caret-down" /> :
            <Icon type="caret-up" />
          }
        </span>
        <span style={{ marginLeft: '8px' }}>历史问题记录</span>
      </div>

      {showHistoryLogs && (
        <div>
          {batchTotal === 0 ? (
            <div style={{
              color: '#8d8b8b',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              暂无数据
            </div>
          ) : (
            <Tabs activeKey={activeTab} onChange={handleTabClick}>
              {Array.from({ length: Math.max(0, batchTotal) }, (_, index) => {
                const displayBatchNum = batchTotal - index;
                return (
                  <TabPane
                    key={String(index)}
                    tab={`批次${displayBatchNum}`}>
                    <Table
                      dataSource={historyData}
                      columns={getHistoryColumns()}
                      pagination={false}
                      bordered
                      size="small"
                      components={tableComponents}
                      scroll={{ x: 730 }}
                      tableLayout="fixed"
                    />
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ color: '#4b4b4b', padding: '20px 0 10px 0' }}>
                        备注
                      </div>
                      <Input.TextArea value={batchInfo.remark} disabled />
                      <div style={{ color: '#4b4b4b', padding: '10px 0 0 0', textAlign: 'right' }}>
                        审核人: {batchInfo.display_name}
                      </div>
                      <div style={{ color: '#4b4b4b', padding: '10px 0 0 0', textAlign: 'right' }}>
                        审核时间: {batchInfo.create_time}
                      </div>
                    </div>
                  </TabPane>
                );
              })}
            </Tabs>
          )}
        </div>
      )}
    </div>
  );

  // editOnly模式：只显示审核表单，用于右侧面板
  if (mode === 'editOnly') {
    return (
      <Card
        className="box-card"
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '26px 0 16px 20px' }}
        title="审核意见"
        extra={curNode?.personType === '1' && (
          <Dropdown overlay={restrictionMenu} placement="bottomRight">
            <Button type="primary">
              限制措施 <Icon type="down" />
            </Button>
          </Dropdown>
        )}
      >
        <div style={{ flex: 1, overflow: 'auto', paddingRight: '8px' }}>
          {renderEditForm()}
          {/* 历史问题记录 */}
          {renderHistoryLogs()}
        </div>
      </Card>
    );
  }

  // full模式：完整显示（原逻辑）
  return (
    <Card
      className="box-card"
      style={ curNode?.nodeCode === 'fxqkhqr' ? { height: '100%', display: 'flex', flexDirection: 'column' } : {} }
      bodyStyle={ curNode?.nodeCode === 'fxqkhqr' ? { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '26px 0 16px 20px' } : {} }
      id="approvalHistory"
      title="审核记录"
      extra={!isReadOnlyMode && curNode?.personType === '1' && (
        <Dropdown overlay={restrictionMenu} placement="bottomRight">
          <Button type="primary">
            限制措施 <Icon type="down" />
          </Button>
        </Dropdown>
      )}
    >
      <div style={curNode?.nodeCode === 'fxqkhqr' ? { flex: 1, overflow: 'auto', paddingRight: '8px' } : {}}>
        {/* 可编辑模式：审核表单 */}
        {renderEditForm()}

        {/* 历史问题记录 */}
        {renderHistoryLogs()}
      </div>
    </Card>
  );
}

export default ReviewRecord;