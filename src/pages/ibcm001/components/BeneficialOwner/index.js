import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Tag, Table, Button, Modal, Form, Input, Select, DatePicker, Radio, InputNumber, message, Spin } from 'antd';
import moment from 'moment';
import store from '@/store';
import services from '../../services';
import RelatedPerson from '../RelatedPerson';
import {
  normalizeRelatedInfo, relatedInfoPayload, getBenefitBase, getBenefitBoType,
  orderedBenefitCompanies, benefitBaseFields, benefitFields, benefitValue,
  benefitRecordErrors, newBenefitDraft, normalizeBnfTypeSelection
} from '../../utils/beneficiary';
import styles from './index.module.less';

const { Option } = Select;
const formGroups = [
  ['bnf_type'],
  ['acthdrat', 'shareratiostartdate', 'shareratioenddate'],
  ['actownerprofitratio', 'profitratiostartdate', 'profitratioenddate'],
  ['actownerprofitratiovote', 'profitratiovotestartdate', 'profitratiovoteenddate'],
  ['actctrltype'],
  ['actotherforms'],
  ['obtainactdate', 'terminationactdate', 'actconuppermarket', 'actconupperentname', 'actconuniscid'],
  ['seniormgrpos', 'actdailymgmtpostother'],
  ['seniormgrposcn', 'ownerrightmgmtpostother'],
  ['related_name', 'id_type', 'id_no'],
  ['id_validity', 'gender', 'nationality'],
  ['birthday', 'mobno1', 'mobno2'],
  ['address']
];
const formSpans = { bnf_type: 24, actctrltype: 24, actotherforms: 24, seniormgrpos: 16, seniormgrposcn: 16 };
const loadRows = response => {
  if (!response || !response.success) throw new Error((response && response.message) || '受益人查询失败');
  const rows = typeof response.data === 'string' ? JSON.parse(response.data || '[]') : (response.data || []);
  return rows.map(normalizeRelatedInfo);
};

function BeneficialOwner(props) {
  const { clientId, relatedInfo = [], dictData = {}, editable = false, isSpecial = '0', onUpdate } = props;
  const special = isSpecial === '1';
  const [rows, setRows] = useState(relatedInfo);
  const [base, setBase] = useState(() => getBenefitBase(relatedInfo));
  const [baseVisible, setBaseVisible] = useState(false);
  const [baseDraft, setBaseDraft] = useState({});
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState('add');
  const [draft, setDraft] = useState(() => newBenefitDraft());
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    setRows(relatedInfo);
    setBase(getBenefitBase(relatedInfo));
    setVisible(false);
    setBaseVisible(false);
  }, [clientId]);

  useEffect(() => {
    setRows(relatedInfo);
    setBase(current => current || getBenefitBase(relatedInfo));
  }, [relatedInfo]);

  const refresh = async () => {
    setListLoading(true);
    try {
      const latest = loadRows(await services.selectBenefitInfo({ clientId }));
      setRows(latest);
      setBase(current => current || getBenefitBase(latest));
      if (onUpdate) onUpdate({ relatedType: '5', data: latest });
      return latest;
    } finally {
      setListLoading(false);
    }
  };

  const changeBase = () => {
    if (rows.length) { message.warning('请先删除当前所有受益人，才能进行编辑'); return; }
    setBaseDraft({ company_type: '', bo_type: '', full_info_flag: '', ...base });
    setErrors({});
    setBaseVisible(true);
  };

  const deleteBase = () => {
    if (rows.length) { message.warning('请先删除当前所有受益人，才能进行删除'); return; }
    Modal.confirm({ title: '确认删除当前受益人基础信息？', onOk: () => setBase(null) });
  };

  const open = async record => {
    if (!base) { message.warning('请先添加受益人基础信息'); return; }
    setBusy(true);
    try {
      const latest = await refresh();
      const current = record ? latest.find(item => String(item.related_id) === String(record.related_id)) : null;
      if (record && !current) { message.warning('该受益人已不存在，请重新选择'); return; }
      setDraft(newBenefitDraft({ ...(current || {}), ...base }));
      setMode(record ? 'edit' : 'add');
      setErrors({});
      setVisible(true);
    } catch (error) { message.error(error.message || '受益人加载失败'); }
    finally { setBusy(false); }
  };

  const changeField = (field, value) => {
    setDraft(current => {
      const next = { ...current, [field.key]: value };
      if (field.key === 'bnf_type') {
        next.bnf_type = normalizeBnfTypeSelection(value);
        if (next.bnf_type.some(code => ['NA3-1', 'NB3-1'].includes(code))) next.actctrlcpny = '2';
        else if (next.bnf_type.some(code => ['NA3-2', 'NB3-2'].includes(code))) next.actctrlcpny = '3';
        if (next.bnf_type.includes('NI') || String((base || {}).company_type || '').charAt(0) === 'I') next.seniormgrpos = ['10'];
      }
      const active = new Set(benefitFields(next, special, base).map(item => item.key));
      benefitFields(current, special, base).forEach(item => {
        if (!active.has(item.key)) next[item.key] = item.type === 'multi' ? [] : '';
      });
      return next;
    });
    setErrors(current => ({ ...current, [field.key]: undefined }));
  };

  const submit = async nextEntry => {
    if (busy) return;
    const values = { ...draft, ...base };
    const found = benefitRecordErrors(values, special, base);
    if (found.length) {
      setErrors(found.reduce((result, item) => ({ ...result, [item.field]: item.message }), {}));
      message.warning('请检查受益人信息');
      return;
    }
    const user = store.getModelState('user');
    const userName = user.username || user.userId || '';
    const payload = relatedInfoPayload({ ...values, client_id: clientId,
      related_type: '5', organ_flag: '0', data_status: '0',
      create_user: values.create_user || userName, update_user: userName });
    setBusy(true);
    try {
      const result = mode === 'add'
        ? await services.saveBenefitInfo(payload)
        : await services.updateBenefitInfo(payload);
      if (!result || !result.success) throw new Error((result && result.message) || '保存失败');
      if (!(Number(result.data) > 0)) throw new Error('未保存任何受益人记录');
      message.success(mode === 'add' ? '添加成功' : '修改成功');
      setVisible(false);
      await refresh();
      if (nextEntry) {
        setDraft(newBenefitDraft(base));
        setMode('add');
        setErrors({});
        setVisible(true);
      }
    } catch (error) { message.error(error.message || '保存失败'); }
    finally { setBusy(false); }
  };

  const remove = record => Modal.confirm({
    title: '确认删除该受益所有人？',
    content: record.related_name,
    onOk: async () => {
      try {
        const result = await services.deleteBenefitInfo({
          clientId, relatedId: record.related_id, relatedType: '5', organFlag: '0',
          dataStatus: record.data_status || '0'
        });
        if (!result || !result.success || Number(result.data) <= 0) throw new Error((result && result.message) || '删除失败');
        message.success('删除成功');
        await refresh();
      } catch (error) { message.error(error.message || '删除失败'); }
    }
  });

  const renderControl = field => {
    const value = draft[field.key];
    if (field.type === 'date') return <div>
      <DatePicker size="small" value={value ? moment(value, 'YYYY-MM-DD') : null} format="YYYY-MM-DD"
        placeholder={field.key === 'id_begindate' ? '开始日期' : (field.key === 'id_enddate' ? '结束日期' : '请选择日期')}
        onChange={(_, text) => changeField(field, text)} style={{ width: '100%' }} />
      {field.key === 'id_enddate' && <Button type="link" size="small"
        onClick={() => changeField(field, '2100-12-31')}>长期</Button>}
    </div>;
    if (field.type === 'ratio') return <InputNumber size="small" min={25} max={100} step={1} precision={2}
      value={value === '' ? undefined : value} onChange={number => changeField(field, number)} style={{ width: '100%' }} />;
    if (field.type === 'select' || field.type === 'multi') {
      let list = dictData[field.dict] || [];
      if (field.key === 'bnf_type') list = list.filter(item => String(item.k).startsWith('N' + String((base || {}).company_type || '').charAt(0)));
      return <Select size="small" value={value === '' || value == null ? undefined : value} allowClear showSearch
        dropdownClassName={styles.optionDropdown}
        mode={field.type === 'multi' ? 'multiple' : undefined} optionFilterProp="children"
        disabled={field.readOnly} style={{ width: '100%' }} placeholder="请选择" onChange={selected => changeField(field, selected || (field.type === 'multi' ? [] : ''))}>
        {list.map(item => <Option key={String(item.k)} value={String(item.k)}
          disabled={field.key === 'bnf_type' && !(draft.bnf_type || []).includes(String(item.k)) &&
            !normalizeBnfTypeSelection((draft.bnf_type || []).concat(String(item.k))).includes(String(item.k))}>
          {item.v}
        </Option>)}
      </Select>;
    }
    if (field.type === 'textarea') return <Input.TextArea rows={2} placeholder="请输入" value={value || ''} onChange={event => changeField(field, event.target.value)} />;
    return <Input size="small" placeholder="请输入" value={value || ''}
      disabled={field.key === 'related_name' && mode === 'edit'}
      onChange={event => changeField(field, event.target.value)} />;
  };

  const formFields = benefitFields(draft, special, base || {}).reduce((result, field) => {
    result[field.key] = field;
    return result;
  }, {});
  const renderFormItem = (field, showLabel = true) => {
    const label = {
      mobno1: '联系方式（手机，与固话二选一，只能填一项）',
      mobno2: '联系方式（固话，与手机二选一，只能填一项）'
    }[field.key] || field.label;
    return <Form.Item label={showLabel ? label : undefined} required={field.required}
      validateStatus={errors[field.key] ? 'error' : undefined} help={errors[field.key]}>
      {renderControl(field)}
    </Form.Item>;
  };

  const columns = [
    { title: '序号', width: 55, render: (_, item, index) => index + 1 },
    { title: '姓名', dataIndex: 'related_name', width: 110 },
    { title: '受益所有权类型', width: 260, render: (_, item) => benefitValue(item,
      { key: 'bnf_type', type: 'multi', dict: 'bnf_type_new_list' }, dictData) },
    { title: '国籍', width: 100, render: (_, item) => benefitValue(item, { key: 'nationality', dict: 'nationality_list' }, dictData) },
    { title: '出生日期', dataIndex: 'birthday', width: 115 },
    { title: '证件类型', width: 150, render: (_, item) => benefitValue(item, { key: 'id_type', dict: 'id_type_gr_list' }, dictData) },
    { title: '证件号码', dataIndex: 'id_no', width: 185 },
    { title: '证件有效期', width: 225, render: (_, item) => (item.id_begindate || '-') + ' 至 ' + (item.id_enddate || '-') },
    { title: '手机', dataIndex: 'mobno1', width: 135 },
    { title: '固话', dataIndex: 'mobno2', width: 135 },
    { title: '联系地址', dataIndex: 'address', width: 200 }
  ];

  return <Card id={props.id || 'beneficialOwner'} className="box-card" title="受益所有人"
    extra={editable && <div className={styles.actions}>
      {!base && <Button size="small" onClick={changeBase}>基础信息添加</Button>}
      <Button type="primary" size="small" loading={busy} onClick={() => open()}>添加</Button>
    </div>}>
    {base && <Card size="small" title="受益人基础信息" className={styles.baseCard}
      extra={editable && <span><Button type="link" size="small" onClick={deleteBase}>删除</Button>
        <Button type="link" size="small" onClick={changeBase}>编辑</Button></span>}>
      <Row gutter={24}>{benefitBaseFields.map(field => <Col span={8} key={field.key}>
        <div className={styles.label}>{field.label}</div><div className={styles.value}>{benefitValue(base, field, dictData)}</div>
      </Col>)}</Row>
    </Card>}
    {!rows.length && <div className={styles.empty}>暂无受益人信息</div>}
    {rows.length > 0 && <div className={styles.listTitle}>受益人信息</div>}
    {rows.map(item => <Card key={item.related_id} size="small" className={styles.personCard}
      title={<span>{item.related_name || '-'} <Tag color="green">自然人</Tag></span>}
      extra={editable && <span><Button type="link" size="small" onClick={() => remove(item)}>删除</Button>
        <Button type="link" size="small" loading={busy} onClick={() => open(item)}>编辑</Button></span>}>
      <Row gutter={24}>{benefitFields(item, special, base || item).filter(field => field.key !== 'related_name').map(field =>
        <Col span={field.wide ? 24 : 8} key={field.key} className={styles.displayField}>
          <span className={styles.label}>{field.label}：</span><span className={styles.value}>{benefitValue(item, field, dictData)}</span>
        </Col>)}</Row>
    </Card>)}
    <RelatedPerson {...props} relatedInfo={[]} relatedType="5" editable={false} attachmentOnly />

    <Modal title="受益人基础信息" visible={baseVisible} width="80%" maskClosable={false}
      onCancel={() => setBaseVisible(false)} onOk={() => {
        if (!baseDraft.company_type) { setErrors({ company_type: '请选择企业性质' }); return; }
        setBase({ ...baseDraft, bo_type: getBenefitBoType(baseDraft.company_type) });
        setBaseVisible(false);
        message.success('基础信息已暂存，将随受益人提交一起保存');
      }}>
      <Form layout="vertical">
        <Row gutter={24}><Col span={12}>
          <Form.Item label="企业性质" required validateStatus={errors.company_type ? 'error' : undefined} help={errors.company_type}>
            <Select value={baseDraft.company_type || undefined} showSearch optionFilterProp="children" allowClear
              style={{ width: '100%' }} onChange={value => {
                setBaseDraft({ ...baseDraft, company_type: value || '', bo_type: getBenefitBoType(value) });
                setErrors({});
              }}>
              {orderedBenefitCompanies(dictData.benefit_company_no_list || []).map(item =>
                <Option key={String(item.k)} value={String(item.k)}>{item.v}</Option>)}
            </Select>
          </Form.Item>
        </Col><Col span={12}><Form.Item label="受益所有人是否需识别">
          <Select disabled value={baseDraft.bo_type || undefined} placeholder="根据企业性质自动生成" style={{ width: '100%' }}>
            {(dictData.benefit_flag_list || []).map(item => <Option key={String(item.k)} value={String(item.k)}>{item.v}</Option>)}
          </Select>
        </Form.Item></Col></Row>
        <div className={styles.warning}>如适用才勾选，请谨慎选择</div>
        {['01', '02'].map(value => <div key={value} className={styles.radio}>
          <Radio checked={baseDraft.full_info_flag === value} onClick={() => setBaseDraft({
            ...baseDraft, full_info_flag: baseDraft.full_info_flag === value ? '' : value
          })}>{benefitValue({ full_info_flag: value }, { key: 'full_info_flag' }, dictData)}</Radio>
        </div>)}
        {baseDraft.full_info_flag === '01' && <div className={styles.warning}>
          <div>1、国有企业为经官方信息验证并确认属于国有独资公司、国有控股公司、全民所有制企业。</div>
          <div>2、姓名、性别、国籍、出生日期、证件类型、证件号码、证件有效期、联系地址为必填项，手机与固话二选一填写；出生日期请选择完整日期。</div>
          <div>3、受益所有人身份证明文件的复印件请上传用于身份识别的照片。</div>
        </div>}
        {baseDraft.full_info_flag === '02' && <div className={styles.warning}>
          勾选后，新客户仍为草稿状态，不进入审核流程；老客户自动设为强限制客户。
        </div>}
      </Form>
    </Modal>

    <Modal title={mode === 'add' ? '新增受益所有人' : '修改受益所有人'} visible={visible} width="80%"
      className={styles.benefitDialog} style={{ top: '6vh' }}
      maskClosable={false} destroyOnClose onCancel={() => { if (!busy) setVisible(false); }}
      footer={[
        <Button key="cancel" disabled={busy} onClick={() => setVisible(false)}>取消</Button>,
        <Button key="next" type="primary" loading={busy} onClick={() => submit(true)}>提交并录入下一条</Button>,
        <Button key="submit" type="primary" loading={busy} onClick={() => submit(false)}>提交</Button>
      ]}>
      <Spin spinning={busy}>
        <div className={styles.listTitle}>已有受益人信息</div>
        <Table className={styles.existingTable} columns={columns} dataSource={rows} rowKey="related_id" size="small" bordered
          locale={{ emptyText: '暂无受益人信息' }}
          pagination={false} loading={listLoading} scroll={{ x: 1800, y: 240 }} />
        <Form layout="vertical" className={styles.form}>
          {formGroups.map((group, index) => {
            const keys = group.filter(key => key === 'id_validity' || formFields[key]);
            if (!keys.length) return null;
            return <Row gutter={24} key={index}>
              {keys.map(key => {
                if (key === 'id_validity') return <Col span={8} key={key} className={styles.singleField}>
                  <Form.Item label="证件有效期" required={formFields.id_begindate.required || formFields.id_enddate.required}>
                    <div className={styles.dateHint}>如需手动填写，请按照“1990-01-01”的格式填写</div>
                    <div className={styles.dateRange}>
                      {renderFormItem(formFields.id_begindate, false)}
                      <span>~</span>
                      {renderFormItem(formFields.id_enddate, false)}
                    </div>
                  </Form.Item>
                </Col>;
                const span = formSpans[key] || 8;
                return <Col span={span} key={key}
                  className={span === 24 ? styles.fullField : (span === 16 ? styles.doubleField : styles.singleField)}>
                  {renderFormItem(formFields[key])}
                </Col>;
              })}
            </Row>;
          })}
        </Form>
      </Spin>
    </Modal>
  </Card>;
}
export default BeneficialOwner;
