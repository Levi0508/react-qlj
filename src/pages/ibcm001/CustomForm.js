import React, { useState, useEffect } from 'react';
import Form from '@/components/IbFlowForm';
import { Input, Tooltip, Row, Col, DatePicker, Select, Table, Tag, Button, message, Radio, Checkbox, InputNumber, Tabs, Anchor, Card, Modal } from 'antd';
import { request } from 'ice';
import { createPortal } from 'react-dom';

import store from '@/store';
import moment from 'moment';

import request001 from './services'
import flowServices from '../../../src/components/sdkGtjaLinkWeb/services/flow';
import styles from './CustomForm.module.less';
import BasicInfo from './components/BasicInfo';
import FxqSpecial from './components/FxqSpecial';
import FileManage from './components/FileManage';
import FeedBack from './components/FeedBack';
import ReviewRecord from './components/ReviewRecord';
import RelatedPerson from './components/RelatedPerson';
import BusinessRelation from './components/BusinessRelation';
import PDFExporter from './components/PDFExporter';

import {
  mockBasicInfo,
  mockRelatedInfo,
  mockAttachments,
  mockFeedback,
  mockDictData
} from './data/mockData';

import dataManager from './utils/dataManager';

const { Item } = Form;
const { Option } = Select;
const { MonthPicker } = DatePicker;
const { TextArea } = Input;

@Form.create()
class CustomForm extends React.Component {
  // 流程代码常量，用于全局函数命名空间隔离
  static FLOW_CODE = 'IBCM001';
  
  constructor(props) {
    super(props);
    const { curNode: propCurNode } = props;
    this.state = {
      curNode: propCurNode || {},
      piid: '',
      tiid: '',
      activeTopTab: 'basic',
      activeSubNav: 'basicInfo',
      loading: false,
      basicInfo: mockBasicInfo,
      relatedInfo: mockRelatedInfo,
      attachments: mockAttachments,
      feedback: mockFeedback,
      clientId: null, // 将从formData的CLIENT_ID获取
      navTop: 225, // 导航栏的动态top值
      dictData: mockDictData, // 字典数据，将从接口获取
      approvalHistory: null, // 审核记录，将从接口获取
      dataLoaded: false, // 防止重复加载数据的标志
      formInitialized: false, // 表单是否已完全初始化
      attachmentUpdateTime: 0, // 附件更新时间戳，用于触发子组件重新查询
      formEditable: false, // 表单组件编辑权限
      reviewEditable: false, // 审核记录编辑权限
      showTestDiv: false,
      reviewPanelWidth: 400, // 右侧审核记录面板宽度（可拖拽调整）
    }
    this.fileManageRef = React.createRef();
    this.fxqSpecialRef = React.createRef(); // 添加 FxqSpecial 组件的 ref
    this.hgryshRightPanelRef = React.createRef();
    this.normalRightPanelRef = React.createRef();
    this.pdfRef = React.createRef();  // 添加PDF导出
    this.activeScrollHandler = null;
    this.activeScrollContainer = null;
    this.scrollRafId = null;
  }

  /**
   * 查询到表单值后调用此方法，方法返回结果将作为最终被渲染的表单值
   */
  handleGetFormData = async (formData, SYS_GUID, curNode, tiid) => {
    // 根据curNode.nodeCode的值控制可编辑状态
    const nodeCode = curNode?.nodeCode;

    // 当curNode.nodeCode === "xmzqr"时：基本信息、关联人信息、反洗钱特殊情况可编辑，审核记录不可编辑
    // 当curNode.nodeCode === "hgrysh"时：基本信息、关联人信息、反洗钱特殊情况不可编辑，审核记录可编辑
    const isXmzqr = nodeCode === "xmzqr";
    const isHgrysh = nodeCode === "hgrysh";

    // 表单组件编辑权限
    const formEditable = isXmzqr; // xmzqr节点下表单可编辑

    // 审核记录编辑权限
    const reviewEditable = isHgrysh; // hgrysh节点下审核记录可编辑

    const { CLIENT_ID, CLIENT_NAME, ORGAN_FLAG, CLIENT_BELONG, CLIENT_STATUS, SYS_PIID } = formData;
    let piid = formData.SYS_PIID;
    this.setState({
      curNode,
      formEditable,  // 表单组件编辑权限
      reviewEditable, // 审核记录编辑权限
      tiid,
      piid,
      clientId: CLIENT_ID, // 设置clientId从formData获取
      formInitialized: true // 标记表单已初始化
    });
  }

  /**
   * 查询到子表单值后调用此方法
   */
  handleGetChildFormData = async (formData, SYS_GUID, curNode) => {
    // 实现逻辑
  }

  // 从props更新curNode状态
  updateCurNodeFromProps = (propCurNode) => {
    if (!propCurNode) return;

    const nodeCode = propCurNode?.nodeCode;

    // 当curNode.nodeCode === "xmzqr"时：基本信息、关联人信息、反洗钱特殊情况可编辑，审核记录不可编辑
    // 当curNode.nodeCode === "hgrysh"时：基本信息、关联人信息、反洗钱特殊情况不可编辑，审核记录可编辑
    const isXmzqr = nodeCode === "xmzqr";
    const isHgrysh = nodeCode === "hgrysh";

    // 表单组件编辑权限
    const formEditable = isXmzqr; // xmzqr节点下表单可编辑

    // 审核记录编辑权限
    const reviewEditable = isHgrysh; // hgrysh节点下审核记录可编辑

    this.setState({
      curNode: propCurNode,
      formEditable,
      reviewEditable
    });
  }

  /**
   * 提交表单前调用此方法，方法返回结果将作为最终被提交出去的表单值
   */
  handleBeforeSubmitForm = async (formData) => {
    if (this.state.childRef) {
      this.state.childRef.savechildren();
    }

    // 处理注册资本金字段：去掉千分位逗号
    if (formData.register_fund && typeof formData.register_fund === 'string') {
      formData.register_fund = formData.register_fund.replace(/,/g, '');
    }

    // 获取表单中的反洗钱特殊情况选择
    const isSpecial = formData.is_special || '0';
    const clientId = formData.CLIENT_ID;

    if (isSpecial === '1' && clientId) {
      try {
        // 获取反洗钱特殊情况相关附件数据 - 从FxqSpecial组件获取
        let fxqAttachmentData = {
          communicationAttachments: [],
          agreeAttachments: [],
          otherAttachments: []
        };


        if (this.fxqSpecialRef.current) {
          fxqAttachmentData = this.fxqSpecialRef.current.getFxqSpecialAttachments();
        } else {
          console.warn('FxqSpecial组件引用未找到，无法获取附件数据');
        }

        // 根据base_edit.xwl中的逻辑，校验必需附件
        const { communicationAttachments, agreeAttachments } = fxqAttachmentData;

        // 如果反洗钱特殊情况选择了"是"，必须上传沟通记录和同意记录
        if (communicationAttachments.length === 0) {
          message.error('请上传"与客户沟通记录"附件');
          throw new Error('请上传"与客户沟通记录"附件');
        }

        if (agreeAttachments.length === 0) {
          message.error('请上传"二级部门负责人同意的记录"附件');
          throw new Error('请上传"二级部门负责人同意的记录"附件');
        }

        // 根据base_edit.xwl中的逻辑，生成attachment object_id字段
        // 如果有附件，则生成 clientId + 'communication' 等格式的object_id
        // 如果没有附件，则传空字符串
        const communicationRecords = communicationAttachments.length > 0 ? `${clientId}communication` : '';
        const agreeRecords = agreeAttachments.length > 0 ? `${clientId}agree` : '';
        const otherRecords = fxqAttachmentData.otherAttachments.length > 0 ? `${clientId}other` : '';

        // 将附件字段添加到表单数据中
        // 注意：后端期望小驼峰格式
        return {
          ...formData,
          communication_records: communicationRecords,
          agree_records: agreeRecords,
          other_records: otherRecords,
          // 同时添加小驼峰格式的字段，确保兼容性
          communicationRecords: communicationRecords,
          agreeRecords: agreeRecords,
          otherRecords: otherRecords
        };

      } catch (error) {
        console.error('反洗钱特殊情况附件校验失败:', error);
        // 抛出错误，阻止表单提交
        throw error;
      }
    }

    // 如果不是反洗钱特殊情况，添加空的附件字段
    return {
      ...formData,
      communication_records: '',
      agree_records: '',
      other_records: '',
      communicationRecords: '',
      agreeRecords: '',
      otherRecords: ''
    };
  }

  /**
   * 提交表单后调用此方法
   */
  handleAfterSubmitForm = async (SYS_GUID, otherParams) => {
    console.log(otherParams);
  }

  // 加载客户数据
  loadClientData = async (clientId) => {
    // 防止重复调用
    if (this.state.loading) {
      return;
    }

    this.setState({ loading: true });

    try {
      const targetClientId = clientId || this.state.clientId; // 优先使用传入的clientId
      if (!targetClientId) {
        this.setState({ loading: false });
        return;
      }

      const userInfo = store.getModelState('user');
      const userId = userInfo?.userId || 'admin'; // 获取用户ID，默认为admin

      // 先获取基本信息和字典数据
      const [dictData, basicInfo] = await Promise.all([
        dataManager.loadAllDictData().catch(() => mockDictData),
        dataManager.getBasicInfo(targetClientId).catch(() => mockBasicInfo)
      ]);

      // 然后获取依赖basicInfo的数据
      const [relatedInfo, attachments, feedback, approvalHistory] = await Promise.all([
        dataManager.getAllRelatedInfo(targetClientId).catch(() => mockRelatedInfo),
        dataManager.getAllAttachments(targetClientId, basicInfo?.organ_flag || '1').catch(() => mockAttachments),
        dataManager.getFeedback(targetClientId, userId).catch(() => mockFeedback),
        dataManager.getApprovalHistory(targetClientId).catch(() => ({ latest: [], history: [] }))
      ]);

      this.setState({
        basicInfo,
        relatedInfo,
        attachments,
        feedback,
        dictData,
        approvalHistory,
        loading: false,
        dataLoaded: true
      });
    } catch (error) {
      console.error('加载客户信息失败:', error);
      // 如果接口调用失败，使用mock数据作为降级方案
      this.setState({
        basicInfo: mockBasicInfo,
        relatedInfo: mockRelatedInfo,
        attachments: mockAttachments,
        feedback: mockFeedback,
        dictData: mockDictData,
        loading: false,
        dataLoaded: false
      });
    }
  }

  // 在当前滚动容器内查找锚点（避免 document.getElementById 命中错误节点）
  findSectionElement = (container, value) => {
    if (!container || !value) return null;
    return container.querySelector(`[id="${value}"]`);
  }

  // 相对滚动容器计算目标位置（offsetTop 会相对外层 .App，导致滚错或不滚）
  getSectionScrollTop = (container, element, offset = 10) => {
    if (!container || !element) return 0;
    const top =
      element.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop;
    return Math.max(0, top - offset);
  }

  // 子导航点击处理
  handleSubNavClick = (value) => {
    this.setState({ activeSubNav: value });
    const container = this.getCurrentScrollContainer();
    if (!container) return;
    const element = this.findSectionElement(container, value);
    if (element) {
      container.scrollTo({
        top: this.getSectionScrollTop(container, element),
        behavior: 'smooth',
      });
    }
  }

  // 获取当前活跃的滚动容器
  // 注意：hgrysh / xmzqr 共用左侧布局和 hgryshRightPanelRef
  getCurrentScrollContainer = () => {
    const { curNode, activeTopTab } = this.state;
    if (activeTopTab !== 'basic') return null;
    if (curNode?.nodeCode === 'hgrysh' || curNode?.nodeCode === 'xmzqr') {
      return this.hgryshRightPanelRef.current;
    }
    return this.normalRightPanelRef.current;
  }

  // 获取当前可用的子导航列表
  getCurrentSubNavList = () => {
    const { basicInfo } = this.state;
    const organFlag = basicInfo?.organ_flag || '1';
    return organFlag === '1'
      ? [
        { value: 'basicInfo' },
        { value: 'fxqSpecial' },
        { value: 'LegalRep' },
        { value: 'controllingShareholder' },
        { value: 'actualController' },
        { value: 'authorizedRep' },
        { value: 'beneficialOwner' },
        { value: 'businessRelation' }
      ]
      : [
        { value: 'basicInfo' },
        { value: 'fxqSpecial' },
        { value: 'businessRelation' }
      ];
  }

  // 根据滚动位置计算当前激活的子导航
  updateActiveSubNavByScroll = () => {
    const container = this.getCurrentScrollContainer();
    if (!container) return;
    const { activeSubNav } = this.state;
    const subNavList = this.getCurrentSubNavList();
    const probeTop = container.scrollTop + 20;

    let matched = subNavList[0]?.value || null;
    for (const item of subNavList) {
      const element = this.findSectionElement(container, item.value);
      if (!element) continue;
      const elementTop = this.getSectionScrollTop(container, element, 0);
      if (elementTop <= probeTop) {
        matched = item.value;
      } else {
        break;
      }
    }
    if (matched && matched !== activeSubNav) {
      this.setState({ activeSubNav: matched });
    }
  }

  // 重新附加滚动监听器（等待DOM稳定后）
  scheduleAttachScrollListener = () => {
    if (this._attachScheduled) return;
    this._attachScheduled = true;
    requestAnimationFrame(() => {
      this._attachScheduled = false;
      this.attachScrollListener();
      this.updateActiveSubNavByScroll();
    });
  }

  // 顶部标签页切换
  handleTopTabChange = (key) => {
    this.setState({ activeTopTab: key });
    if (key === 'basic') {
      this.setState({ activeSubNav: 'basicInfo' });
      this.reloadAttachmentsOnly();
      this.setState({ attachmentUpdateTime: Date.now() });
    }
    console.log('this.state', this.state);

  }
  // 附件信息更新
  handleAttachmentUpdate = () => {
    const { clientId, basicInfo } = this.state;
    if (clientId && basicInfo) {
      // 清除附件缓存
      const organFlag = basicInfo.organ_flag || '1';
      // 清除所有相关附件缓存
      const fileTypeMap = organFlag === '1' ? {
        basicInfo: '1,2,21,22',
        legalRep: '23',
        controllingShareholder: '3,31,32',
        actualController: '4,41,42',
        authorizedRep: '5,51,52',
        beneficialOwner: '6,61,62,63,64'
      } : {
        basicInfo: '1,2'
      };

      Object.values(fileTypeMap).forEach(fileTypeNos => {
        const cacheKey = `attachments_${clientId}_${fileTypeNos}`;
        if (dataManager.cache.attachments[cacheKey]) {
          delete dataManager.cache.attachments[cacheKey];
        }
      });

      // 重新获取附件数据（只获取附件，不获取其他数据）
      this.reloadAttachmentsOnly();
    }
    // 同时更新附件更新时间戳，触发子组件重新查询附件
    this.setState({ attachmentUpdateTime: Date.now() });
  }

  // 关联人信息更新
  handleRelatedPersonUpdate = (data) => {
    const { clientId, relatedInfo } = this.state;
    if (clientId) {
      // 如果data中包含allRelatedInfo（从reloadAllRelatedInfo方法传递）
      if (data && data.allRelatedInfo) {
        try {
          const newRelatedInfo = { ...data.allRelatedInfo };
          this.setState({ relatedInfo: newRelatedInfo });
        } catch (error) {
          console.error('解析allRelatedInfo数据失败:', error);
          // 解析失败时，回退到重新加载所有数据
          this.loadClientData(clientId);
        }
      }
      else if (data && data.data) {
        try {
          const relatedType = data.relatedType;
          const newData = Array.isArray(data.data) ? data.data : JSON.parse(data.data || '[]');
          const newRelatedInfo = { ...relatedInfo };
          switch (relatedType) {
            case '1':
              newRelatedInfo.legalRep = newData;
              break;
            case '2':
              newRelatedInfo.controllingShareholder = newData;
              break;
            case '3':
              newRelatedInfo.actualController = newData;
              break;
            case '4':
              newRelatedInfo.authorizedRep = newData;
              break;
            case '5':
              newRelatedInfo.beneficialOwner = newData;
              break;
          }

          // 更新状态
          this.setState({ relatedInfo: newRelatedInfo });
        } catch (error) {
          // 解析失败时，回退到重新加载所有数据
          this.loadClientData(clientId);
        }
      } else {
        // 如果没有data字段，则重新加载所有数据
        // 清除关联人信息缓存，确保获取最新数据
        if (data && data.relatedType) {
          // 清除特定类型的关联人缓存
          dataManager.clearRelatedInfoCache(clientId, data.relatedType);
        } else {
          // 清除所有关联人缓存
          dataManager.clearRelatedInfoCache(clientId);
        }

        // 强制重新加载数据，不检查dataLoaded状态
        this.loadClientData(clientId);
      }
    } else {
    }
  };

  // 只重新加载附件数据
  reloadAttachmentsOnly = async () => {
    const { clientId, basicInfo, attachments } = this.state;
    if (!clientId || !basicInfo) return;

    try {
      const organFlag = basicInfo.organ_flag || '1';
      const newAttachments = await dataManager.getAllAttachments(clientId, organFlag);
      this.setState({ attachments: newAttachments });
    } catch (error) {
      console.error('重新加载附件数据失败:', error);
      // 失败时不更新状态
    }
  }

  // PDF导出
  handleExportPDF = async () => {
    const { clientId } = this.state;

    // 导出前直接调用后端接口强制刷新数据（绕过dataManager缓存）
    // 确保PDF使用后端最新保存的数据
    if (clientId) {
      try {
        // 1. 直接调用 selectBasicInfo 获取最新基本信息
        const basicResp = await request001.selectBasicInfo({ clientId });
        let newBasicInfo = null;
        if (basicResp.success && basicResp.data) {
          const raw = JSON.parse(basicResp.data)[0];
          newBasicInfo = {
            client_id: raw.clientId || '',
            client_name: raw.clientName || '',
            client_status: raw.clientStatus || '0',
            organ_flag: raw.organFlag || '0',
            office_address: raw.officeAddress || '',
            register_country: raw.registerCountry || '',
            register_money_type: raw.registerMoneyType || '',
            register_fund: raw.registerFund || '',
            industry_type: raw.industryType || '',
            industry_name: raw.industryName || '',
            tel: raw.tel || '',
            setup_date: raw.setupDate || '',
            id_type: raw.idType || '',
            id_no: raw.idNo || '',
            id_begindate: raw.idBegindate || '',
            id_enddate: raw.idEnddate || '',
            busi_scope: raw.busiScope || '',
            province: raw.province || '',
            city: raw.city || '',
            district: raw.district || '',
            nationality: raw.nationality || '00CN',
            gender: raw.gender || '',
            birthday: raw.birthday || '',
            profession_code: raw.professionCode || '',
            income: raw.income || '',
            province1: raw.province1 || '',
            city1: raw.city1 || '',
            district1: raw.district1 || '',
            id_address: raw.idAddress || '',
            province2: raw.province2 || '',
            city2: raw.city2 || '',
            district2: raw.district2 || '',
            address: raw.address || '',
            is_special: raw.isSpecial || '0',
            client_type: raw.clientType || '',
            client_type_other: raw.clientTypeOther || '',
            special_matters: raw.specialMatters || '',
            missing_information: raw.missingInformation || '',
            missing_draft: raw.missingDraft || '',
            special_matters_other: raw.specialMattersOther || '',
            special_reason: raw.specialReason || '',
            completed_cdd: raw.completedCdd || '',
            low_risk_explanation: raw.lowRiskExplanation || '',
            take_measures: raw.takeMeasures || '',
            communication_records: raw.communicationRecords || '',
            agree_records: raw.agreeRecords || '',
            other_records: raw.otherRecords || '',
            associated_date: raw.associatedDate || '',
            remark: raw.remark || ''
          };
        }

        // 2. 直接调用 selectRelatedInfo 获取最新关联人信息（5种类型）
        const relaTypes = ['1', '2', '3', '4', '5'];
        const typeKeys = ['legalRep', 'controllingShareholder', 'actualController', 'authorizedRep', 'beneficialOwner'];
        const relatedRespList = await Promise.all(
          relaTypes.map(t => request001.selectRelatedInfo({ clientId, relatedType: t, dataType: '1' }))
        );
        const newRelatedInfo = {};
        relaTypes.forEach((t, i) => {
          const resp = relatedRespList[i];
          if (resp.success && resp.data) {
            const rawList = JSON.parse(resp.data);
            newRelatedInfo[typeKeys[i]] = rawList.map(item => ({
              address: item.address,
              mobno1: item.mobno1,
              beneficiary: item.beneficiary,
              birthday: item.birthday,
              client_id: item.clientId,
              create_time: item.createTime,
              create_user: item.createUser,
              id_begindate: item.idBegindate,
              id_enddate: item.idEnddate,
              id_no: item.idNo,
              id_type: item.idType,
              is_government_dept: item.isGovernmentDept,
              nationality: item.nationality,
              object_id: item.objectId,
              organ_flag: item.organFlag,
              related_id: item.relatedId,
              related_name: item.relatedName,
              related_type: item.relatedType,
              shareholding_ratio: item.shareholdingRatio,
              update_time: item.updateTime,
              update_user: item.updateUser,
              data_status: item.dataStatus
            }));
          } else {
            newRelatedInfo[typeKeys[i]] = [];
          }
        });

        // 3. 更新state并等待React渲染PDFExporter
        const updates = {};
        if (newBasicInfo) updates.basicInfo = newBasicInfo;
        if (Object.keys(newRelatedInfo).length > 0) updates.relatedInfo = newRelatedInfo;
        if (Object.keys(updates).length > 0) {
          this.setState(updates);
          await new Promise(resolve => requestAnimationFrame(() => resolve()));
          await new Promise(resolve => requestAnimationFrame(() => resolve()));
        }
      } catch (e) {
        console.warn('导出前刷新数据失败，使用现有数据导出:', e);
      }
    }

    if (!this.pdfRef.current) {
      message.error('PDF内容未就绪');
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1800px;height:0;border:none;';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  
    // 获取所有样式（外部+内联）
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => `<link rel="stylesheet" href="${link.href}">`).join('');
    const inlineStyles = Array.from(document.querySelectorAll('style'))
      .map(style => style.innerHTML).join('');

    // 写入 iframe
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
          <head>
          <meta charset="UTF-8">
          ${styles}
          <style>${inlineStyles} body{background:#fff;width:1800px;margin:0 auto;}</style>
        </head>
        <body></body>
      </html>
    `);
    iframeDoc.close();

    // 添加克隆内容
    iframeDoc.body.appendChild(this.pdfRef.current.cloneNode(true));
    // 等待渲染
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const canvas = await html2canvas(iframeDoc.body, {
        scale: window.devicePixelRatio || 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        fontSize: '24px',
        boxSizing: 'border-box',
      });

      const contentWidth = canvas.width;
      const contentHeight = canvas.height;
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const imgWidth = pageWidth - 40;
      const imgHeight = (imgWidth / contentWidth) * contentHeight;
      const pageData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jspdf('', 'pt', 'a4');
      let leftHeight = imgHeight;
      let position = 0;

      if (leftHeight < pageHeight) {
        pdf.addImage(pageData, 'JPEG', 20, 0, imgWidth, imgHeight);
      } else {
        while (leftHeight > 0) {
          pdf.addImage(pageData, 'JPEG', 20, position, imgWidth, imgHeight);
          leftHeight -= pageHeight;
          position -= pageHeight;
          if (leftHeight > 0) {
            pdf.addPage();
          }
        }
      }
        const fileName = `客户基本信息表-【${basicInfo?.client_name || ''}(${clientId || ''})】.pdf`;
        pdf.save(fileName);
        message.success('导出成功');
    } catch (error) {
      console.error('PDF导出失败:', error);
      message.error('导出失败，请重试');
    } finally {
      if (iframe.parentNode) document.body.removeChild(iframe);
    }
  };

  // 编辑功能
  handleEdit = () => {
  }

  // 文件下载处理
  handleFileDownload = (file) => {
    message.success(`开始下载: ${file.name}`);
  }

  // 监听滚动事件，更新活动子导航
  setupScrollListener = () => {
    const listener = () => {
      if (this.scrollRafId) return;
      this.scrollRafId = requestAnimationFrame(() => {
        this.scrollRafId = null;
        this.updateActiveSubNavByScroll();
      });
    };
    this.activeScrollHandler = listener;
    this.attachScrollListener();
    return () => {
      this.detachScrollListener();
      if (this.scrollRafId) {
        cancelAnimationFrame(this.scrollRafId);
        this.scrollRafId = null;
      }
    };
  }

  // 将滚动监听从旧容器迁移到新容器
  attachScrollListener = () => {
    const newContainer = this.getCurrentScrollContainer();
    if (newContainer === this.activeScrollContainer) return;
    if (this.activeScrollContainer && this.activeScrollHandler) {
      this.activeScrollContainer.removeEventListener('scroll', this.activeScrollHandler);
    }
    if (newContainer && this.activeScrollHandler) {
      newContainer.addEventListener('scroll', this.activeScrollHandler, { passive: true });
      this.activeScrollContainer = newContainer;
    } else {
      this.activeScrollContainer = null;
    }
  }

  detachScrollListener = () => {
    if (this.activeScrollContainer && this.activeScrollHandler) {
      this.activeScrollContainer.removeEventListener('scroll', this.activeScrollHandler);
    }
    this.activeScrollContainer = null;
  }

  componentDidMount() {
    const { curNode: propCurNode } = this.props;
    if (propCurNode && propCurNode.nodeCode) {
      this.updateCurNodeFromProps(propCurNode);
    }

    this.scrollCleanup = this.setupScrollListener();
    
    // 使用流程代码作为命名空间，避免不同流程的全局函数相互覆盖
    const flowCode = CustomForm.FLOW_CODE;
    
    // 设置子组件回调函数（保持原有名称，用于子组件调用）
    window.onRelatedPersonUpdate = () => {
      const { clientId } = this.state;
      if (clientId) {
        dataManager.clearRelatedInfoCache(clientId);
        this.loadClientData(clientId);
      }
    };
    
    // 注册带命名空间的全局函数，供baseActions调用
    window[`getRelatedInfo_${flowCode}`] = () => {
      return this.state.relatedInfo;
    };
    window[`validateForm_${flowCode}`] = this.validateIBCM001Form;
    window[`setBasicInfoRequired_${flowCode}`] = this.setBasicInfoRequired;
    window[`scrollToElement_${flowCode}`] = this.scrollToElement;
    window[`switchToApprovalTab_${flowCode}`] = () => {
      this.setState({ activeTopTab: 'approval' });
    };
    
    // 兼容旧的全局函数调用（逐步迁移）
    window.getRelatedInfo = () => {
      console.warn(`[${flowCode}] 使用了旧的全局函数 getRelatedInfo，请迁移到 getRelatedInfo_${flowCode}`);
      return this.state.relatedInfo;
    };
    // 注册校验方法到全局
    window.validateIBCM001Form = this.validateIBCM001Form;
    window.setBasicInfoRequired = this.setBasicInfoRequired;
    window.scrollToElement = this.scrollToElement;
    // 切换到审核记录tab页并获取审核数据
    window.switchToApprovalTab = () => {
      this.setState({ activeTopTab: 'approval' });
    };

    // 添加一个备用的初始化检查：如果3秒后handleGetFormData还没有被调用，尝试从其他来源获取状态
    this.initCheckTimer = setTimeout(() => {
      if (!this.state.curNode || !this.state.curNode.nodeCode) {
        if (window.flowDispatcher) {
          try {
            const flowState = window.flowDispatcher.getState();
            if (flowState && flowState.curNode) {
              this.updateCurNodeFromProps(flowState.curNode);
            }
          } catch (error) {
            console.error('备用检查: 从flowDispatcher获取状态失败:', error);
          }
        }
      }
    }, 3000);

    // 数据将在handleGetFormData中获取clientId后加载
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.curNode !== prevProps.curNode) {
      this.updateCurNodeFromProps(this.props.curNode);
    }
    const { clientId, dataLoaded, formInitialized } = this.state;
    if (clientId && formInitialized && (!dataLoaded || clientId !== prevState.clientId)) {
      this.loadClientData(clientId);
    }
    if (
      this.state.curNode?.nodeCode !== prevState.curNode?.nodeCode ||
      this.state.activeTopTab !== prevState.activeTopTab ||
      this.state.basicInfo?.organ_flag !== prevState.basicInfo?.organ_flag
    ) {
      this.scheduleAttachScrollListener();
    }
  }

  componentWillUnmount() {
    if (this.scrollCleanup) {
      this.scrollCleanup();
    }
    // 清理定时器
    if (this.initCheckTimer) {
      clearTimeout(this.initCheckTimer);
    }
    
    // 使用流程代码作为命名空间
    const flowCode = CustomForm.FLOW_CODE;
    
    // 清理带命名空间的全局函数
    delete window[`getRelatedInfo_${flowCode}`];
    delete window[`validateForm_${flowCode}`];
    delete window[`setBasicInfoRequired_${flowCode}`];
    delete window[`scrollToElement_${flowCode}`];
    delete window[`switchToApprovalTab_${flowCode}`];
    
    // 清理旧的全局函数（兼容）
    delete window.onRelatedPersonUpdate;
    delete window.getRelatedInfo;
    delete window.validateIBCM001Form;
    delete window.setBasicInfoRequired;
    delete window.scrollToElement;
    delete window.switchToApprovalTab;
  }

  /**
   * 滚动到指定元素
   * @param {string} elementId - 元素ID
   */
  scrollToElement = (elementId) => {
    this.setState({ activeTopTab: 'basic' }, () => {
      setTimeout(() => {
        this.scheduleAttachScrollListener();
        const container = this.getCurrentScrollContainer();
        if (!container) return;
        const element = this.findSectionElement(container, elementId);
        if (element) {
          container.scrollTo({
            top: this.getSectionScrollTop(container, element),
            behavior: 'smooth',
          });
          element.style.transition = 'box-shadow 0.3s ease';
          element.style.boxShadow = '0 0 10px 2px rgba(255, 77, 79, 0.5)';
          setTimeout(() => {
            element.style.boxShadow = '';
          }, 2000);
        }
      }, 150);
    });
  }

  /**
   * 设置BasicInfo表单字段的required状态并触发验证
   * @param {boolean} required - 是否必填
   * @returns {Object} { unfilledFields: Array, fieldErrors: Object }
   */
  setBasicInfoRequired = (required) => {
    const { form } = this.props;
    const result = {
      unfilledFields: [],
      fieldErrors: {}
    };

    if (required && form) {
      const organFlag = this.state.basicInfo?.organ_flag || '1';

      // 获取所有字段值
      const values = form.getFieldsValue();

      // 定义必填字段
      let requiredFields = [];
      if (organFlag === '0') {
        // 个人户必填字段
        requiredFields = [
          { field: 'client_name', label: '客户姓名' },
          { field: 'nationality', label: '国籍' },
          { field: 'gender', label: '性别' },
          { field: 'birthday', label: '出生年月' },
          { field: 'tel', label: '联系电话' },
          { field: 'income', label: '年收入' },
          { field: 'profession_code', label: '职业分类' },
          { field: 'id_type', label: '身份证件类型' },
          { field: 'id_no', label: '证件号码' },
          { field: 'id_begindate', label: '证件有效期起始日期' },
          { field: 'id_enddate', label: '证件有效期截止日期' },
          { field: 'id_address', label: '证件地址' },
          { field: 'address', label: '联系地址' },
        ];
      } else {
        // 机构户必填字段
        requiredFields = [
          { field: 'client_name', label: '客户名称' },
          { field: 'office_address', label: '办公地址' },
          { field: 'register_country', label: '注册国家地区' },
          { field: 'register_money_type', label: '注册资本币种' },
          { field: 'register_fund', label: '注册资本金' },
          { field: 'industry_type', label: '行业分类' },
          { field: 'tel', label: '联系电话' },
          { field: 'setup_date', label: '成立日期' },
          { field: 'id_type', label: '证照类型' },
          { field: 'id_no', label: '证照号码' },
          { field: 'id_begindate', label: '证照有效期起始日期' },
          { field: 'id_enddate', label: '证照有效期截止日期' },
          { field: 'busi_scope', label: '经营范围' },
        ];

        // 检查省市区（仅境内）
        const registerCountry = values.register_country;
        if (registerCountry === '00CN') {
          requiredFields.push(
            { field: 'province', label: '省' },
            { field: 'city', label: '市' },
            { field: 'district', label: '区' }
          );
        }
      }

      // 检查未填写的字段并设置错误状态
      const fieldErrors = {};
      requiredFields.forEach(({ field, label }) => {
        const value = values[field];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          result.unfilledFields.push({ field, label, type: 'basicInfo' });
          // 设置字段错误，显示红色边框和错误提示
          fieldErrors[field] = {
            value: value || '',
            errors: [new Error(`${label}不能为空`)]
          };
        }
      });

      // 使用setFields设置错误状态，触发红色边框显示
      if (Object.keys(fieldErrors).length > 0) {
        form.setFields(fieldErrors);
      }

      result.fieldErrors = fieldErrors;
    }

    return result;
  }

  /**
   * IBCM001流程提交前校验
   * @returns {Object} { valid: boolean, errors: Array, scrollTo: string, fieldErrors: Object }
   */
  validateIBCM001Form = () => {
    const { form } = this.props;
    const { basicInfo, relatedInfo, curNode } = this.state;
    const organFlag = basicInfo?.organ_flag || '1';
    const isSpecial = form.getFieldValue('is_special');

    const result = {
      valid: true,
      errors: [],
      scrollTo: null,
      formErrors: {
        basicInfo: [],
        fxqSpecial: [],
        relatedPerson: []
      },
      fieldErrors: {} // 存储字段错误信息
    };

    // hgrysh节点：无需校验反洗钱特殊情况模块和关联人模块
    if (curNode?.nodeCode === 'hgrysh') {
      // 只校验BasicInfo客户基本信息
      const validateResult = this.setBasicInfoRequired(true);
      if (validateResult.unfilledFields.length > 0) {
        result.formErrors.basicInfo = validateResult.unfilledFields;
        result.fieldErrors.basicInfo = validateResult.fieldErrors;
        validateResult.unfilledFields.forEach(({ label }) => {
          result.errors.push(`请填写"${label}"`);
        });
        result.scrollTo = 'basicInfo';
      }
      result.valid = result.errors.length === 0;
      return result;
    }

    // 校验单个关联人记录的必填字段
    const validateRelatedPersonRecord = (record, typeLabel) => {
      const errors = [];
      // 获取是否政府部门标志（默认为非政府部门）
      const isGovDept = record.is_government_dept === '1' || record.isGovernmentDept === '1';
      
      // 机构类型且非政府部门时，校验国家/地区字段
      if (record.organ_flag === '1' || record.organFlag === '1') {
        if (!isGovDept && !record.nationality) {
          errors.push(`${typeLabel}"${record.related_name || record.relatedName || '未命名'}"的"国家或地区"不能为空`);
        }
      } else {
        // 自然人类型，校验国籍字段
        if (!record.nationality) {
          errors.push(`${typeLabel}"${record.related_name || record.relatedName || '未命名'}"的"国籍"不能为空`);
        }
      }
      
      return errors;
    };

    // === 反洗钱特殊情况为"是" ===
    if (isSpecial === '1') {
      // 1. BasicInfo字段非必填，不校验

      // 2. 校验FxqSpecial反洗钱特殊情况模块
      // 注意：FxqSpecial使用的是同一个form实例，字段都注册在form中
      const fxqValues = form.getFieldsValue();
      const fxqFieldErrors = {};

      const requiredSpecialFields = [
        { field: 'client_type', label: '客户类型' },
        { field: 'special_matters', label: '特殊事项' },
        { field: 'special_reason', label: '特殊事项原因' },
        { field: 'completed_cdd', label: '已开展的反洗钱尽职调查工作' },
        { field: 'low_risk_explanation', label: '客户洗钱风险较低的评估说明' },
        { field: 'take_measures', label: '后续措施' }
      ];

      requiredSpecialFields.forEach(({ field, label }) => {
        const value = fxqValues[field];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          result.formErrors.fxqSpecial.push({ field, label });
          result.errors.push(`请填写"${label}"`);
          // 设置字段错误
          fxqFieldErrors[field] = {
            value: value || '',
            errors: [new Error(`${label}不能为空`)]
          };
        }
      });

      // 使用setFields设置错误状态
      if (Object.keys(fxqFieldErrors).length > 0) {
        form.setFields(fxqFieldErrors);
        result.fieldErrors.fxqSpecial = fxqFieldErrors;
      }

      // 3. 校验关联人信息（仅机构户）
      if (organFlag === '1') {
        // 法定代表人
        if (!relatedInfo.legalRep || relatedInfo.legalRep.length === 0) {
          result.formErrors.relatedPerson.push({ type: 'legalRep', label: '法定代表人' });
          result.errors.push('请添加"法定代表人"信息');
        } else {
          // 校验法定代表人内部字段
          relatedInfo.legalRep.forEach(record => {
            const fieldErrors = validateRelatedPersonRecord(record, '法定代表人');
            fieldErrors.forEach(error => result.errors.push(error));
          });
        }

        // 授权代表人
        if (!relatedInfo.authorizedRep || relatedInfo.authorizedRep.length === 0) {
          result.formErrors.relatedPerson.push({ type: 'authorizedRep', label: '授权代表人' });
          result.errors.push('请添加"授权代表人"信息');
        } else {
          // 校验授权代表人内部字段
          relatedInfo.authorizedRep.forEach(record => {
            const fieldErrors = validateRelatedPersonRecord(record, '授权代表人');
            fieldErrors.forEach(error => result.errors.push(error));
          });
        }

        // 受益所有人
        if (!relatedInfo.beneficialOwner || relatedInfo.beneficialOwner.length === 0) {
          result.formErrors.relatedPerson.push({ type: 'beneficialOwner', label: '受益所有人' });
          result.errors.push('请添加"受益所有人"信息');
        } else {
          // 校验受益所有人内部字段
          relatedInfo.beneficialOwner.forEach(record => {
            const fieldErrors = validateRelatedPersonRecord(record, '受益所有人');
            fieldErrors.forEach(error => result.errors.push(error));
          });
        }

        // 控股股东（可选，但如果存在则校验内部字段）
        if (relatedInfo.controllingShareholder && relatedInfo.controllingShareholder.length > 0) {
          relatedInfo.controllingShareholder.forEach(record => {
            const fieldErrors = validateRelatedPersonRecord(record, '控股股东');
            fieldErrors.forEach(error => result.errors.push(error));
          });
        }

        // 实际控制人（可选，但如果存在则校验内部字段）
        if (relatedInfo.actualController && relatedInfo.actualController.length > 0) {
          relatedInfo.actualController.forEach(record => {
            const fieldErrors = validateRelatedPersonRecord(record, '实际控制人');
            fieldErrors.forEach(error => result.errors.push(error));
          });
        }
      }

    } else {
      // === 反洗钱特殊情况为"否" ===
      // 1. 校验BasicInfo所有必填字段
      const validateResult = this.setBasicInfoRequired(true);
      if (validateResult.unfilledFields.length > 0) {
        result.formErrors.basicInfo = validateResult.unfilledFields;
        result.fieldErrors.basicInfo = validateResult.fieldErrors;
        validateResult.unfilledFields.forEach(({ label }) => {
          result.errors.push(`请填写"${label}"`);
        });
      }

      // 2. 反洗钱特殊情况表单不校验

      // 3. 校验关联人信息（仅机构户）
      if (organFlag === '1') {
        // 法定代表人必填
        if (!relatedInfo.legalRep || relatedInfo.legalRep.length === 0) {
          result.formErrors.relatedPerson.push({ type: 'legalRep', label: '法定代表人' });
          result.errors.push('请添加"法定代表人"信息');
        } else {
          // 校验法定代表人内部字段
          relatedInfo.legalRep.forEach(record => {
            const fieldErrors = validateRelatedPersonRecord(record, '法定代表人');
            fieldErrors.forEach(error => result.errors.push(error));
          });
        }

        // 授权代表人必填
        if (!relatedInfo.authorizedRep || relatedInfo.authorizedRep.length === 0) {
          result.formErrors.relatedPerson.push({ type: 'authorizedRep', label: '授权代表人' });
          result.errors.push('请添加"授权代表人"信息');
        } else {
          // 校验授权代表人内部字段
          relatedInfo.authorizedRep.forEach(record => {
            const fieldErrors = validateRelatedPersonRecord(record, '授权代表人');
            fieldErrors.forEach(error => result.errors.push(error));
          });
        }

        // 受益所有人必填
        if (!relatedInfo.beneficialOwner || relatedInfo.beneficialOwner.length === 0) {
          result.formErrors.relatedPerson.push({ type: 'beneficialOwner', label: '受益所有人' });
          result.errors.push('请添加"受益所有人"信息');
        } else {
          // 校验受益所有人内部字段
          relatedInfo.beneficialOwner.forEach(record => {
            const fieldErrors = validateRelatedPersonRecord(record, '受益所有人');
            fieldErrors.forEach(error => result.errors.push(error));
          });
        }

        // 控股股东（可选，但如果存在则校验内部字段）
        if (relatedInfo.controllingShareholder && relatedInfo.controllingShareholder.length > 0) {
          relatedInfo.controllingShareholder.forEach(record => {
            const fieldErrors = validateRelatedPersonRecord(record, '控股股东');
            fieldErrors.forEach(error => result.errors.push(error));
          });
        }

        // 实际控制人（可选，但如果存在则校验内部字段）
        if (relatedInfo.actualController && relatedInfo.actualController.length > 0) {
          relatedInfo.actualController.forEach(record => {
            const fieldErrors = validateRelatedPersonRecord(record, '实际控制人');
            fieldErrors.forEach(error => result.errors.push(error));
          });
        }
      }
    }

    // 设置要滚动的元素
    if (result.formErrors.basicInfo.length > 0) {
      result.scrollTo = 'basicInfo';
    } else if (result.formErrors.fxqSpecial.length > 0) {
      result.scrollTo = 'fxqSpecial';
    } else if (result.formErrors.relatedPerson.length > 0) {
      // 映射关联人类型到元素ID
      const typeToId = {
        'legalRep': 'LegalRep',
        'authorizedRep': 'authorizedRep',
        'beneficialOwner': 'beneficialOwner'
      };
      result.scrollTo = typeToId[result.formErrors.relatedPerson[0].type] || 'LegalRep';
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  // 拖拽调整右侧审核记录面板宽度
  handleReviewPanelResizeStart = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = this.state.reviewPanelWidth || 400;
    const onMove = (ev) => {
      const next = Math.min(Math.max(startWidth + (startX - ev.clientX), 280), 720);
      this.setState({ reviewPanelWidth: next });
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

  render() {
    const { form } = this.props;
    const {
      curNode,
      formEditable,
      reviewEditable,
      activeTopTab,
      activeSubNav,
      loading,
      basicInfo,
      relatedInfo,
      attachments,
      feedback,
      clientId,
      navTop,
      dictData,
      tiid,
      piid,
      attachmentUpdateTime,
      reviewPanelWidth
    } = this.state;

    // 获取反洗钱特殊情况选择值
    const isSpecial = form.getFieldValue('is_special') || '0';

    const { TabPane } = Tabs;
    const { Link } = Anchor;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
      },
    };

    const formLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 4 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 20 },
      },
    };

    // 客户基本信息详情页面的子导航菜单_机构户
    const subNavList_jg = [
      {
        label: '客户基本信息',
        value: 'basicInfo',
        name: '#basicInfo'
      },
      {
        label: '反洗钱特殊情况',
        value: 'fxqSpecial',
        name: '#fxqSpecial'
      },
      {
        label: '法定代表人',
        value: 'LegalRep',
        name: '#LegalRep'
      },
      {
        label: '控股股东',
        value: 'controllingShareholder',
        name: '#controllingShareholder'
      },
      {
        label: '实际控制人',
        value: 'actualController',
        name: '#actualController'
      },
      {
        label: '授权代表人',
        value: 'authorizedRep',
        name: '#authorizedRep'
      },
      {
        label: '受益所有人',
        value: 'beneficialOwner',
        name: '#beneficialOwner'
      }
    ];
    // 客户基本信息详情页面的子导航菜单_个人户
    const subNavList_gr = [
      {
        label: '客户基本信息',
        value: 'basicInfo',
        name: '#basicInfo'
      },
      {
        label: '反洗钱特殊情况',
        value: 'fxqSpecial',
        name: '#fxqSpecial'
      }
    ];

    // 根据客户类型选择子导航菜单
    const organFlag = basicInfo?.organ_flag || '1';
    const subNavList = organFlag === '1' ? subNavList_jg : subNavList_gr;

    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
          <Card loading={true} style={{ width: 400 }}>
            加载中...
          </Card>
        </div>
      );
    }

    return (
      <div className="FormReport">
        <div style={{ backgroundColor: '#eee' }}>
          <Form
            form={form}
            onGetFormData={this.handleGetFormData}
            onGetChildFormData={this.handleGetChildFormData}
            onBeforeSubmitForm={this.handleBeforeSubmitForm}
            onAfterSubmit={this.handleAfterSubmitForm}
            style={{ display: 'none' }}
          >
            <Row className="RowStyle" style={{ display: 'none' }}>
              <Col span={8}>
                <Item {...formItemLayout} label='客户号' field='CLIENT_ID'>
                  {form.getFieldDecorator('CLIENT_ID', { initialValue: '' })(<Input disabled />)}
                </Item>
              </Col>
              <Col span={8}>
                <Item {...formItemLayout} label='客户名称' field='CLIENT_NAME'>
                  {form.getFieldDecorator('CLIENT_NAME', { initialValue: '' })(<Input disabled />)}
                </Item>
              </Col>
              <Col span={8}>
                <Item {...formItemLayout} label='客户类型' field='ORGAN_FLAG'>
                  {form.getFieldDecorator('ORGAN_FLAG', { initialValue: '' })(<Input disabled />)}
                </Item>
              </Col>
              <Col span={8}>
                <Item {...formItemLayout} label='客户归属' field='CLIENT_BELONG'>
                  {form.getFieldDecorator('CLIENT_BELONG', { initialValue: '' })(<Input disabled />)}
                </Item>
              </Col>
              <Col span={8}>
                <Item {...formItemLayout} label='客户状态' field='CLIENT_STATUS'>
                  {form.getFieldDecorator('CLIENT_STATUS', { initialValue: '0' })(<Input disabled />)}
                </Item>
              </Col>
            </Row>
          </Form>
        </div>
        <div className="App" style={{ position: 'relative' }}>
          {/* 顶部工具栏 */}
          <div style={{
            padding: '16px 20px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 1000
          }}>
            <h2 style={{ margin: 0, color: '#262626' }}>

            </h2>

          </div>

          {/* 顶部一级标签页 */}
          <div style={{
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 73,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: '20px',
          }}>
            <Tabs
              activeKey={activeTopTab}
              onChange={this.handleTopTabChange}
              size="large"
              style={{ 
                padding: '0 20px',
                flex: 1,
                minWidth: 0,
              }}
            >
              <TabPane tab="客户基本信息详情" key="basic" />
              <TabPane tab="附件清单" key="attachment" />
              {curNode?.nodeCode !== 'xmzqr' && curNode?.personType === '1' && (
                <TabPane tab="反馈结果" key="feedback" />
              )}
              {/* 审核记录tab只在非hgrysh/xmzqr节点显示（包括流程结束节点） */}
              {curNode?.nodeCode !== 'hgrysh' && curNode?.nodeCode !== 'xmzqr' && (
                <TabPane tab="审核记录" key="approval" />
              )}
            </Tabs>
            <Button onClick={this.handleExportPDF}>
              导出PDF
            </Button>
          </div>

          {/* 内容区域 */}
          <div>
            {/* hgrysh或xmzqr节点：左右布局，左侧tab内容，右侧审核表单 */}
            {(curNode?.nodeCode === 'hgrysh' || curNode?.nodeCode === 'xmzqr') ? (
              <div style={{ display: 'flex', height: 'calc(100vh - 128px)', background: '#fff' }}>
                {/* 左侧：tab内容区域 */}
                <div style={{ flex: '1', minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* 客户基本信息详情页面 */}
                  <div
                    className="main-container"
                    style={{
                      display: activeTopTab === 'basic' ? 'flex' : 'none',
                      flex: '1',
                      minWidth: '900px',
                      height: 0,
                      overflow: 'hidden'
                    }}>
                    {/* 左侧子导航 */}
                    <div className="left-panel" style={{
                      flex: '0 0 200px',
                      width: '200px',
                      height: '100%',
                      padding: '26px 8px',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      <div className="nav-template">
                        {subNavList.map((item) => (
                          <div
                            key={item.value}
                            style={{
                              color: activeSubNav === item.value ? '#1890ff' : '#8c8c8c',
                              cursor: 'pointer',
                              padding: '10px 16px',
                              margin: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: activeSubNav === item.value ? '500' : '400',
                              backgroundColor: activeSubNav === item.value ? '#e6f7ff' : 'transparent',
                              transition: 'all 0.2s ease',
                              position: 'relative',
                              userSelect: 'none',
                            }}
                            onClick={() => this.handleSubNavClick(item.value)}
                            onMouseEnter={(e) => {
                              if (activeSubNav !== item.value) {
                                e.target.style.backgroundColor = '#f5f5f5';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (activeSubNav !== item.value) {
                                e.target.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            {activeSubNav === item.value && (
                              <span style={{
                                position: 'absolute',
                                left: '0',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '3px',
                                height: '16px',
                                backgroundColor: '#1890ff',
                                borderRadius: '0 2px 2px 0'
                              }} />
                            )}
                            {item.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 右侧内容 */}
                    <div
                      ref={this.hgryshRightPanelRef}
                      className="right-panel"
                      style={{
                      flex: '1',
                      minWidth: 0,
                      padding: '23px 20px',
                      height: '100%',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      position: 'relative',
                    }}>
                      {/* 客户基本信息 */}
                      <div id="basicInfo" style={{ scrollMarginTop: `${navTop + 10}px` }}>
                        <BasicInfo
                          basicInfo={basicInfo}
                          dictData={dictData}
                          clientId={clientId}
                          editable={formEditable}
                          form={form}
                          attachmentUpdateTime={attachmentUpdateTime}
                          isSpecial={isSpecial}
                          curNode={curNode}
                        />
                      </div>

                      {/* 反洗钱特殊情况 */}
                      <div id="fxqSpecial" style={{ scrollMarginTop: `${navTop + 10}px`, marginTop: '20px' }}>
                        <FxqSpecial
                          ref={this.fxqSpecialRef}
                          basicInfo={basicInfo}
                          dictData={dictData}
                          clientId={clientId}
                          editable={formEditable}
                          form={form}
                          onAttachmentUpdate={this.handleAttachmentUpdate}
                          attachmentUpdateTime={attachmentUpdateTime}
                        />
                      </div>

                      {/* 法定代表人 - 仅机构户显示 */}
                      {organFlag === '1' && (
                        <div id="LegalRep" style={{ scrollMarginTop: `${navTop + 10}px`, marginTop: '20px' }}>
                          <RelatedPerson
                            title="法定代表人"
                            id="LegalRep"
                            relatedType="1"
                            relatedInfo={relatedInfo.legalRep || []}
                            attachments={attachments.legalRep || []}
                            dictData={dictData}
                            clientId={clientId}
                            editable={formEditable}
                            tiid={tiid}
                            piid={piid}
                            onUpdate={this.handleRelatedPersonUpdate}
                            attachmentUpdateTime={attachmentUpdateTime}
                            isSpecial={isSpecial}
                            curNode={curNode}
                          />
                        </div>
                      )}

                      {/* 控股股东 - 仅机构户显示 */}
                      {organFlag === '1' && (
                        <div id="controllingShareholder" style={{ scrollMarginTop: `${navTop + 10}px`, marginTop: '20px' }}>
                          <RelatedPerson
                            title="控股股东"
                            id="controllingShareholder"
                            relatedType="2"
                            relatedInfo={relatedInfo.controllingShareholder || []}
                            attachments={attachments.controllingShareholder || []}
                            dictData={dictData}
                            clientId={clientId}
                            editable={formEditable}
                            tiid={tiid}
                            piid={piid}
                            onUpdate={this.handleRelatedPersonUpdate}
                            attachmentUpdateTime={attachmentUpdateTime}
                            isSpecial={isSpecial}
                            curNode={curNode}
                          />
                        </div>
                      )}

                      {/* 实际控制人 - 仅机构户显示 */}
                      {organFlag === '1' && (
                        <div id="actualController" style={{ scrollMarginTop: `${navTop + 10}px`, marginTop: '20px' }}>
                          <RelatedPerson
                            title="实际控制人"
                            id="actualController"
                            relatedType="3"
                            relatedInfo={relatedInfo.actualController || []}
                            attachments={attachments.actualController || []}
                            dictData={dictData}
                            clientId={clientId}
                            editable={formEditable}
                            tiid={tiid}
                            piid={piid}
                            onUpdate={this.handleRelatedPersonUpdate}
                            attachmentUpdateTime={attachmentUpdateTime}
                            isSpecial={isSpecial}
                            curNode={curNode}
                          />
                        </div>
                      )}

                      {/* 授权代表人 - 仅机构户显示 */}
                      {organFlag === '1' && (
                        <div id="authorizedRep" style={{ scrollMarginTop: `${navTop + 10}px`, marginTop: '20px' }}>
                          <RelatedPerson
                            title="授权代表人"
                            id="authorizedRep"
                            relatedType="4"
                            relatedInfo={relatedInfo.authorizedRep || []}
                            attachments={attachments.authorizedRep || []}
                            dictData={dictData}
                            clientId={clientId}
                            editable={formEditable}
                            tiid={tiid}
                            piid={piid}
                            onUpdate={this.handleRelatedPersonUpdate}
                            attachmentUpdateTime={attachmentUpdateTime}
                            isSpecial={isSpecial}
                            curNode={curNode}
                          />
                        </div>
                      )}

                      {/* 受益所有人 - 仅机构户显示 */}
                      {organFlag === '1' && (
                        <div id="beneficialOwner" style={{ scrollMarginTop: `${navTop + 10}px`, marginTop: '20px' }}>
                          <RelatedPerson
                            title="受益所有人"
                            id="beneficialOwner"
                            relatedType="5"
                            relatedInfo={relatedInfo.beneficialOwner || []}
                            attachments={attachments.beneficialOwner || []}
                            dictData={dictData}
                            clientId={clientId}
                            editable={formEditable}
                            tiid={tiid}
                            piid={piid}
                            onUpdate={this.handleRelatedPersonUpdate}
                            attachmentUpdateTime={attachmentUpdateTime}
                            isSpecial={isSpecial}
                            curNode={curNode}
                          />
                        </div>
                      )}

                      {/* 业务关系信息 */}
                      <div id="businessRelation" style={{ scrollMarginTop: `${navTop + 10}px`, marginTop: '20px' }}>
                        <BusinessRelation
                          basicInfo={basicInfo}
                          editable={formEditable}
                          form={form}
                          organ_flag={basicInfo.organ_flag}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 附件清单页面 */}
                  <div style={{ display: activeTopTab === 'attachment' ? 'block' : 'none', flex: '1', overflow: 'auto', padding: '20px' }}>
                    <FileManage
                      ref={this.fileManageRef}
                      organFlag={basicInfo.organ_flag}
                      clientId={clientId}
                      editable={formEditable}
                      onAttachmentUpdate={this.handleAttachmentUpdate}
                    />
                  </div>

                  {/* 反馈结果页面 - xmzqr节点不显示 */}
                  {curNode?.nodeCode !== 'xmzqr' && curNode?.personType === '1' && (
                    <div style={{ display: activeTopTab === 'feedback' ? 'block' : 'none', flex: '1', overflow: 'auto', padding: '20px' }}>
                      <FeedBack feedback={feedback} dictData={dictData} />
                    </div>
                  )}
                </div>

                {/* 中间：可拖拽分隔条 */}
                <div
                  onMouseDown={this.handleReviewPanelResizeStart}
                  title="拖拽调整审核记录宽度"
                  style={{
                    width: '6px',
                    flexShrink: 0,
                    cursor: 'col-resize',
                    background: '#e8e8e8',
                    position: 'relative',
                    zIndex: 2,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#91d5ff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#e8e8e8'; }}
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

                {/* 右侧：审核意见面板 */}
                <div style={{
                  width: `${reviewPanelWidth || 400}px`,
                  flexShrink: 0,
                  padding: '16px 0 0 0',
                  overflowY: 'auto',
                  background: '#fafafa'
                }}>
                  <ReviewRecord
                    clientId={clientId}
                    curNode={curNode}
                    editable={reviewEditable}
                    organFlag={basicInfo?.organ_flag || '1'}
                    mode={curNode?.nodeCode === 'hgrysh' ? 'editOnly' : 'full'}
                  />
                </div>
              </div>
            ) : (
              /* 非hgrysh/xmzqr节点：原有布局 */
              <>
                {/* 客户基本信息详情页面 */}
                <div
                  className="main-container"
                  style={{
                    display: activeTopTab === 'basic' ? 'flex' : 'none',
                    background: '#fff',
                    height: 'calc(100vh - 128px)',
                    minWidth: '1200px'
                  }}>
                  {/* 左侧子导航 */}
                  <div className="left-panel" style={{
                    flex: '0 0 200px',
                    width: '200px',
                    height: '100%',
                    padding: '16px 8px',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <div className="nav-template">
                      {subNavList.map((item) => (
                        <div
                          key={item.value}
                          style={{
                            color: activeSubNav === item.value ? '#1890ff' : '#8c8c8c',
                            cursor: 'pointer',
                            padding: '10px 16px',
                            margin: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: activeSubNav === item.value ? '500' : '400',
                            backgroundColor: activeSubNav === item.value ? '#e6f7ff' : 'transparent',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            userSelect: 'none',
                          }}
                          onClick={() => this.handleSubNavClick(item.value)}
                          onMouseEnter={(e) => {
                            if (activeSubNav !== item.value) {
                              e.target.style.backgroundColor = '#f5f5f5';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeSubNav !== item.value) {
                              e.target.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {activeSubNav === item.value && (
                            <span style={{
                              position: 'absolute',
                              left: '0',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '3px',
                              height: '16px',
                              backgroundColor: '#1890ff',
                              borderRadius: '0 2px 2px 0'
                            }} />
                          )}
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 右侧内容 */}
                  <div
                    ref={this.normalRightPanelRef}
                    className="right-panel"
                    style={{
                      flex: '1',
                      minWidth: 0,
                      padding: '20px',
                      height: '100%',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      position: 'relative',
                    }}>
                    {/* 客户基本信息 */}
                    <div id="basicInfo" style={{ scrollMarginTop: `${navTop + 10}px` }}>
                      <BasicInfo
                        basicInfo={basicInfo}
                        dictData={dictData}
                        clientId={clientId}
                        editable={formEditable}
                        form={form}
                        attachmentUpdateTime={attachmentUpdateTime}
                        isSpecial={isSpecial}
                      />
                    </div>

                    {/* 反洗钱特殊情况 */}
                    <div id="fxqSpecial" style={{ scrollMarginTop: `${navTop + 10}px`, marginTop: '20px' }}>
                      <FxqSpecial
                        ref={this.fxqSpecialRef}
                        basicInfo={basicInfo}
                        dictData={dictData}
                        clientId={clientId}
                        editable={formEditable}
                        form={form}
                        onAttachmentUpdate={this.handleAttachmentUpdate}
                        attachmentUpdateTime={attachmentUpdateTime}
                      />
                    </div>

                    {/* 法定代表人 - 仅机构户显示 */}
                    {organFlag === '1' && (
                      <div id="LegalRep" style={{ scrollMarginTop: `${navTop + 10}px`, marginTop: '20px' }}>
                        <RelatedPerson
                          title="法定代表人"
                          id="LegalRep"
                          relatedType="1"
                          relatedInfo={relatedInfo.legalRep || []}
                          attachments={attachments.legalRep || []}
                          dictData={dictData}
                          clientId={clientId}
                          editable={formEditable}
                          tiid={tiid}
                          piid={piid}
                          onUpdate={this.handleRelatedPersonUpdate}
                          attachmentUpdateTime={attachmentUpdateTime}
                          isSpecial={isSpecial}
                        />
                      </div>
                    )}

                    {/* 控股股东 - 仅机构户显示 */}
                    {organFlag === '1' && (
                      <div id="controllingShareholder" style={{ scrollMarginTop: `${navTop + 10}px`, marginTop: '20px' }}>
                        <RelatedPerson
                          title="控股股东"
                          id="controllingShareholder"
                          relatedType="2"
                          relatedInfo={relatedInfo.controllingShareholder || []}
                          attachments={attachments.controllingShareholder || []}
                          dictData={dictData}
                          clientId={clientId}
                          editable={formEditable}
                          tiid={tiid}
                          piid={piid}
                          onUpdate={this.handleRelatedPersonUpdate}
                          attachmentUpdateTime={attachmentUpdateTime}
                          isSpecial={isSpecial}
                        />
                      </div>
                    )}

                    {/* 实际控制人 - 仅机构户显示 */}
                    {organFlag === '1' && (
                      <div id="actualController" style={{ scrollMarginTop: `${navTop + 10}px`, marginTop: '20px' }}>
                        <RelatedPerson
                          title="实际控制人"
                          id="actualController"
                          relatedType="3"
                          relatedInfo={relatedInfo.actualController || []}
                          attachments={attachments.actualController || []}
                          dictData={dictData}
                          clientId={clientId}
                          editable={formEditable}
                          tiid={tiid}
                          piid={piid}
                          onUpdate={this.handleRelatedPersonUpdate}
                          attachmentUpdateTime={attachmentUpdateTime}
                          isSpecial={isSpecial}
                        />
                      </div>
                    )}

                    {/* 授权代表人 - 仅机构户显示 */}
                    {organFlag === '1' && (
                      <div id="authorizedRep" style={{ scrollMarginTop: `${navTop + 10}px`, marginTop: '20px' }}>
                        <RelatedPerson
                          title="授权代表人"
                          id="authorizedRep"
                          relatedType="4"
                          relatedInfo={relatedInfo.authorizedRep || []}
                          attachments={attachments.authorizedRep || []}
                          dictData={dictData}
                          clientId={clientId}
                          editable={formEditable}
                          tiid={tiid}
                          piid={piid}
                          onUpdate={this.handleRelatedPersonUpdate}
                          attachmentUpdateTime={attachmentUpdateTime}
                          isSpecial={isSpecial}
                        />
                      </div>
                    )}

                    {/* 受益所有人 - 仅机构户显示 */}
                    {organFlag === '1' && (
                      <div id="beneficialOwner" style={{ scrollMarginTop: `${navTop + 10}px`, marginTop: '20px' }}>
                        <RelatedPerson
                          title="受益所有人"
                          id="beneficialOwner"
                          relatedType="5"
                          relatedInfo={relatedInfo.beneficialOwner || []}
                          attachments={attachments.beneficialOwner || []}
                          dictData={dictData}
                          clientId={clientId}
                          editable={formEditable}
                          tiid={tiid}
                          piid={piid}
                          onUpdate={this.handleRelatedPersonUpdate}
                          attachmentUpdateTime={attachmentUpdateTime}
                          isSpecial={isSpecial}
                        />
                      </div>
                    )}

                    {/* 业务关系信息 */}
                    <div id="businessRelation" style={{ scrollMarginTop: `${navTop + 10}px`, marginTop: '20px' }}>
                      <BusinessRelation
                        basicInfo={basicInfo}
                        editable={formEditable}
                        form={form}
                        organ_flag={basicInfo.organ_flag}
                      />
                    </div>
                  </div>
                </div>

                {/* 附件清单页面 */}
                <div style={{ paddingTop: '30px', display: activeTopTab === 'attachment' ? 'block' : 'none' }}>
                  <FileManage
                    ref={this.fileManageRef}
                    organFlag={basicInfo.organ_flag}
                    clientId={clientId}
                    editable={formEditable}
                    onAttachmentUpdate={this.handleAttachmentUpdate}
                  />
                </div>

                {/* 反馈结果页面 - xmzqr节点不显示 */}
                {curNode?.nodeCode !== 'xmzqr' && curNode?.personType === '1' && (
                  <div style={{ paddingTop: '30px', display: activeTopTab === 'feedback' ? 'block' : 'none' }}>
                    <FeedBack feedback={feedback} dictData={dictData} />
                  </div>
                )}

                {/* 审核记录页面 - 仅hgrysh节点不显示，结束节点显示 */}
                {curNode?.nodeCode !== 'hgrysh' && (
                  <div style={{ paddingTop: '30px', display: activeTopTab === 'approval' ? 'block' : 'none' }}>
                    <ReviewRecord
                      clientId={clientId}
                      curNode={curNode}
                      editable={reviewEditable}
                      organFlag={basicInfo?.organ_flag || '1'}
                      mode="full"
                    />
                  </div>
                )}
              </>
            )}
          </div>
          {/* PDF内容 - 隐藏 */}
          <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -9999 }}>
            <PDFExporter
              ref={this.pdfRef}
              basicInfo={basicInfo}
              relatedInfo1={relatedInfo.legalRep || []}
              relatedInfo2={relatedInfo.controllingShareholder || []}
              relatedInfo3={relatedInfo.actualController || []}
              relatedInfo4={relatedInfo.authorizedRep || []}
              relatedInfo5={relatedInfo.beneficialOwner || []}
              organFlag={basicInfo?.organ_flag || '1'}
              dictData={dictData}
              visible={true}
            />
          </div>
        </div>
      </div>
      // </div>
    )
  }
}

export default CustomForm;