import React from 'react';

// ============ 样式注入 ============
const styleSheet = `
  /* PDF容器 */
  *{
    font-variant: normal !important;    /* 取消所有字体变形 */
  }
  .pdf-container {
    width: 100%;
    font-size: 24px;
    background: #ffffff;
    padding: 20px;
  }

  /* 标题样式 */
  .pdf-section-title {
    width: 100%;
    text-align: center;
    color: #303133;
    font-size: 36px;
    font-weight: bold;
    margin: 0.83em 0;
  }

  .pdf-section-sub-title {
    width: 100%;
    text-align: center;
    color: #303133;
    font-size: 36px;
    font-weight: bold;
    margin: 0.83em 0;
  }

  /* 表格容器 */
  .pdf-info-div {
    margin-bottom: 25px;
    border: 2px solid #343434;
    border-radius: 4px;
    font-size: 24px;
    overflow: hidden;
  }

  /* 表格行 */
  .pdf-table-row {
    display: table;
    width: 100%;
    table-layout: fixed;
  }

  /* 表头单元格 */
  .pdf-cell-label {
    display: table-cell;
    font-weight: bold;
    color: #303133;
    text-align: center;
    vertical-align: middle;
    border-right: 2px solid #343434;
    border-bottom: 2px solid #343434;
    padding: 12px 15px;
    white-space: nowrap;
  }

  /* 数据单元格 */
  .pdf-cell-value {
    display: table-cell;
    color: #606266;
    vertical-align: middle;
    border-right: 2px solid #343434;
    border-bottom: 2px solid #343434;
    padding: 12px 15px;
    word-break: break-all;
  }

  /* 移除最后一行的下边框 */
  .pdf-table-row:last-child .pdf-cell-label,
  .pdf-table-row:last-child .pdf-cell-value {
    border-bottom: none;
  }

  /* 移除最后一列的右边框 */
  .pdf-table-row .pdf-cell-value:last-child,
  .pdf-table-row .pdf-cell-label:last-child {
    border-right: none;
  }

  /* 长文本处理 */
  .pdf-long-text {
    word-break: break-all;
    line-height: 1.6;
    text-align: left;
  }

  /* 列宽定义 - 基于24栅格系统 */
  .pdf-col-2 { width: 8.33%; }
  .pdf-col-3 { width: 12.5%; }
  .pdf-col-5 { width: 20.83%; }
  .pdf-col-13 { width: 54.17%; }
  .pdf-col-21 { width: 87.5%; }

  /* 分隔每个人员信息 */
  .pdf-person-divider {
    border-top: 2px solid #909399;
  }

  /* 空数据样式 */
  .pdf-empty-data {
    color: #c0c4cc;
    font-style: italic;
  }

  /* 签名样式 */
  .pdf-statement-sign {
    font-weight: bold;
    color: #303133;
  }

  /* 盖章行高度 */
  .pdf-stamp-row .pdf-cell-label {
    height: 100px;
  }
`;

// 注入样式（仅执行一次）
if (typeof document !== 'undefined' && !document.getElementById('pdf-content-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'pdf-content-styles';
  styleElement.textContent = styleSheet;
  document.head.appendChild(styleElement);
}

// ============ 格式化函数 ============
const formatDictMap = (dictData, dictType, key) => {
  if (!dictData || !dictType || key === undefined || key === null) return '-';
  const dict = dictData[dictType] || [];
  const item = dict.find(item => String(item.k) === String(key));
  return item ? item.v : '-';
};

// ============ 组件 ============
const PDFContent = React.forwardRef((props, ref) => {
  const {
    basicInfo = {},
    relatedInfo1 = [],
    relatedInfo2 = [],
    relatedInfo3 = [],
    relatedInfo4 = [],
    relatedInfo5 = [],
    organFlag = '1',
    dictData = {},
    visible = false
  } = props;

  const isOrganization = organFlag === '1';

  // 渲染机构户基本信息
  const renderOrganizationInfo = () => (
    <div className="pdf-info-div">
      <div className="pdf-table-row">
        <div className="pdf-cell-label pdf-col-3">客户名称</div>
        <div className="pdf-cell-value pdf-col-5">{basicInfo.client_name || '-'}</div>
        <div className="pdf-cell-label pdf-col-3">办公住所</div>
        <div className="pdf-cell-value pdf-col-13 pdf-long-text">
          {basicInfo.province || ''}{basicInfo.city || ''}{basicInfo.district || ''}{basicInfo.office_address || '-'}
        </div>
      </div>
      <div className="pdf-table-row">
        <div className="pdf-cell-label pdf-col-3">国家或地区</div>
        <div className="pdf-cell-value pdf-col-5">
          {basicInfo.register_country ? formatDictMap(dictData, 'nationality_list', basicInfo.register_country) : '-'}
        </div>
        <div className="pdf-cell-label pdf-col-3">注册资本币种</div>
        <div className="pdf-cell-value pdf-col-5">
          {Number(basicInfo.register_money_type) === basicInfo.register_money_type
            ? formatDictMap(dictData, 'register_money_type_list', basicInfo.register_money_type)
            : (basicInfo.register_money_type || '-')}
        </div>
        <div className="pdf-cell-label pdf-col-3">注册资本金</div>
        <div className="pdf-cell-value pdf-col-5">{basicInfo.register_fund || '-'}万元</div>
      </div>

      <div className="pdf-table-row">
        {basicInfo.industry_type !== '26' ? (
          <>
            <div className="pdf-cell-label pdf-col-3">行业分类</div>
            <div className="pdf-cell-value pdf-col-5">
              {basicInfo.industry_type ? formatDictMap(dictData, 'industry_type_list', basicInfo.industry_type) : '-'}
            </div>
          </>
        ) : (
          <>
            <div className="pdf-cell-label pdf-col-2">行业分类</div>
            <div className="pdf-cell-value pdf-col-2">
              {basicInfo.industry_type ? formatDictMap(dictData, 'industry_type_list', basicInfo.industry_type) : '-'}
            </div>
            <div className="pdf-cell-label pdf-col-2">请注明</div>
            <div className="pdf-cell-value pdf-col-2">{basicInfo.industry_name || '-'}</div>
          </>
        )}
        <div className="pdf-cell-label pdf-col-3">成立日期</div>
        <div className="pdf-cell-value pdf-col-5">{basicInfo.setup_date || '-'}</div>
        <div className="pdf-cell-label pdf-col-3">联系电话</div>
        <div className="pdf-cell-value pdf-col-5">{basicInfo.tel || '-'}</div>
      </div>

      <div className="pdf-table-row">
        <div className="pdf-cell-label pdf-col-3">证件类型</div>
        <div className="pdf-cell-value pdf-col-5">
          {basicInfo.id_type ? formatDictMap(dictData, 'id_type_list', basicInfo.id_type) : '-'}
        </div>
        <div className="pdf-cell-label pdf-col-3">证件号码</div>
        <div className="pdf-cell-value pdf-col-5">{basicInfo.id_no || '-'}</div>
        <div className="pdf-cell-label pdf-col-3">证件有效期</div>
        <div className="pdf-cell-value pdf-col-5">
          {basicInfo.id_begindate || '-'}至{basicInfo.id_enddate || '-'}
        </div>
      </div>
      <div className="pdf-table-row">
        <div className="pdf-cell-label pdf-col-3">经营范围</div>
        <div className="pdf-cell-value pdf-col-21 pdf-long-text">{basicInfo.busi_scope || '-'}</div>
      </div>
    </div>
  );

  // 渲染个人户基本信息
  const renderPersonalInfo = () => (
    <div className="pdf-info-div">
      <div className="pdf-table-row">
        <div className="pdf-cell-label pdf-col-3">姓名</div>
        <div className="pdf-cell-value pdf-col-5">{basicInfo.client_name || '-'}</div>
        <div className="pdf-cell-label pdf-col-3">联系地址</div>
        <div className="pdf-cell-value pdf-col-13">
          {basicInfo.province2 || ''}{basicInfo.city2 || ''}{basicInfo.district2 || ''}{basicInfo.address || '-'}
        </div>
      </div>
      <div className="pdf-table-row">
        <div className="pdf-cell-label pdf-col-3">国籍</div>
        <div className="pdf-cell-value pdf-col-5">
          {basicInfo.nationality ? formatDictMap(dictData, 'nationality_list', basicInfo.nationality) : '-'}
        </div>
        <div className="pdf-cell-label pdf-col-3">性别</div>
        <div className="pdf-cell-value pdf-col-5">
          {(basicInfo.gender === '1' ? '男' : basicInfo.gender === '2' ? '女' : '未知') || '-'}
        </div>
        <div className="pdf-cell-label pdf-col-3">出生年月</div>
        <div className="pdf-cell-value pdf-col-5">{basicInfo.birthday || '-'}</div>
      </div>

      <div className="pdf-table-row">
        <div className="pdf-cell-label pdf-col-3">联系电话</div>
        <div className="pdf-cell-value pdf-col-5">{basicInfo.tel || '-'}</div>
        <div className="pdf-cell-label pdf-col-3">年收入</div>
        <div className="pdf-cell-value pdf-col-5">
          {basicInfo.income ? formatDictMap(dictData, 'year_income_list', String(basicInfo.income)) : '-'}
        </div>
        <div className="pdf-cell-label pdf-col-3">职业分类</div>
        <div className="pdf-cell-value pdf-col-5">
          {basicInfo.profession_code ? formatDictMap(dictData, 'profession_code_list', basicInfo.profession_code) : '-'}
        </div>
      </div>
      <div className="pdf-table-row">
        <div className="pdf-cell-label pdf-col-3">证件类型</div>
        <div className="pdf-cell-value pdf-col-5">
          {basicInfo.id_type ? formatDictMap(dictData, 'id_type_list', basicInfo.id_type) : '-'}
        </div>
        <div className="pdf-cell-label pdf-col-3">证件号码</div>
        <div className="pdf-cell-value pdf-col-5">{basicInfo.id_no || '-'}</div>
        <div className="pdf-cell-label pdf-col-3">证件有效期</div>
        <div className="pdf-cell-value pdf-col-5">
          {basicInfo.id_begindate || '-'}至{basicInfo.id_enddate || '-'}
        </div>
      </div>
      <div className="pdf-table-row">
        <div className="pdf-cell-label pdf-col-3">证件地址</div>
        <div className="pdf-cell-value pdf-col-13">
          {basicInfo.province1 || ''}{basicInfo.city1 || ''}{basicInfo.district1 || ''}{basicInfo.id_address || '-'}
        </div>
      </div>
    </div>
  );

  // 渲染人员信息列表（通用）
  const renderPersonList = (title, data, renderFields) => {
    if (data && data.length > 0) {
      return (
        <>
          <h2 className="pdf-section-sub-title">{title}</h2>
          <div className="pdf-info-div">
            {data.map((item, index) => (
              <div key={item.related_id || item.id || index} className={index > 0 ? 'pdf-person-divider' : ''}>
                {renderFields(item)}
              </div>
            ))}
          </div>
        </>
      );
    }
    return (
      <>
        <h2 className="pdf-section-sub-title">{title}</h2>
        <div className="pdf-info-div">
          <div className="pdf-table-row">
            <div className="pdf-cell-label pdf-col-3">{title}</div>
            <div className="pdf-cell-value pdf-col-21 pdf-empty-data">暂无数据</div>
          </div>
        </div>
      </>
    );
  };

  // 渲染法定代表人
  const renderLegalPerson = () => {
    return renderPersonList('法定代表人信息', relatedInfo1, (item) => (
      <>
        <div className="pdf-table-row">
          <div className="pdf-cell-label pdf-col-3">法定代表人姓名</div>
          <div className="pdf-cell-value pdf-col-5">{item.related_name || '-'}</div>
          <div className="pdf-cell-label pdf-col-3">出生年月</div>
          <div className="pdf-cell-value pdf-col-5">{item.birthday || '-'}</div>
          <div className="pdf-cell-label pdf-col-3">国籍</div>
          <div className="pdf-cell-value pdf-col-5">{formatDictMap(dictData, 'nationality_list', item.nationality)}</div>
        </div>
        <div className="pdf-table-row">
          <div className="pdf-cell-label pdf-col-3">身份证件类型</div>
          <div className="pdf-cell-value pdf-col-5">{formatDictMap(dictData, 'id_type_list', item.id_type)}</div>
          <div className="pdf-cell-label pdf-col-3">身份证件号码</div>
          <div className="pdf-cell-value pdf-col-5">{item.id_no || '-'}</div>
          <div className="pdf-cell-label pdf-col-3">证件有效期</div>
          <div className="pdf-cell-value pdf-col-5">{item.id_begindate || '-'}至{item.id_enddate || '-'}</div>
        </div>
        <div className="pdf-table-row">
          <div className="pdf-cell-label pdf-col-3">联系方式</div>
          <div className="pdf-cell-value pdf-col-5">{item.mobno1 || '-'}</div>
          <div className="pdf-cell-label pdf-col-3">&nbsp;</div>
          <div className="pdf-cell-value pdf-col-5">&nbsp;</div>
          <div className="pdf-cell-label pdf-col-3">&nbsp;</div>
          <div className="pdf-cell-value pdf-col-5">&nbsp;</div>
        </div>
      </>
    ));
  };

  // 渲染控股股东
  const renderControllingShareholder = () => {
    return renderPersonList('控股股东信息', relatedInfo2, (item) => (
      <>
        <div className="pdf-table-row">
          <div className="pdf-cell-label pdf-col-3">{item.organ_flag === '1' ? '控股股东(法人)' : '控股股东(自然人)'}</div>
          <div className="pdf-cell-value pdf-col-5">{item.related_name || '-'}</div>
          <div className="pdf-cell-label pdf-col-3">{item.organ_flag === '1' ? '国家或地区' : '国籍'}</div>
          <div className="pdf-cell-value pdf-col-5">{formatDictMap(dictData, 'nationality_list', item.nationality)}</div>
          <div className="pdf-cell-label pdf-col-3">证件类型</div>
          <div className="pdf-cell-value pdf-col-5">{formatDictMap(dictData, 'id_type_list', item.id_type)}</div>
        </div>
        <div className="pdf-table-row">
          <div className="pdf-cell-label pdf-col-3">证件号码</div>
          <div className="pdf-cell-value pdf-col-5">{item.id_no || '-'}</div>
          <div className="pdf-cell-label pdf-col-3">证件有效期期限</div>
          <div className="pdf-cell-value pdf-col-5">{item.id_begindate || '-'}至{item.id_enddate || '-'}</div>
          <div className="pdf-cell-label pdf-col-3">是否政府部门</div>
          <div className="pdf-cell-value pdf-col-5">{item.organ_flag === '1' ? (item.is_government_dept === '1' ? '是' : item.is_government_dept === '0' ? '否' : '-') : '-'}</div>
        </div>
      </>
    ));
  };

  // 渲染实际控制人
  const renderActualController = () => {
    return renderPersonList('实际控制人信息', relatedInfo3, (item) => (
      <>
        <div className="pdf-table-row">
          <div className="pdf-cell-label pdf-col-3">{item.organ_flag === '1' ? '实际控制人(法人)' : '实际控制人(自然人)'}</div>
          <div className="pdf-cell-value pdf-col-5">{item.related_name || '-'}</div>
          <div className="pdf-cell-label pdf-col-3">{item.organ_flag === '1' ? '国家或地区' : '国籍'}</div>
          <div className="pdf-cell-value pdf-col-5">{formatDictMap(dictData, 'nationality_list', item.nationality)}</div>
          <div className="pdf-cell-label pdf-col-3">证件类型</div>
          <div className="pdf-cell-value pdf-col-5">{formatDictMap(dictData, 'id_type_list', item.id_type)}</div>
        </div>
        <div className="pdf-table-row">
          <div className="pdf-cell-label pdf-col-3">证件号码</div>
          <div className="pdf-cell-value pdf-col-5">{item.id_no || '-'}</div>
          <div className="pdf-cell-label pdf-col-3">证件有效期期限</div>
          <div className="pdf-cell-value pdf-col-5">{item.id_begindate || '-'}至{item.id_enddate || '-'}</div>
          <div className="pdf-cell-label pdf-col-3">{item.organ_flag === '1' ? '是否政府部门' : '出生年月'}</div>
          <div className="pdf-cell-value pdf-col-5">
            {item.organ_flag === '1'
              ? (item.is_government_dept === '1' ? '是' : item.is_government_dept === '0' ? '否' : '-')
              : (item.birthday || '-')}
          </div>
        </div>
      </>
    ));
  };

  // 渲染授权代表人
  const renderAuthorizedRep = () => {
    return renderPersonList('授权代表人信息', relatedInfo4, (item) => (
      <>
        <div className="pdf-table-row">
          <div className="pdf-cell-label pdf-col-3">授权代表人姓名</div>
          <div className="pdf-cell-value pdf-col-5">{item.related_name || '-'}</div>
          <div className="pdf-cell-label pdf-col-3">{item.organ_flag === '1' ? '国家或地区' : '国籍'}</div>
          <div className="pdf-cell-value pdf-col-5">{formatDictMap(dictData, 'nationality_list', item.nationality)}</div>
          <div className="pdf-cell-label pdf-col-3">证件类型</div>
          <div className="pdf-cell-value pdf-col-5">{formatDictMap(dictData, 'id_type_list', item.id_type)}</div>
        </div>
        <div className="pdf-table-row">
          <div className="pdf-cell-label pdf-col-3">证件号码</div>
          <div className="pdf-cell-value pdf-col-5">{item.id_no || '-'}</div>
          <div className="pdf-cell-label pdf-col-3">证件有效期</div>
          <div className="pdf-cell-value pdf-col-5">{item.id_begindate || '-'}至{item.id_enddate || '-'}</div>
          <div className="pdf-cell-label pdf-col-3">{item.organ_flag === '1' ? '是否政府部门' : '出生年月'}</div>
          <div className="pdf-cell-value pdf-col-5">
            {item.organ_flag === '1'
              ? (item.is_government_dept === '1' ? '是' : item.is_government_dept === '0' ? '否' : '-')
              : (item.birthday || '-')}
          </div>
        </div>
        <div className="pdf-table-row">
          <div className="pdf-cell-label pdf-col-3">联系方式</div>
          <div className="pdf-cell-value pdf-col-5">{item.mobno1 || '-'}</div>
          <div className="pdf-cell-label pdf-col-3">&nbsp;</div>
          <div className="pdf-cell-value pdf-col-5">&nbsp;</div>
          <div className="pdf-cell-label pdf-col-3">&nbsp;</div>
          <div className="pdf-cell-value pdf-col-5">&nbsp;</div>
        </div>
      </>
    ));
  };

  // 渲染受益所有人
  const renderBeneficiary = () => {
    return renderPersonList('受益所有人信息', relatedInfo5, (item) => (
      <>
        <div className="pdf-table-row">
          <div className="pdf-cell-label pdf-col-3">受益所有人姓名</div>
          <div className="pdf-cell-value pdf-col-5">{item.related_name || '-'}</div>
          <div className="pdf-cell-label pdf-col-3">{item.organ_flag === '1' ? '国家或地区' : '国籍'}</div>
          <div className="pdf-cell-value pdf-col-5">{formatDictMap(dictData, 'nationality_list', item.nationality)}</div>
          <div className="pdf-cell-label pdf-col-3">证件类型</div>
          <div className="pdf-cell-value pdf-col-5">{formatDictMap(dictData, 'id_type_list', item.id_type)}</div>
        </div>
        <div className="pdf-table-row">
          <div className="pdf-cell-label pdf-col-3">证件号码</div>
          <div className="pdf-cell-value pdf-col-5">{item.id_no || '-'}</div>
          <div className="pdf-cell-label pdf-col-3">证件有效期期限</div>
          <div className="pdf-cell-value pdf-col-5">{item.id_begindate || '-'}至{item.id_enddate || '-'}</div>
          <div className="pdf-cell-label pdf-col-3">出生年月</div>
          <div className="pdf-cell-value pdf-col-5">{item.birthday || '-'}</div>
        </div>
        <div className="pdf-table-row">
          <div className="pdf-cell-label pdf-col-3">股权/表决权比例</div>
          <div className="pdf-cell-value pdf-col-5">{item.shareholding_ratio ? `${item.shareholding_ratio}%` : '-'}</div>
          <div className="pdf-cell-label pdf-col-3">受益所有人类型</div>
          <div className="pdf-cell-value pdf-col-5">{formatDictMap(dictData, 'beneficiary_list', item.beneficiary)}</div>
          <div className="pdf-cell-label pdf-col-3">联系地址</div>
          <div className="pdf-cell-value pdf-col-5">{item.address || '-'}</div>
        </div>
      </>
    ));
  };

  return (
    <div
      ref={ref}
      id="pdf-container"
      className="pdf-container"
      style={{
        display: visible ? 'block' : 'none'
      }}
    >
      <h2 className="pdf-section-title">客户基本信息</h2>

      {isOrganization ? renderOrganizationInfo() : renderPersonalInfo()}

      {isOrganization && (
        <>
          {renderLegalPerson()}
          {renderControllingShareholder()}
          {renderActualController()}
          {renderAuthorizedRep()}
          {renderBeneficiary()}
        </>
      )}

      {/* ============ 声明和日期 ============ */}
      <div className="pdf-info-div">
        <div className="pdf-table-row">
          <div className="pdf-cell-value">
            {isOrganization ? (
              '声明：本机构保证所提供资料的真实性、准确性、完整性、有效性，并对其承担责任；如上述内容发生变更时将及时以书面方式通知贵公司，如因为不能及时完成变更由此产生的一切后果将由本机构承担。'
            ) : (
              <>
                声明：本人保证前述所填信息以及所提供资料的真实性、准确性、完整性、有效性，并对其承担责任；如上述内容发生变更时将及时以书面方式通知贵公司，如因为不能及时完成变更由此产生的一切后果将由本人承担。
                <br /><br />
                <div className="pdf-statement-sign">签名：</div>
              </>
            )}
          </div>
        </div>
        {isOrganization && (
          <div className="pdf-table-row pdf-stamp-row">
            <div className="pdf-cell-label pdf-col-3">机构盖章:</div>
            <div className="pdf-cell-value pdf-col-21">&nbsp;</div>
          </div>
        )}
        <div className="pdf-table-row">
          <div className="pdf-cell-label pdf-col-3">建立业务关系日期</div>
          <div className="pdf-cell-value pdf-col-5">{basicInfo.associated_date || '-'}</div>
        </div>
      </div>
    </div>
  );
});

export default PDFContent;