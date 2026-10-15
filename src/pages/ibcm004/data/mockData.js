/**
 * 降级数据和配置数据
 * 注意：这些数据仅在API调用失败时作为降级方案使用
 * 正常情况下应该通过 dataManager 从接口获取数据
 */

// 客户基本信息降级数据
export const mockBasicInfo = {
  client_id: 'fallback-client-id',
  client_name: '数据获取失败',
  organ_flag: '1', // 1=机构户，0=个人户
  
  // 机构户信息
  office_address: '',
  register_country: '',
  register_money_type: '',
  register_fund: '',
  industry_type: '',
  industry_name: '',
  tel: '',
  setup_date: '',
  id_type: '',
  id_no: '',
  id_begindate: '',
  id_enddate: '',
  busi_scope: '',
  province: '',
  city: '',
  district: '',
  
  // 个人户信息
  nationality: '',
  gender: '',
  birthday: '',
  profession_code: '',
  income: '',
  province1: '',
  city1: '',
  district1: '',
  province2: '',
  city2: '',
  district2: '',
  address: '',
  
  // 反洗钱特殊情况
  is_special: '0',
  client_type: '',
  special_matters: '',
  missing_information: '',
  missing_draft: '',
  special_matters_other: '',
  special_reason: '',
  completed_cdd: '',
  low_risk_explanation: '',
  take_measures: '',
  communication_records: '',
  agree_records: '',
  other_records: ''
};

// 关联人信息降级数据
export const mockRelatedInfo = {
  legalRep: [],
  controllingShareholder: [],
  actualController: [],
  authorizedRep: [],
  beneficialOwner: []
};

// 附件信息降级数据
export const mockAttachments = {
  basicInfo: [],
  legalRep: [],
  controllingShareholder: [],
  actualController: [],
  authorizedRep: [],
  beneficialOwner: []
};

// 反馈信息降级数据
export const mockFeedback = {
  screen_name: '数据获取失败',
  problem_desc: '',
  grade_name: '未知',
  grade_value: ''
};

// 字典数据降级数据
export const mockDictData = {
  nationality_list: [],
  id_type_list: [],
  register_money_type_list: [],
  industry_type_list: [],
  profession_code_list: [],
  grade_value_list: [],
  client_type_list: [],
  special_matters_list: [],
  beneficiary_list: []
};

// 附件目录配置（非mock数据，是实际使用的配置）
export const directoryConfig = {
  // 机构户附件目录
  directoryConfig1: [
    {
      value:'1,2,21,22,23,3,31,32,4,41,42,5,51,52,6,61,62,63,64,7,71,72',
      label:'全部'
    },
    {
      value: 1,
      label: '1 基本信息表（盖章版）',
    },
    {
      value: 2,
      label: '2 客户情况',
      children: [{
        value: 21,
        label: '2-1 营业执照复印件',
      }, {
        value: 22,
        label: '2-2 公司章程复印件（盖章或公开披露版）',
      }, {
        value: 23,
        label: '2-3 法定代表人身份证明文件的复印件',
      }]
    },
    {
      value: 3,
      label: '3 控股股东情况（如有）',
      children: [{
        value: 31,
        label: '3-1 营业执照复印件（控股股东如为非自然人-公司）',
      }, {
        value: 32,
        label: '3-2 控股股东身份证明文件的复印件（如为自然人）',
      }]
    },
    {
      value: 4,
      label: '4 实际控制人情况（如有）',
      children: [{
        value: 41,
        label: '4-1 营业执照复印件（实际控制人如为非自然人-公司）',
      }, {
        value: 42,
        label: '4-2 实际控制人身份证明文件的复印件（如为自然人）',
      }]
    },
    {
      value: 5,
      label: '5 授权代表人情况',
      children: [{
        value: 51,
        label: '5-1 授权代表人身份证明文件的复印件',
      },{
        value: 52,
        label: '5-2 授权委托书（授权代表人非法代时适用）',
      }]
    },
    {
      value: 6,
      label: '6 受益所有人情况',
      children: [{
        value: 61,
        label: '6-1 受益所有人的身份证明文件的复印件',
      }, {
        value: 62,
        label: '6-2 确认受益所有人的证明文件，包括但不限于股权架构图、公司章程、委托持股协议、一致行动协议、表决权差异安排协议、任命文件等',
      }, {
        value: 63,
        label: '6-3 关于股权/表决权比例计算的说明（如涉及比例）',
      }, {
        value: 64,
        label: '6-4 在受益所有人信息查询管理系统（BOMIS系统）备案的信息截图（如有）',
      }]
    },
    {
      value: 7,
      label: '7 工作记录',
      children: [{
        value: 71,
        label: '7-1 在工商外部数据库（如“企查查”）查验的报告',
      }, {
        value: 72,
        label: '7-2 各类其他工作记录（如有）',
      }]
    }],
  // 自然人附件目录
  directoryConfig2: [
    {
      value:'1,2,3',
      label:'全部'
    },
    {
      value: 1,
      label: '1 基本信息表(签章版)',
    },
    {
      value: 2,
      label: '2 身份证明文件的复印件',
    },
    {
      value: 3,
      label: '3 工作记录（如有）',
    }
  ],
};