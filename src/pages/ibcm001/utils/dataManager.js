import request001 from '../services';

/**
 * 数据管理器 - 负责所有接口数据的获取和转换
 * 参考 base_preview.xwl 中的数据获取模式
 */
class DataManager {
  constructor() {
    this.cache = {
      dictData: {},
      selectList: {},
      basicInfo: null,
      relatedInfo: {},
      attachments: {},
      feedback: null,
      approvalHistory: null,
      batchTotal: undefined
    };
  }

  /**
   * 获取字典数据 - 参考 getDictMap 方法
   * @param {string} entryNo - 字典条目编号
   * @returns {Promise<Array>} 字典数据数组
   */
  async getDictData(entryNo) {
    const cacheKey = `dict_${entryNo}`;
    if (this.cache.dictData[cacheKey]) {
      return this.cache.dictData[cacheKey];
    }

    try {
      const response = await request001.selectDict({
        entryNo: entryNo
      });

      if (response.success && response.data) {
        const data = JSON.parse(response.data);
        const items = data.map(item => ({
          k: item.k || item.key,
          v: item.v || item.value
        }));
        this.cache.dictData[cacheKey] = items;
        return items;
      }
      return [];
    } catch (error) {
      console.error(`获取字典数据失败 ${entryNo}:`, error);
      return [];
    }
  }

  /**
   * 获取键值数据 - 参考 loadSelectList 方法
   * @param {string} keyName - 键名称
   * @param {string} bindData - 绑定数据字段
   * @returns {Promise<Array>} 键值数据数组
   */
  async getSelectKeyData(keyName, bindData) {
    const cacheKey = `select_${bindData}`;
    if (this.cache.selectList[cacheKey]) {
      return this.cache.selectList[cacheKey];
    }

    try {
      const response = await request001.selectKey({
        keyName: keyName
      });

      if (response.success && response.data) {
        const data = JSON.parse(response.data);
        const items = data.map(item => ({
          k: item.k || item.key,
          v: item.v || item.value
        }));
        this.cache.selectList[cacheKey] = items;
        return items;
      }
      return [];
    } catch (error) {
      console.error(`获取键值数据失败 ${keyName}:`, error);
      return [];
    }
  }

  /**
   * 批量获取字典数据 - 参考 base_preview.xwl 中的批量加载
   * @returns {Promise<Object>} 所有字典数据
   */
  async loadAllDictData() {
    // 检查是否已经缓存了字典数据
    if (Object.keys(this.cache.dictData).length > 0) {
      const dictData = {};
      Object.keys(this.cache.dictData).forEach(key => {
        if (key.startsWith('dict_')) {
          const cacheData = this.cache.dictData[key];
          // 从缓存键中提取字典类型
          const dictType = key.replace('dict_', '');
          dictData[`${dictType}_list`] = cacheData;
        } else if (key.startsWith('select_')) {
          const cacheData = this.cache.selectList[key];
          // 从缓存键中提取字典类型
          const dictType = key.replace('select_', '');
          dictData[`${dictType}_list`] = cacheData;
        }
      });
      return dictData;
    }

    const dictConfigs = [
      { entryNo: '1040', bindData: 'nationality' }, // 国籍
      { entryNo: 'PROFESSION_CODE', bindData: 'profession_code' }, // 职业分类
      { entryNo: 'BENEFICIAL_TYPE', bindData: 'beneficiary' } // 受益所有人类型
    ];

    const keyConfigs = [
      { keyName: 'currency_type', bindData: 'register_money_type' }, // 注册资本币种
      { keyName: 'industry_type', bindData: 'industry_type' }, // 行业分类
      { keyName: 'id_type', bindData: 'id_type' }, // 证件类型
      { keyName: 'id_type_jg', bindData: 'id_type_jg' }, // 机构证件类型
      { keyName: 'id_type_gr', bindData: 'id_type_gr' }, // 个人证件类型
      { keyName: 'year_income', bindData: 'year_income' }, // 年收入
      { keyName: 'related_type', bindData: 'related_type' }, // 关联人类型
      { keyName: 'grade_value', bindData: 'grade_value' }, // 风险等级
      { keyName: 'client_type', bindData: 'client_type' }, // 客户类型
      { keyName: 'special_matters', bindData: 'special_matters' }, // 特殊事项
      { keyName: 'client_status', bindData: 'client_status' } // 客户状态
    ];

    try {
      // 并行获取所有字典数据
      const dictPromises = dictConfigs.map(config => 
        this.getDictData(config.entryNo).then(data => ({
          bindData: config.bindData,
          data
        }))
      );

      const keyPromises = keyConfigs.map(config => 
        this.getSelectKeyData(config.keyName, config.bindData).then(data => ({
          bindData: config.bindData,
          data
        }))
      );

      const results = await Promise.all([...dictPromises, ...keyPromises]);
      
      // 组装最终的字典数据对象
      const dictData = {};
      results.forEach(result => {
        dictData[`${result.bindData}_list`] = result.data;
      });
      return dictData;
    } catch (error) {
      console.error('批量获取字典数据失败:', error);
      return {};
    }
  }

  /**
   * 获取客户基本信息 - 参考 getBasicInfo 方法
   * @param {string} clientId - 客户ID
   * @returns {Promise<Object>} 客户基本信息
   */
  async getBasicInfo(clientId) {
    if (this.cache.basicInfo && this.cache.basicInfo.client_id === clientId) {
      return this.cache.basicInfo;
    }

    try {
      const response = await request001.selectBasicInfo({
        clientId: clientId
      });

      if (response.success && response.data) {
        const dataStr = response.data;
        const dataArray = JSON.parse(dataStr);
        const basicInfoData = dataArray[0];

        // 数据映射，参考原有映射逻辑
        const formattedBasicInfo = {
          client_id: basicInfoData.clientId || '',
          client_name: basicInfoData.clientName || '',
          client_status: basicInfoData.clientStatus || '0',
          organ_flag: basicInfoData.organFlag || '0',
          
          // 机构户信息
          office_address: basicInfoData.officeAddress || '',
          register_country: basicInfoData.registerCountry || '',
          register_money_type: basicInfoData.registerMoneyType || '',
          register_fund: basicInfoData.registerFund || '',
          industry_type: basicInfoData.industryType || '',
          industry_name: basicInfoData.industryName || '',
          tel: basicInfoData.tel || '',
          setup_date: basicInfoData.setupDate || '',
          id_type: basicInfoData.idType || '',
          id_no: basicInfoData.idNo || '',
          id_begindate: basicInfoData.idBegindate || '',
          id_enddate: basicInfoData.idEnddate || '',
          busi_scope: basicInfoData.busiScope || '',
          province: basicInfoData.province || '',
          city: basicInfoData.city || '',
          district: basicInfoData.district || '',
          
          // 个人户信息
          nationality: basicInfoData.nationality || '00CN',
          gender: basicInfoData.gender || '',
          birthday: basicInfoData.birthday || '',
          profession_code: basicInfoData.professionCode || '',
          income: basicInfoData.income || '',
          province1: basicInfoData.province1 || '',
          city1: basicInfoData.city1 || '',
          district1: basicInfoData.district1 || '',
          id_address: basicInfoData.idAddress || '',
          province2: basicInfoData.province2 || '',
          city2: basicInfoData.city2 || '',
          district2: basicInfoData.district2 || '',
          address: basicInfoData.address || '',
          
          // 反洗钱特殊情况
          is_special: basicInfoData.isSpecial || '0',
          client_type: basicInfoData.clientType || '',
          client_type_other: basicInfoData.clientTypeOther || '',
          special_matters: basicInfoData.specialMatters || '',
          missing_information: basicInfoData.missingInformation || '',
          missing_draft: basicInfoData.missingDraft || '',
          special_matters_other: basicInfoData.specialMattersOther || '',
          special_reason: basicInfoData.specialReason || '',
          completed_cdd: basicInfoData.completedCdd || '',
          low_risk_explanation: basicInfoData.lowRiskExplanation || '',
          take_measures: basicInfoData.takeMeasures || '',
          communication_records: basicInfoData.communicationRecords || '',
          agree_records: basicInfoData.agreeRecords || '',
          other_records: basicInfoData.otherRecords || '',
          
          // 业务关系信息
          associated_date: basicInfoData.associatedDate || '',
          remark: basicInfoData.remark || ''
        };

        this.cache.basicInfo = formattedBasicInfo;
        return formattedBasicInfo;
      }
      return null;
    } catch (error) {
      console.error('获取客户基本信息失败:', error);
      return null;
    }
  }

  /**
   * 获取关联人信息 - 参考 getRelatedInfo 方法
   * @param {string} clientId - 客户ID
   * @param {string} relaType - 关联人类型
   * @returns {Promise<Array>} 关联人信息列表
   */
  async getRelatedInfo(clientId, relaType) {
    const cacheKey = `related_${clientId}_${relaType}`;
    if (this.cache.relatedInfo[cacheKey]) {
      return this.cache.relatedInfo[cacheKey];
    }

    try {
      const response = await request001.selectRelatedInfo({
        clientId: clientId,
        relatedType: relaType,
        dataType: '1' //1-正式 0-草稿 能在流程中发起审核的一定是正式客户
      });

      if (response.success && response.data) {
        const data = JSON.parse(response.data);
        // 添加字段名映射，将驼峰式转换为下划线式
        const mappedData = data.map(item => ({
          address: item.address,
          mobno1:item.mobno1,
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
          data_status:item.dataStatus
        }));
        
        this.cache.relatedInfo[cacheKey] = mappedData;
        return mappedData;
      }
      return [];
    } catch (error) {
      console.error(`获取关联人信息失败 ${relaType}:`, error);
      return [];
    }
  }

  /**
   * 获取所有关联人信息
   * @param {string} clientId - 客户ID
   * @returns {Promise<Object>} 所有类型的关联人信息
   */
  async getAllRelatedInfo(clientId) {
    const relaTypes = ['1', '2', '3', '4', '5']; // 法定代表人、控股股东、实际控制人、授权代表人、受益所有人
    const typeKeys = ['legalRep', 'controllingShareholder', 'actualController', 'authorizedRep', 'beneficialOwner'];
    
    try {
      const promises = relaTypes.map((type, index) => 
        this.getRelatedInfo(clientId, type).then(data => ({
          key: typeKeys[index],
          data
        }))
      );

      const results = await Promise.all(promises);
      const allRelatedInfo = {};
      results.forEach(result => {
        allRelatedInfo[result.key] = result.data;
      });

      return allRelatedInfo;
    } catch (error) {
      console.error('批量获取关联人信息失败:', error);
      return {
        legalRep: [],
        controllingShareholder: [],
        actualController: [],
        authorizedRep: [],
        beneficialOwner: []
      };
    }
  }

  /**
   * 获取附件信息 - 参考 selectFile 方法
   * @param {string} clientId - 客户ID
   * @param {string} fileTypeNo - 文件类型编号
   * @returns {Promise<Array>} 附件信息列表
   */
  async getAttachments(clientId, fileTypeNo) {
    const cacheKey = `attachments_${clientId}_${fileTypeNo}`;
    if (this.cache.attachments[cacheKey]) {
      return this.cache.attachments[cacheKey];
    }

    try {
      const response = await request001.selectFileList({
        clientId: clientId,
        fileTypeNo: fileTypeNo,
        objectId: ''
      });

      if (response.success && response.data) {
        const data = JSON.parse(response.data);
        this.cache.attachments[cacheKey] = data;
        return data;
      }
      return [];
    } catch (error) {
      console.error(`获取附件信息失败 ${fileTypeNo}:`, error);
      return [];
    }
  }

  /**
   * 根据objectId获取附件信息 - 用于反洗钱特殊情况附件
   * @param {string} clientId - 客户ID
   * @param {string} objectId - 对象ID
   * @returns {Promise<Array>} 附件信息列表
   */
  async selectFileList(clientId, objectId) {
    const cacheKey = `attachments_${clientId}_${objectId}`;
    if (this.cache.attachments[cacheKey]) {
      return this.cache.attachments[cacheKey];
    }

    try {
      const response = await request001.selectFileList({
        clientId: clientId,
        fileTypeNo: '',
        objectId: objectId
      });

      if (response.success && response.data) {
        const data = JSON.parse(response.data);
        this.cache.attachments[cacheKey] = data;
        return data;
      }
      return [];
    } catch (error) {
      console.error(`获取附件信息失败 ${objectId}:`, error);
      return [];
    }
  }

  /**
   * 获取所有附件信息
   * @param {string} clientId - 客户ID
   * @param {string} organFlag - 机构标识 (0=个人户, 1=机构户)
   * @returns {Promise<Object>} 所有附件信息
   */
  async getAllAttachments(clientId, organFlag) {
    // 根据机构标识定义文件类型映射
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

    try {
      const promises = Object.entries(fileTypeMap).map(([key, fileTypeNos]) => 
        this.getAttachments(clientId, fileTypeNos).then(data => ({
          key,
          data
        }))
      );

      const results = await Promise.all(promises);
      const allAttachments = {};
      results.forEach(result => {
        allAttachments[result.key] = result.data;
      });

      return allAttachments;
    } catch (error) {
      console.error('批量获取附件信息失败:', error);
      return {};
    }
  }

  /**
   * 获取反馈信息 - 参考 getFeedBackInfo 方法
   * @param {string} clientId - 客户ID
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 反馈信息
   */
  async getFeedback(clientId, userId) {
    const cacheKey = `feedback_${clientId}_${userId}`;
    if (this.cache.feedback && this.cache.feedback[cacheKey]) {
      return this.cache.feedback[cacheKey];
    }
    try {
      const [feedbackResponse, descResponse] = await Promise.all([
        request001.selectFeedBack({
          clientId: clientId,
          userId: userId
        }),
        request001.selectFeedBackDesc({
          clientId: clientId,
          userId: userId
        })
      ]);

      let feedbackData = {};
      
      // 处理反馈结果数据
      if (feedbackResponse.success && feedbackResponse.data) {
        const data = JSON.parse(feedbackResponse.data);
        feedbackData = { ...data[0] } || {};
      }

      // 处理问题描述数据
      if (descResponse.success && descResponse.data) {
        const descData = JSON.parse(descResponse.data);
        feedbackData.problem_desc = descData[0]?.screen_desc || '';
      }

      // 缓存结果
      if (!this.cache.feedback) {
        this.cache.feedback = {};
      }
      this.cache.feedback[cacheKey] = feedbackData;
      
      return feedbackData;
    } catch (error) {
      console.error('获取反馈信息失败:', error);
      return null;
    }
  }

  /**
   * 获取审核批次总数 - 参考 getBatchTotal 方法
   * @param {string} clientId - 客户ID
   * @returns {Promise<number>} 批次总数
   */
  async getBatchTotal(clientId) {
    const cacheKey = `batchTotal_${clientId}`;
    if (this.cache.batchTotal !== undefined) {
      return this.cache.batchTotal;
    }

    try {
      const response = await request001.selectBatchTotal({
        clientId: clientId
      });

      if (response.success && response.data) {
        const data = JSON.parse(response.data);
        const batchTotal = data[0]?.cnt || 0;
        this.cache.batchTotal = batchTotal;
        return batchTotal;
      }
      return 0;
    } catch (error) {
      console.error('获取审核批次总数失败:', error);
      return 0;
    }
  }

  /**
   * 获取审核记录 - 参考 getApprData 方法
   * @param {string} clientId - 客户ID
   * @param {number} batchNum - 批次号 (0=最新批次, 1,2,...=历史批次)
   * @returns {Promise<Array>} 审核记录数组
   */
  async getApprovalDetails(clientId, batchNum = 0) {
    const cacheKey = `approval_${clientId}_${batchNum}`;
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    try {
      const response = await request001.selectApprDetails({
        clientId: clientId,
        batchNum: String(batchNum)
      });

      if (response.success && response.data) {
        const data = JSON.parse(response.data);
        this.cache[cacheKey] = data;
        return data;
      }
      return [];
    } catch (error) {
      console.error(`获取审核记录失败 ${batchNum}:`, error);
      return [];
    }
  }

  /**
   * 获取审核记录 - 批量获取最新记录和历史记录
   * @param {string} clientId - 客户ID
   * @returns {Promise<Object>} 审核记录信息
   */
  async getApprovalHistory(clientId) {
    const cacheKey = `approvalHistory_${clientId}`;
    if (this.cache.approvalHistory && this.cache.approvalHistory.client_id === clientId) {
      return this.cache.approvalHistory;
    }

    try {
      // 获取最新审核记录 (batch_num: 0)
      const latestResponse = await this.getApprovalDetails(clientId, 0);

      // 批量获取历史审核记录 (batch_num: 1, 2, 3, ...)
      const historyPromises = [];
      for (let i = 1; i <= 10; i++) { // 最多获取10个历史批次
        historyPromises.push(this.getApprovalDetails(clientId, i).catch(() => []));
      }
      
      const historyResponses = await Promise.all(historyPromises);
      // 过滤掉空数组，只保留有数据的批次
      const historyResponse = historyResponses.filter(response => response && response.length > 0);

      const approvalData = {
        latest: latestResponse,
        history: historyResponse,
        batchTotal: historyResponse.length
      };

      this.cache.approvalHistory = approvalData;
      return approvalData;
    } catch (error) {
      console.error('获取审核记录失败:', error);
      return { latest: [], history: [], batchTotal: 0 };
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache = {
      dictData: {},
      selectList: {},
      basicInfo: null,
      relatedInfo: {},
      attachments: {},
      feedback: {},
      approvalHistory: null,
      batchTotal: undefined
    };
  }

  /**
   * 清除关联人信息缓存
   * @param {string} clientId - 客户ID
   * @param {string} relaType - 关联人类型，可选，如果不传则清除该客户的所有关联人缓存
   */
  clearRelatedInfoCache(clientId, relaType = '') {
    if (!clientId) return;

    if (relaType) {
      // 清除特定类型的关联人缓存
      const cacheKey = `related_${clientId}_${relaType}`;
      delete this.cache.relatedInfo[cacheKey];
    } else {
      // 清除该客户的所有关联人缓存
      const cacheKeyPattern = `related_${clientId}_`;
      Object.keys(this.cache.relatedInfo).forEach(key => {
        if (key.startsWith(cacheKeyPattern)) {
          delete this.cache.relatedInfo[key];
        }
      });
    }
  }

  /**
   * 格式化字典数据 - 参考 formatDictMap 方法
   * @param {Object} dictData - 字典数据对象
   * @param {string} dictType - 字典类型
   * @param {string} key - 键值
   * @returns {string} 格式化后的值
   */
  static formatDictMap(dictData, dictType, key) {
    const dict = dictData[dictType] || [];
    const item = dict.find(item => item.k === key);
    return item ? item.v : '-';
  }

  /**
   * 获取错误类型选项
   * @param {string} organFlag - 主体标识（0-个人，1-机构），不传则查询全部
   * @returns {Promise<Array>} 错误类型选项数组
   */
  async getErrorTypeOptions(organFlag) {
    const cacheKey = `errorTypeOptions_${organFlag || 'all'}`;
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    try {
      const response = await request001.selectErrType(organFlag);
      
      if (response.success && response.data) {
        const data = JSON.parse(response.data);
        // 接口返回的是字符串数组，如 ["表单信息错误","客户信息缺失","控股股东信息缺失","缺底稿"]
        const items = data.map((item, index) => ({
          errType: String(index + 1),
          errDesc: item
        }));
        this.cache[cacheKey] = items;
        return items;
      }
      return [];
    } catch (error) {
      console.error('获取错误类型选项失败:', error);
      return [];
    }
  }
}

export default new DataManager();