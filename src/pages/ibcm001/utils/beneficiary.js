const aliases = {
  client_id: 'clientId', related_id: 'relatedId', related_type: 'relatedType',
  related_name: 'relatedName', organ_flag: 'organFlag', id_type: 'idType', id_no: 'idNo',
  id_begindate: 'idBegindate', id_enddate: 'idEnddate', is_government_dept: 'isGovernmentDept',
  object_id: 'objectId', create_user: 'createUser', create_time: 'createTime',
  update_user: 'updateUser', update_time: 'updateTime', data_status: 'dataStatus',
  shareholding_ratio: 'shareholdingRatio', company_type: 'companyType',
  bo_type: 'boType', full_info_flag: 'fullInfoFlag', bnf_type: 'bnfType',
  benefit_start_date: 'benefitStartDate', benefit_end_date: 'benefitEndDate',
  seniormgrcn_start_date: 'seniormgrcnStartDate', seniormgrcn_end_date: 'seniormgrcnEndDate'
};

const ownershipKeys = [
  'gender', 'mobno2', 'actctrl', 'acthdrat', 'shareratiostartdate', 'shareratioenddate',
  'actctrlcpny', 'actctrltype', 'obtainactdate', 'terminationactdate', 'actotherforms',
  'actconuppermarket', 'actconupperentname', 'actconuniscid', 'pribenfit',
  'actownerprofitratio', 'profitratiostartdate', 'profitratioenddate',
  'actownerprofitratiovote', 'profitratiovotestartdate', 'profitratiovoteenddate',
  'seniormgr', 'seniormgrpos', 'actdailymgmtpostother', 'seniormgrcn', 'seniormgrposcn',
  'ownerrightmgmtpostother'
];
const multiKeys = ['bnf_type', 'actctrltype', 'seniormgrpos', 'seniormgrposcn'];

export const toBenefitCodes = value => Array.isArray(value) ? value.slice() :
  (value == null || value === '' ? [] : String(value).split(',').map(code => code.trim()).filter(Boolean));

export const benefitDate = value => {
  if (!value) return '';
  const text = String(value);
  return /^\d{8}$/.test(text) ? text.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3') : text.slice(0, 10);
};

// 接口入口统一转成页面使用的下划线字段；保留旧字段，防止维护其他角色时丢数据。
export function normalizeRelatedInfo(row) {
  const result = { ...row };
  Object.keys(aliases).forEach(key => {
    result[key] = row[key] !== undefined ? row[key] : row[aliases[key]];
  });
  result.is_government_dept = result.is_government_dept || row.isGovermentDept;
  ownershipKeys.forEach(key => { result[key] = row[key] == null ? '' : row[key]; });
  multiKeys.forEach(key => {
    result[key] = toBenefitCodes(result[key + '_str'] || result[key]);
    result[key + '_str'] = result[key].join(',');
  });
  ['birthday', 'id_begindate', 'id_enddate', 'shareratiostartdate', 'shareratioenddate',
    'profitratiostartdate', 'profitratioenddate', 'profitratiovotestartdate', 'profitratiovoteenddate',
    'obtainactdate', 'terminationactdate', 'benefit_start_date', 'benefit_end_date',
    'seniormgrcn_start_date', 'seniormgrcn_end_date'].forEach(key => { result[key] = benefitDate(result[key]); });
  return result;
}

export function relatedInfoPayload(row) {
  const result = {};
  Object.keys(aliases).forEach(key => { result[aliases[key]] = row[key] == null ? '' : row[key]; });
  ['nationality', 'birthday', 'beneficiary', 'address', 'mobno1'].concat(ownershipKeys).forEach(key => {
    result[key] = row[key] == null ? '' : row[key];
  });
  multiKeys.forEach(key => { result[aliases[key] || key] = toBenefitCodes(row[key]).join(','); });
  return result;
}

export const getBenefitBoType = companyType => companyType ? (/^[1-6]/.test(String(companyType)) ? '1' : '2') : '';
export const hasBenefitBaseInfo = base => !!(base &&
  String(base.company_type || '').trim() && String(base.bo_type || '').trim());
export const normalizeBenefitBaseInfo = row => row ? {
  company_type: row.company_type ?? row.companyType,
  bo_type: row.bo_type ?? row.boType,
  full_info_flag: row.full_info_flag ?? row.fullInfoFlag ?? ''
} : null;
export const orderedBenefitCompanies = dict => ['A', 'B', 'I']
  .reduce((list, prefix) => list.concat(dict.filter(item => String(item.k).startsWith(prefix))), [])
  .concat(dict.filter(item => !['A', 'B', 'I'].includes(String(item.k).charAt(0))));

export const benefitBaseFields = [
  { key: 'company_type', label: '企业性质', dict: 'benefit_company_no_list' },
  { key: 'bo_type', label: '受益所有人是否需识别', dict: 'benefit_flag_list' },
  { key: 'full_info_flag', label: '客户信息披露特殊情况（如有）' }
];

const benefitOwnershipGroups = [
  { types: ['NA1', 'NB1', 'ND1'], fields: ['acthdrat', 'shareratiostartdate', 'shareratioenddate'] },
  { types: ['NA2-1', 'NB2-1', 'ND2-1'], fields: ['actownerprofitratio', 'profitratiostartdate', 'profitratioenddate'] },
  { types: ['NA2-2', 'NB2-2', 'ND2-2'], fields: ['actownerprofitratiovote', 'profitratiovotestartdate', 'profitratiovoteenddate'] },
  { types: ['NA3-1', 'NA3-2', 'NB3-1', 'NB3-2', 'ND3'], fields: [
    'actctrltype', 'actotherforms', 'actconuppermarket', 'actconupperentname', 'actconuniscid', 'obtainactdate', 'terminationactdate', 'actctrlcpny'
  ] },
  { fields: [
    'seniormgrpos', 'actdailymgmtpostother', 'benefit_start_date', 'benefit_end_date'
  ] },
  { types: ['NA5'], fields: ['seniormgrposcn', 'ownerrightmgmtpostother', 'seniormgrcn_start_date', 'seniormgrcn_end_date'] }
];

export function benefitOwnershipSections(types) {
  const codes = toBenefitCodes(types);
  return benefitOwnershipGroups.map(group => ({
    fields: group.fields,
    codes: codes.filter(code => group.types ? group.types.includes(code) :
      !benefitOwnershipGroups.some(other => other.types?.includes(code)))
  })).filter(group => group.codes.length > 0);
}

export function benefitTypeOptions(dictData, companyType) {
  const group = String(companyType || '').charAt(0);
  if (!group) return [];
  return (dictData.bnf_type_new_list || []).filter(item => String(item.k).startsWith('N' + group))
    .sort((a, b) => String(a.k).localeCompare(String(b.k), 'en', { numeric: true }));
}

export function changeBenefitOwnership(item, selection, companyType, preserveLinkedFields = false) {
  const previous = toBenefitCodes(item.bnf_type);
  const bnfType = normalizeBnfTypeSelection(selection);
  const next = { ...item, bnf_type: bnfType, bnf_type_str: bnfType.join(',') };
  if (!preserveLinkedFields) {
    const retained = new Set(benefitOwnershipSections(previous.filter(code => bnfType.includes(code)))
      .map(group => group.fields));
    benefitOwnershipSections(previous.concat(bnfType)).forEach(group => {
      if (!retained.has(group.fields)) group.fields.forEach(key => {
        next[key] = multiKeys.includes(key) ? [] : '';
        if (multiKeys.includes(key)) next[key + '_str'] = '';
      });
    });
  }

  const added = bnfType.filter(code => !previous.includes(code));
  if (added.some(code => ['NA3-1', 'NB3-1'].includes(code))) next.actctrlcpny = '2';
  else if (added.some(code => ['NA3-2', 'NB3-2'].includes(code))) next.actctrlcpny = '3';
  if (bnfType.includes('NI') || String(companyType || '').startsWith('I')) next.seniormgrpos = ['10'];
  return next;
}

export function hasOtherBenefitControl(values, dictData) {
  const option = (dictData.benefit_actctrltype_list || []).find(item =>
    /^(?:\d+\s*[-－、]\s*)?(其他|其它)形式$/.test(String(item.v || '').trim()));
  return !!option && toBenefitCodes(values).includes(String(option.k));
}
export function benefitValue(item, field, dictData) {
  const value = item[field.key];
  if (field.key === 'full_info_flag') {
    return { '01': '透明度较高、信息披露充分的客户（如上市公司、国有企业）', '02': '受益人信息不规范' }[value] || '-';
  }
  if (field.dict) {
    const values = field.type === 'multi' ? toBenefitCodes(value) : [value];
    return values.map(code => {
      const option = (dictData[field.dict] || []).find(entry => String(entry.k) === String(code));
      return option ? option.v : (code == null || code === '' ? '-' : String(code));
    }).join('；') || '-';
  }
  return value == null || value === '' ? '-' : String(value);
}

export function benefitFields(item, isSpecial = false, base = item, dictData = {}) {
  const required = !isSpecial;
  const identityRequired = required && base.full_info_flag !== '01';
  const codes = toBenefitCodes(item.bnf_type);
  const has = types => types.some(code => codes.includes(code));
  const fields = [
    { key: 'related_name', label: '姓名', required: true },
    { key: 'gender', label: '性别', type: 'select', dict: 'benefit_gender_list', required },
    { key: 'nationality', label: '国籍', type: 'select', dict: 'nationality_list', required },
    { key: 'birthday', label: '出生日期', type: 'date', required },
    { key: 'id_type', label: '证件类型', type: 'select', dict: 'id_type_gr_list', required: identityRequired },
    { key: 'id_no', label: '证件号码', required: identityRequired },
    { key: 'id_begindate', label: '证件有效期开始日期', type: 'date', required: identityRequired },
    { key: 'id_enddate', label: '证件有效期结束日期', type: 'date', required: identityRequired },
    { key: 'mobno1', label: '联系方式（手机）' },
    { key: 'mobno2', label: '联系方式（固定电话）' },
    { key: 'address', label: '联系地址', required: identityRequired, wide: true },
    { key: 'bnf_type', label: '受益所有权类型', type: 'multi', dict: 'bnf_type_new_list',
      required, wide: true }
  ];
  const add = (key, label, type = 'text', dict, mandatory = required, wide = false) =>
    fields.push({ key, label, type, dict, required: mandatory, wide });
  [
    [['NA1', 'NB1', 'ND1'], 'acthdrat', '持有股权、股份或者合伙权益的比例（%）', 'shareratio', '权益'],
    [['NA2-1', 'NB2-1', 'ND2-1'], 'actownerprofitratio', '持有收益权的比例（%）', 'profitratio', '收益权'],
    [['NA2-2', 'NB2-2', 'ND2-2'], 'actownerprofitratiovote', '持有表决权的比例（%）', 'profitratiovote', '表决权']
  ].forEach(([types, ratio, label, dateKey, kind]) => {
    if (!has(types)) return;
    add(ratio, label, 'ratio');
    add(dateKey + 'startdate', '形成日期（' + kind + '）', 'date');
    add(dateKey + 'enddate', '终止日期（' + kind + '）', 'date', undefined, false);
  });
  if (has(['NA3-1', 'NA3-2', 'NB3-1', 'NB3-2', 'ND3'])) {
    add('actctrltype', '实施实际控制的内容／方式', 'multi', 'benefit_actctrltype_list', required, true);
    if (hasOtherBenefitControl(item.actctrltype, dictData)) {
      add('actotherforms', '其他形式的具体内容', 'textarea', undefined, required, true);
    }
    add('obtainactdate', '形成日期（实施实际控制）', 'date');
    add('terminationactdate', '终止日期（实施实际控制）', 'date', undefined, false);
  }
  if (has(['NA3-1', 'NB3-1', 'ND3'])) {
    add('actconuppermarket', '是否存在上一层备案主体', 'select', 'benefit_yesno_list');
    if (item.actconuppermarket === 'Y') {
      add('actconupperentname', '上一层备案主体名称');
      add('actconuniscid', '上一层备案主体统一社会信用代码');
    }
  }
  if (has(['NA4', 'NB4'])) {
    add('seniormgrpos', '负责日常经营管理的人员职位', 'multi', 'benefit_seniormgrpos_list', required, true);
    if (toBenefitCodes(item.seniormgrpos).includes('15')) add('actdailymgmtpostother', '其他负责日常经营管理人员的具体职位', 'text', undefined, required, true);
  }
  if (has(['NI']) || String(base.company_type || '').charAt(0) === 'I') {
    add('seniormgrpos', '负责日常经营管理的人员职位', 'multi', 'benefit_seniormgrpos_list', false, true);
    fields[fields.length - 1].readOnly = true;
  }
  if (has(['NA5'])) {
    add('seniormgrposcn', '在华最高层级的高级管理人员职位', 'multi', 'benefit_seniormgrposcn_list', required, true);
    if (toBenefitCodes(item.seniormgrposcn).includes('1')) add('ownerrightmgmtpostother', '在华最高层级的高级管理其他职位', 'text', undefined, required, true);
    add('seniormgrcn_start_date', '形成日期（在华最高层级的高级管理人员）', 'date');
    add('seniormgrcn_end_date', '终止日期（在华最高层级的高级管理人员）', 'date', undefined, false);
  }
  if (benefitOwnershipSections(codes).some(group => group.fields.includes('benefit_start_date'))) {
    add('benefit_start_date', '形成日期', 'date');
    add('benefit_end_date', '终止日期', 'date', undefined, false);
  }
  return fields;
}

const empty = value => value == null || (Array.isArray(value) ? value.length === 0 : String(value).trim() === '');
const validDate = value => {
  const date = new Date(value + 'T00:00:00Z');
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export function benefitRecordErrors(item, isSpecial, base = item, dictData = {}) {
  if (isSpecial) return empty(item.related_name) ? [{ field: 'related_name', message: '姓名不能为空' }] : [];
  const errors = [];
  benefitFields(item, isSpecial, base, dictData).forEach(field => {
    const value = item[field.key];
    if (field.required && empty(value)) errors.push({ field: field.key, message: field.label + '不能为空' });
    if (!empty(value) && field.type === 'date' && !validDate(String(value))) errors.push({ field: field.key, message: field.label + '必须为有效的完整日期' });
    if (!empty(value) && field.type === 'ratio' && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100)) {
      errors.push({ field: field.key, message: field.label + '须为0至100之间的数字' });
    }
  });
  if (base.full_info_flag !== '01') {
    const mobile = String(item.mobno1 || '').trim(), telephone = String(item.mobno2 || '').trim();
    if (!mobile && !telephone) errors.push({ field: 'mobno1', message: '请至少填写一项联系方式（手机或固定电话）' });
  }
  if (isSpecial && !!item.id_type !== !!item.id_no) {
    errors.push({ field: 'id_no', message: '证件类型与证件号码必须同时填写或同时留空' });
  }
  if (item.id_type === '1' && item.id_no && !/^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(item.id_no)) {
    errors.push({ field: 'id_no', message: '请输入正确的证件号码' });
  }
  return errors;
}

export function benefitListErrors(rows, isSpecial, sharedBase, { forSubmit = false, dictData = {} } = {}) {
  if (String(sharedBase?.bo_type) === '1' && (forSubmit || !rows.length)) return [];
  if (!isSpecial) {
    if (sharedBase === undefined) return ['受益人基础信息加载失败，请刷新页面重试'];
    if (!hasBenefitBaseInfo(sharedBase)) return ['请先填写或补录受益人基础信息'];
  }
  if (!rows.length) return ['请添加受益所有人信息'];
  const errors = [];
  rows.forEach((row, index) => benefitRecordErrors(row, isSpecial, sharedBase || {}, dictData).forEach(error =>
    errors.push('第' + (index + 1) + '位受益所有人' + (row.related_name || '') + '：' + error.message)));
  return errors;
}

export function newBenefitDraft(row = {}, dictData = {}) {
  const result = normalizeRelatedInfo({ related_type: '5', organ_flag: '0', data_status: '0', ...row });
  multiKeys.forEach(key => { result[key] = toBenefitCodes(result[key]); });
  if (String(result.company_type || '').charAt(0) === 'I') result.seniormgrpos = ['10'];
  if (result.bnf_type.length === 0) {
    const selectable = benefitTypeOptions(dictData, result.company_type).filter(item => item.disabled !== true);
    if (selectable.length === 1) {
      return changeBenefitOwnership(result, [String(selectable[0].k)], result.company_type, true);
    }
  }
  return result;
}

export function normalizeBnfTypeSelection(newVal) {
      var checkVal = (newVal || []).slice();
      var result = checkVal.slice();
      if (checkVal.length <= 1) {
        return result;
      }
      var lastItem = checkVal[checkVal.length - 1];
      if (checkVal.includes('NA1') && ['NA2-1', 'NA2-2', 'NA3-1', 'NA3-2', 'NA4'].includes(lastItem)) {
        result.pop();
      }
      if (checkVal.includes('NA4') && ['NA2-1', 'NA2-2', 'NA3-1', 'NA3-2', 'NA1'].includes(lastItem)) {
        result.pop();
      }
      if ((checkVal.includes('NA2-1') || checkVal.includes('NA2-2'))) {
        if (checkVal.includes('NA3-1') && ['NA4', 'NA3-2', 'NA1'].includes(lastItem)) { result.pop(); }
        if (checkVal.includes('NA3-2') && ['NA4', 'NA3-1', 'NA1'].includes(lastItem)) { result.pop(); }
        if (['NA4', 'NA1'].includes(lastItem)) { result.pop(); }
      }
      if (checkVal.includes('NA3-1') && ['NA4', 'NA3-2', 'NA1'].includes(lastItem)) { result.pop(); }
      if (checkVal.includes('NA3-2') && ['NA4', 'NA3-1', 'NA1'].includes(lastItem)) { result.pop(); }

      if (checkVal.includes('NB1') && ['NB2-1', 'NB2-2', 'NB3-1', 'NB3-2', 'NB4'].includes(lastItem)) {
        result.pop();
      }
      if (checkVal.includes('NB4') && ['NB2-1', 'NB2-2', 'NB3-1', 'NB3-2', 'NB1'].includes(lastItem)) {
        result.pop();
      }
      if ((checkVal.includes('NB2-1') || checkVal.includes('NB2-2'))) {
        if (checkVal.includes('NB3-1') && ['NB4', 'NB3-2', 'NB1'].includes(lastItem)) { result.pop(); }
        if (checkVal.includes('NB3-2') && ['NB4', 'NB3-1', 'NB1'].includes(lastItem)) { result.pop(); }
        if (['NB4', 'NB1'].includes(lastItem)) { result.pop(); }
      }
      if (checkVal.includes('NB3-1') && ['NB4', 'NB3-2', 'NB1'].includes(lastItem)) { result.pop(); }
      if (checkVal.includes('NB3-2') && ['NB4', 'NB3-1', 'NB1'].includes(lastItem)) { result.pop(); }

      if (checkVal.includes('ND1') && ['ND2-1', 'ND2-2', 'ND3', 'ND4'].includes(lastItem)) {
        result.pop();
      }
      if ((checkVal.includes('ND2-1') || checkVal.includes('ND2-2'))) {
        if (checkVal.includes('ND3') && ['ND4', 'ND1'].includes(lastItem)) { result.pop(); }
        if (['ND4', 'ND1'].includes(lastItem)) { result.pop(); }
      }
      if (checkVal.includes('ND3') && ['ND4', 'ND1'].includes(lastItem)) { result.pop(); }

      if (checkVal.includes('NE1') && ['NE2'].includes(lastItem)) {
        result.pop();
      }
      if (checkVal.includes('NE2') && ['NE1'].includes(lastItem)) {
        result.pop();
      }
      return result;
    }
