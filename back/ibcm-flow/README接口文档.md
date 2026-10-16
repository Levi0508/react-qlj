# ThfxqController 接口文档

> 基础路径: `/thfxq`

## 通用说明

- 所有接口返回格式统一为 `R<T>` 对象
- 成功时 `code=200`，`success=true`
- 失败时 `code` 可能为其他值，`success=false`，`msg` 包含错误信息

### 响应结构

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 状态码，200表示成功 |
| success | boolean | 是否成功 |
| data | T | 响应数据 |
| msg | String | 消息/错误信息 |

---

## 接口列表

### 1. selectBasicInfo - 获取客户基本信息

- **请求方式**: GET
- **接口路径**: `/thfxq/selectBasicInfo`
- **作用**: 根据客户ID获取客户基本信息

**入参**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| clientId | String | 是 | 客户ID |

**响应值**: JSON字符串，包含客户基本信息

**返回值示例**:
```json
{
    "code": 200,
    "success": true,
    "data": "[{\"address\":null,\"agreeRecords\":null,\"associatedDate\":\"2025-11-20\",\"birthday\":null,\"busiScope\":\"经营范围经营范围经营范围经营范围经营范围经营范围经营范围经营范围经营范围\",\"city\":\"武汉市\",\"city1\":null,\"city2\":null,\"clientBelong\":\"1\",\"clientId\":\"46091\",\"clientName\":\"test20251128机构\",\"clientStatus\":\"0\",\"clientType\":\"1\",\"clientTypeOther\":null,\"communicationRecords\":null,\"completedCdd\":\"2222\",\"createTime\":\"2025-11-28 15:46:04.859527\",\"createUser\":\"admin\",\"dataStatus\":null,\"district\":\"东西湖区\",\"district1\":null,\"district2\":null,\"fillinDate\":null,\"gender\":null,\"gradeValue\":\"1\",\"idAddress\":null,\"idBegindate\":\"20100123\",\"idEnddate\":\"20991231\",\"idNo\":\"7894561330X\",\"idType\":\"3\",\"ifRiskClient\":\"1\",\"ifRiskList\":null,\"income\":null,\"industryType\":null,\"industryType1\":null,\"isObjectReport\":null,\"isSpecial\":\"1\",\"lowRiskExplanation\":\"3333\",\"missingDraft\":null,\"missingInformation\":\"missing_information\",\"nationality\":null,\"officeAddress\":\"详细地址test\",\"organFlag\":\"1\",\"otherRecords\":null,\"position\":null,\"problemDesc\":\"test20251128\",\"professionCode\":null,\"province\":\"湖北省\",\"province1\":null,\"province2\":null,\"registerCountry\":\"00CN\",\"registerFund\":\"123456\",\"registerMoneyType\":\"1\",\"relatedProj\":null,\"remark\":\"test1111\",\"riskListType\":\"1\",\"setupDate\":\"20200101\",\"specialMatters\":\"1,99\",\"specialMattersOther\":\"special_matters_other\",\"specialReason\":\"1111\",\"takeMeasures\":\"4444\",\"tel\":null,\"updateTime\":null,\"updateUser\":null,\"workPlace\":null,\"workType\":\"0\",\"zipcode\":null}]",
    "msg": "操作成功"
}
```

---

### 2. selectRelatedInfo - 获取关联人信息

- **请求方式**: GET
- **接口路径**: `/thfxq/selectRelatedInfo`
- **作用**: 根据客户ID和关联类型获取关联人信息

**入参**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| clientId | String | 是 | 客户ID |
| relatedType | String | 是 | 关联类型 |

**响应值**: JSON字符串，包含关联人信息列表

**返回值示例**:
```json
{
    "code": 200,
    "success": true,
    "data": "[{\"address\":null,\"beneficiary\":null,\"birthday\":\"19900111\",\"clientId\":\"46091\",\"createTime\":\"2025-11-27 09:08:13\",\"createUser\":\"admin\",\"idBegindate\":\"20200302\",\"idEnddate\":\"20500302\",\"idNo\":\"789456123X\",\"idType\":\"1\",\"isGovernmentDept\":null,\"nationality\":\"00CN\",\"objectId\":null,\"organFlag\":\"0\",\"relatedId\":\"4584CC26F8862879E0631F6FBD0AD67F\",\"relatedName\":\"test法定代表人111\",\"relatedType\":\"1\",\"shareholdingRatio\":null,\"updateTime\":null,\"updateUser\":null}]",
    "msg": "操作成功"
}
```

---

### 3. selectFileList - 获取文件列表

- **请求方式**: GET
- **接口路径**: `/thfxq/selectFileList`
- **作用**: 根据客户ID、文件类型编号和对象ID获取文件列表（去重：同名文件只返回最新一条）

**入参**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| clientId | String | 是 | 客户ID |
| fileTypeNo | String | 是 | 文件类型编号 |
| objectId | String | 是 | 对象ID |

**去重逻辑说明**:
- 按 `client_id + name + file_type_no + extension + file_path` 分组
- 每组只取 `create_time` 最新的一条记录

**响应值**: JSON字符串，包含文件列表

**返回值示例**:
```json
{
    "code": 200,
    "success": true,
    "data": "[{\"clientId\":\"46091\",\"createBy\":\"admin\",\"createTime\":\"2025-11-28 00:00:00.0\",\"extension\":\"txt\",\"filePath\":\"/data/thfxqfiles/46091/\",\"fileSize\":\"8314\",\"fileTypeNo\":\"1\",\"id\":\"004TINSC4D8UP\",\"name\":\"xmlversion=1.0e\",\"objectId\":null,\"status\":\"0\"}]",
    "msg": "操作成功"
}
```

---

### 4. selectDict - 获取字典数据

- **请求方式**: GET
- **接口路径**: `/thfxq/selectDict`
- **作用**: 根据字典条目编号获取字典数据

**入参**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| entryNo | String | 是 | 字典条目编号 |

**响应值**: JSON字符串，包含字典数据

**返回值示例**:
```json
{
    "code": 200,
    "success": true,
    "data": "[{\"comments\":null,\"createTime\":null,\"createUser\":null,\"entryContentMatch\":null,\"entryNo\":null,\"k\":\"06BE\",\"organFlag\":null,\"remark\":null,\"sourceCode\":null,\"status\":null,\"subentry\":null,\"updateTime\":null,\"updateUser\":null,\"v\":\"比利时\"},{\"comments\":null,\"createTime\":null,\"createUser\":null,\"entryContentMatch\":null,\"entryNo\":null,\"k\":\"04DE\",\"organFlag\":null,\"remark\":null,\"sourceCode\":null,\"status\":null,\"subentry\":null,\"updateTime\":null,\"updateUser\":null,\"v\":\"德国\"},{\"comments\":null,\"createTime\":null,\"createUser\":null,\"entryContentMatch\":null,\"entryNo\":null,\"k\":\"05FR\",\"organFlag\":null,\"remark\":null,\"sourceCode\":null,\"status\":null,\"subentry\":null,\"updateTime\":null,\"updateUser\":null,\"v\":\"法国\"},{\"comments\":null,\"createTime\":null,\"createUser\":null,\"entryContentMatch\":null,\"entryNo\":null,\"k\":\"02CA\",\"organFlag\":null,\"remark\":null,\"sourceCode\":null,\"status\":null,\"subentry\":null,\"updateTime\":null,\"updateUser\":null,\"v\":\"加拿大\"},{\"comments\":null,\"createTime\":null,\"createUser\":null,\"entryContentMatch\":null,\"entryNo\":null,\"k\":\"01US\",\"organFlag\":null,\"remark\":null,\"sourceCode\":null,\"status\":null,\"subentry\":null,\"updateTime\":null,\"updateUser\":null,\"v\":\"美国\"},{\"comments\":null,\"createTime\":null,\"createUser\":null,\"entryContentMatch\":null,\"entryNo\":null,\"k\":\"03GB\",\"organFlag\":null,\"remark\":null,\"sourceCode\":null,\"status\":null,\"subentry\":null,\"updateTime\":null,\"updateUser\":null,\"v\":\"英国\"},{\"comments\":null,\"createTime\":null,\"createUser\":null,\"entryContentMatch\":null,\"entryNo\":null,\"k\":\"00CN\",\"organFlag\":null,\"remark\":null,\"sourceCode\":null,\"status\":null,\"subentry\":null,\"updateTime\":null,\"updateUser\":null,\"v\":\"中国\"},{\"comments\":null,\"createTime\":null,\"createUser\":null,\"entryContentMatch\":null,\"entryNo\":null,\"k\":\"00CNMO\",\"organFlag\":null,\"remark\":null,\"sourceCode\":null,\"status\":null,\"subentry\":null,\"updateTime\":null,\"updateUser\":null,\"v\":\"中国澳门\"},{\"comments\":null,\"createTime\":null,\"createUser\":null,\"entryContentMatch\":null,\"entryNo\":null,\"k\":\"00CNTW\",\"organFlag\":null,\"remark\":null,\"sourceCode\":null,\"status\":null,\"subentry\":null,\"updateTime\":null,\"updateUser\":null,\"v\":\"中国台湾\"},{\"comments\":null,\"createTime\":null,\"createUser\":null,\"entryContentMatch\":null,\"entryNo\":null,\"k\":\"00CNHK\",\"organFlag\":null,\"remark\":null,\"sourceCode\":null,\"status\":null,\"subentry\":null,\"updateTime\":null,\"updateUser\":null,\"v\":\"中国香港\"}]",
    "msg": "操作成功"
}
```

---

### 5. selectKey - 获取配置键值

- **请求方式**: GET
- **接口路径**: `/thfxq/selectKey`
- **作用**: 根据键名获取配置值

**入参**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| keyName | String | 是 | 键名 |

**响应值**: JSON字符串，包含键值对

**返回值示例**:
```json
{
    "code": 200,
    "success": true,
    "data": "[{\"k\":\"1\",\"mapK\":null,\"mapV\":null,\"rid\":null,\"sid\":null,\"v\":\"金融机构\"},{\"k\":\"2\",\"mapK\":null,\"mapV\":null,\"rid\":null,\"sid\":null,\"v\":\"央企\"},{\"k\":\"99\",\"mapK\":null,\"mapV\":null,\"rid\":null,\"sid\":null,\"v\":\"主体信用评级AAA\"}]",
    "msg": "操作成功"
}
```

---

### 6. selectFeedBack - 获取反馈信息

- **请求方式**: GET
- **接口路径**: `/thfxq/selectFeedBack`
- **作用**: 根据客户ID和用户ID获取反馈信息

**入参**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| clientId | String | 是 | 客户ID |
| userId | String | 是 | 用户ID |

**响应值**: JSON字符串，包含反馈信息

**返回值示例**:
```json
{
  "code": 200,
  "success": true,
  "data": "{\"feedbackId\":\"1\",\"content\":\"反馈内容\",\"...\"}",
  "msg": "操作成功"
}
```

---

### 7. selectFeedBackDesc - 获取反馈描述

- **请求方式**: GET
- **接口路径**: `/thfxq/selectFeedBackDesc`
- **作用**: 根据客户ID和用户ID获取反馈描述详情

**入参**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| clientId | String | 是 | 客户ID |
| userId | String | 是 | 用户ID |

**响应值**: JSON字符串，包含反馈描述

**返回值示例**:
```json
{
  "code": 200,
  "success": true,
  "data": "{\"description\":\"详细描述内容\"}",
  "msg": "操作成功"
}
```

---

### 8. selectBatchTotal - 获取批次总数

- **请求方式**: GET
- **接口路径**: `/thfxq/selectBatchTotal`
- **作用**: 根据客户ID获取批次总数

**入参**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| clientId | String | 是 | 客户ID |

**响应值**: JSON字符串，包含批次总数

**返回值示例**:
```json
{
  "code": 200,
  "success": true,
  "data": "10",
  "msg": "操作成功"
}
```

---

### 9. selectApprDetails - 获取审批详情

- **请求方式**: GET
- **接口路径**: `/thfxq/selectApprDetails`
- **作用**: 根据客户ID和批次号获取审批详情

**入参**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| clientId | String | 是 | 客户ID |
| batchNum | String | 是 | 批次号 |

**响应值**: JSON字符串，包含审批详情列表

**返回值示例**:
```json
{
    "code": 200,
    "success": true,
    "data": "[{\"auditDesc\":\"底稿缺失\",\"auditId\":\"a8xk2m9p\",\"auditSeq\":\"1\",\"clientId\":\"46090\",\"createTime\":\"2026-03-22 09:17:14.538106\",\"createUser\":\"huangzhichang\",\"disposeDesc\":\"tstestestet\",\"pkId\":\"4D93ADABB09BA9BAE0631F6FBD0A165C\",\"score\":null,\"updateTime\":\"2026-03-22 09:17:14.538106\",\"updateUser\":null,\"batchDisplayName\":\"黄志昌\",\"batchRemark\":\"本次审核备注内容\",\"batchCreateTime\":\"2026-03-22 09:17:14.538106\",\"batchCreateUser\":\"huangzhichang\"}]",
    "msg": "操作成功"
}
```

---

### 10. selectProvince - 获取省份列表

- **请求方式**: GET
- **接口路径**: `/thfxq/selectProvince`
- **作用**: 获取所有省份列表

**入参**: 无

**响应值**: JSON字符串，包含省份列表

**返回值示例**:
```json
{
    "code": 200,
    "success": true,
    "data": "[{\"areaCode\":\"310000\",\"areaName\":\"上海市\",\"proCode\":\"310000\"},{\"areaCode\":\"420000\",\"areaName\":\"湖北省\",\"proCode\":\"420000\"}]",
    "msg": "操作成功"
}
```

---

### 11. selectCity - 获取城市列表

- **请求方式**: GET
- **接口路径**: `/thfxq/selectCity`
- **作用**: 根据省份编码获取城市列表

**入参**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| proCode | String | 是 | 省份编码 |

**响应值**: JSON字符串，包含城市列表

**返回值示例**:
```json
{
    "code": 200,
    "success": true,
    "data": "[{\"areaCode\":\"420100\",\"areaName\":\"武汉市\",\"proCode\":\"420000\"},{\"areaCode\":\"420200\",\"areaName\":\"黄石市\",\"proCode\":\"420000\"},{\"areaCode\":\"420300\",\"areaName\":\"十堰市\",\"proCode\":\"420000\"},{\"areaCode\":\"420500\",\"areaName\":\"宜昌市\",\"proCode\":\"420000\"},{\"areaCode\":\"420600\",\"areaName\":\"襄阳市\",\"proCode\":\"420000\"}]",
    "msg": "操作成功"
}
```

---

### 12. selectDistrict - 获取区县列表

- **请求方式**: GET
- **接口路径**: `/thfxq/selectDistrict`
- **作用**: 根据省份编码和城市编码获取区县列表

**入参**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| proCode | String | 是 | 省份编码 |
| areaCode | String | 是 | 城市/地区编码 |

**响应值**: JSON字符串，包含区县列表

**返回值示例**:
```json
{
    "code": 200,
    "success": true,
    "data": "[{\"areaCode\":\"420102\",\"areaName\":\"江岸区\",\"proCode\":\"420000\"},{\"areaCode\":\"420103\",\"areaName\":\"江汉区\",\"proCode\":\"420000\"},{\"areaCode\":\"420104\",\"areaName\":\"硚口区\",\"proCode\":\"420000\"},{\"areaCode\":\"420105\",\"areaName\":\"汉阳区\",\"proCode\":\"420000\"},{\"areaCode\":\"420106\",\"areaName\":\"武昌区\",\"proCode\":\"420000\"},{\"areaCode\":\"420107\",\"areaName\":\"青山区\",\"proCode\":\"420000\"},{\"areaCode\":\"420111\",\"areaName\":\"洪山区\",\"proCode\":\"420000\"},{\"areaCode\":\"420112\",\"areaName\":\"东西湖区\",\"proCode\":\"420000\"},{\"areaCode\":\"420116\",\"areaName\":\"黄陂区\",\"proCode\":\"420000\"},{\"areaCode\":\"420117\",\"areaName\":\"新洲区\",\"proCode\":\"420000\"}]",
    "msg": "操作成功"
}
```

---

### 13. deleteOrganEntity - 删除关联主体

- **请求方式**: POST
- **接口路径**: `/thfxq/deleteOrganEntity`
- **作用**: 删除指定的关联主体

**入参** (JSON Body):

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| clientId | String | 是 | 客户ID |
| organFlag | String | 是 | 主体标识 |
| relatedType | String | 是 | 关联类型 |
| relatedId | String | 是 | 关联ID |
| dataStatus | String | 是 | 数据状态 |

**响应值**: 影响行数

**返回值示例**:
```json
{
  "code": 200,
  "success": true,
  "data": "1",
  "msg": "操作成功"
}
```

---

### 14. selectOrganEntity - 获取关联主体

- **请求方式**: GET
- **接口路径**: `/thfxq/selectOrganEntity`
- **作用**: 根据客户ID和主体标识获取关联主体列表

**入参**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| clientId | String | 是 | 客户ID |
| organFlag | String | 是 | 主体标识 |
| relatedName | String | 否 | 关联名称（模糊匹配） |

**响应值**: JSON字符串，包含关联主体列表

**返回值示例**:
```json
{
    "code": 200,
    "success": true,
    "data": "[{\"address\":null,\"beneficiary\":null,\"birthday\":\"19900111\",\"clientId\":\"46091\",\"createTime\":\"2025-11-27 09:08:13\",\"createUser\":\"admin\",\"idBegindate\":\"20200302\",\"idEnddate\":\"20500302\",\"idNo\":\"789456123X\",\"idType\":\"1\",\"isGovernmentDept\":null,\"nationality\":\"00CN\",\"objectId\":null,\"organFlag\":\"0\",\"relatedId\":\"4584CC26F8862879E0631F6FBD0AD67F\",\"relatedName\":\"test法定代表人111\",\"relatedType\":\"1\",\"shareholdingRatio\":null,\"updateTime\":null,\"updateUser\":null}]",
    "msg": "操作成功"
}
```

---

### 15. previewFile - 文件预览

- **请求方式**: POST
- **接口路径**: `/thfxq/previewFile`
- **作用**: 统一文件预览接口，支持多种方式预览文件

**入参** (Form Data):

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | MultipartFile | 否 | 上传的文件（二选一） |
| id | String | 否 | 文件ID（二选一） |
| clientId | String | 否 | 客户ID（与fileName配合使用） |
| fileTypeNo | String | 否 | 文件类型编号 |
| objectId | String | 否 | 对象ID |
| fileName | String | 否 | 文件名 |
| extension | String | 否 | 文件扩展名 |

**说明**: 至少需要提供以下组合之一：
- `file` + `fileName` (上传新文件预览)
- `id` (通过ID预览已存在文件)
- `clientId` + `fileName` (通过文件信息预览)

**响应值**: FilePreviewVO 对象

**返回值示例**:
```json
{
  "code": 200,
  "success": true,
  "data": {
    "previewUrl": "https://example.com/preview/xxx",
    "fileName": "document.pdf",
    "fileType": "pdf",
    "fileSize": 1024000
  },
  "msg": "操作成功"
}
```

**失败示例**:
```json
{
  "code": 500,
  "success": false,
  "data": null,
  "msg": "参数不完整，请提供file或id或文件信息"
}
```

---

### 16. downloadFile - 文件下载

- **请求方式**: GET
- **接口路径**: `/thfxq/downloadFile`
- **作用**: 根据文件ID下载文件

**入参**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | String | 是 | 文件ID |

**响应值**: 二进制文件流

**响应头**:
- `Content-Type`: 文件MIME类型
- `Content-Disposition`: `attachment; filename="文件名"`
- `Content-Length`: 文件大小

**失败响应**:
```json
{
  "code": 500,
  "success": false,
  "data": null,
  "msg": "下载失败: 错误信息"
}
```

---

### 17. updateClient - 更新客户信息

- **请求方式**: POST
- **接口路径**: `/thfxq/updateClient`
- **作用**: 更新客户基本信息，调用存储过程执行更新操作

**入参** (JSON Body): ClientInfo 对象

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| clientId | String | 是 | 客户ID |
| clientName | String | 否 | 客户名称 |
| organFlag | String | 否 | 主体标识（0-个人，1-机构） |
| idType | String | 否 | 证件类型 |
| idNo | String | 否 | 证件号码 |
| idBegindate | String | 否 | 证件起始日期 |
| idEnddate | String | 否 | 证件截止日期 |
| clientBelong | String | 否 | 客户归属 |
| nationality | String | 否 | 国籍 |
| birthday | String | 否 | 生日 |
| officeAddress | String | 否 | 办公地址 |
| province | String | 否 | 省份 |
| city | String | 否 | 城市 |
| district | String | 否 | 区县 |
| registerCountry | String | 否 | 注册国家 |
| registerMoneyType | String | 否 | 注册资金币种 |
| registerFund | String | 否 | 注册资金 |
| industryType | String | 否 | 行业类型 |
| tel | String | 否 | 电话 |
| setupDate | String | 否 | 成立日期 |
| busiScope | String | 否 | 经营范围 |
| isObjectReport | String | 否 | 是否对象报告 |
| associatedDate | String | 否 | 关联日期 |
| remark | String | 否 | 备注 |
| createUser | String | 否 | 创建用户 |
| createTime | String | 否 | 创建时间 |
| updateUser | String | 否 | 更新用户 |
| updateTime | String | 否 | 更新时间 |
| isSpecial | String | 否 | 是否特殊 |
| clientType | String | 否 | 客户类型 |
| clientTypeOther | String | 否 | 客户类型其他 |
| specialMatters | String | 否 | 特殊事项 |
| specialMattersOther | String | 否 | 特殊事项其他 |
| missingInformation | String | 否 | 缺失信息 |
| missingDraft | String | 否 | 缺失底稿 |
| specialReason | String | 否 | 特殊原因 |
| completedCdd | String | 否 | 已完成CDD |
| lowRiskExplanation | String | 否 | 低风险说明 |
| takeMeasures | String | 否 | 采取措施 |
| communicationRecords | String | 否 | 沟通记录 |
| agreeRecords | String | 否 | 同意记录 |
| otherRecords | String | 否 | 其他记录 |
| industryType1 | String | 否 | 行业类型1 |
| workType | String | 否 | 工作类型 |
| clientStatus | String | 否 | 客户状态 |
| dataStatus | String | 否 | 数据状态 |
| relatedProj | String | 否 | 关联项目 |
| ifRiskClient | String | 否 | 是否风险客户 |
| riskListType | String | 否 | 风险名单类型 |
| problemDesc | String | 否 | 问题描述 |
| gradeValue | String | 否 | 评级值 |
| gender | String | 否 | 性别 |
| income | String | 否 | 收入 |
| professionCode | String | 否 | 职业代码 |
| position | String | 否 | 职位 |
| workPlace | String | 否 | 工作地点 |
| zipcode | String | 否 | 邮编 |
| fillinDate | String | 否 | 填报日期 |
| idAddress | String | 否 | 证件地址 |
| province1 | String | 否 | 省份1 |
| city1 | String | 否 | 城市1 |
| district1 | String | 否 | 区县1 |
| address | String | 否 | 联系地址 |
| province2 | String | 否 | 省份2 |
| city2 | String | 否 | 城市2 |
| district2 | String | 否 | 区县2 |
| ifRiskList | String | 否 | 是否风险名单 |
| returnMsg | String | 否 | 返回消息（出参，存储过程返回） |
| returnCode | String | 否 | 返回码（出参，存储过程返回） |

**请求示例**:
```json
{
  "clientId": "46091",
  "clientName": "机构客户",
  "organFlag": "1",
  "idType": "3",
  "idNo": "7894561330X",
  "idBegindate": "20100123",
  "idEnddate": "20991231",
  "clientBelong": "1",
  "nationality": "00CN",
  "province": "湖北省",
  "city": "武汉市",
  "district": "东西湖区",
  "officeAddress": "详细地址test",
  "registerCountry": "00CN",
  "registerFund": "123456",
  "registerMoneyType": "1",
  "setupDate": "20200101",
  "busiScope": "经营范围",
  "remark": "备注信息",
  "isSpecial": "1",
  "clientType": "1",
  "specialMatters": "1,99",
  "specialMattersOther": "其他特殊事项",
  "missingInformation": "缺失信息说明",
  "specialReason": "特殊原因说明",
  "completedCdd": "CDD完成说明",
  "lowRiskExplanation": "低风险说明",
  "takeMeasures": "采取措施说明",
  "ifRiskClient": "1",
  "riskListType": "1",
  "problemDesc": "问题描述",
  "gradeValue": "1"
}
```

**返回值示例**:
```json
{
  "code": 200,
  "success": true,
  "data": "{\"returnMsg\":\"操作成功\",\"returnCode\":\"0\"}",
  "msg": "操作成功"
}
```

**失败示例**:
```json
{
  "code": 500,
  "success": false,
  "data": null,
  "msg": "更新客户信息失败: ORA-01722: 无效数字"
}
```

---

### 18. saveRelatedInfo - 保存关联人信息

- **请求方式**: POST
- **接口路径**: `/thfxq/saveRelatedInfo`
- **作用**: 批量保存关联人信息到临时表

**入参** (JSON Body): RelatedInfo 对象数组

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| relatedId | String | 否 | 关联人ID |
| relatedName | String | 是 | 关联人姓名 |
| relatedType | String | 是 | 关联类型 |
| clientId | String | 是 | 客户ID |
| ... | ... | ... | 其他字段 |

**响应值**: 影响行数

**返回值示例**:
```json
{
  "code": 200,
  "success": true,
  "data": "3",
  "msg": "操作成功"
}
```

---

### 19. deleteRelatedInfo - 删除关联人信息

- **请求方式**: POST
- **接口路径**: `/thfxq/deleteRelatedInfo`
- **作用**: 删除指定的关联人信息

**入参** (JSON Body):

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| relatedId | String | 是 | 关联人ID |

**响应值**: 影响行数

**返回值示例**:
```json
{
  "code": 200,
  "success": true,
  "data": "1",
  "msg": "操作成功"
}
```

---

### 20. saveOrganEntity - 保存关联主体

- **请求方式**: POST
- **接口路径**: `/thfxq/saveOrganEntity`
- **作用**: 批量保存关联主体到临时表

**入参** (JSON Body): RelatedInfo 对象数组

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| relatedId | String | 否 | 主体ID |
| relatedName | String | 是 | 主体名称 |
| organFlag | String | 是 | 主体标识 |
| clientId | String | 是 | 客户ID |
| ... | ... | ... | 其他字段 |

**响应值**: 影响行数

**返回值示例**:
```json
{
  "code": 200,
  "success": true,
  "data": "2",
  "msg": "操作成功"
}
```

---

### 21. updateOrganEntity - 更新关联主体

- **请求方式**: POST
- **接口路径**: `/thfxq/updateOrganEntity`
- **作用**: 更新关联主体（先删除后插入）

**入参** (JSON Body):

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| clientId | String | 是 | 客户ID |
| relatedName | String | 是 | 关联名称 |
| organEntityList | List<RelatedInfo> | 是 | 关联主体列表 |

**响应值**: 影响行数

**返回值示例**:
```json
{
  "code": 200,
  "success": true,
  "data": "5",
  "msg": "操作成功"
}
```

---

### 22. uploadFile - 上传文件

- **请求方式**: POST
- **接口路径**: `/thfxq/uploadFile`
- **作用**: 上传文件到服务器磁盘（文件不再存入数据库BLOB字段）

**入参** (Form Data):

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| clientId | String | 是 | 客户ID |
| fileTypeNo | String | 是 | 文件类型编号 |
| file | MultipartFile | 是 | 上传的文件 |
| objectId | String | 否 | 对象ID |
| createBy | String | 否 | 创建人（不传则默认为"admin"） |

**存储路径说明**:
- 开发环境（Windows）: `D:/thfxq/{clientId}/xxx.pdf`
- 生产环境（Linux）: `/data/thfxqfiles/{clientId}/xxx.pdf`

**响应值**: 文件ID

**返回值示例**:
```json
{
  "code": 200,
  "success": true,
  "data": "f1234567890",
  "msg": "操作成功"
}
```

**失败示例**:
```json
{
  "code": 500,
  "success": false,
  "data": null,
  "msg": "文件上传失败: 错误信息"
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 500 | 服务器内部错误 |
| 其他 | 具体业务错误 |


### 23. selectErrType - 获取错误类型列表

- **请求方式**: GET
- **接口路径**: `/thfxq/selectErrType`
- **作用**: 根据主体标识获取错误类型列表

**入参**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| organFlag | String | 否 | 主体标识（0-个人，1-机构），不传则查询全部 |

**响应值**: JSON字符串，包含错误类型列表

**返回值示例**:
```json
{
    "code": 200,
    "success": true,
    "data": "[\"表单信息错误\",\"客户信息缺失\",\"控股股东信息缺失\",\"缺底稿\"]",
    "msg": "操作成功"
}


```
### 24. saveApprDetails - 批量保存审核详情

- **请求方式**: POST
- **接口路径**: `/thfxq/saveApprDetails`
- **作用**: 批量保存审核详情信息，使用小驼峰格式参数

**入参** (JSON Body):

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| batchList | Array | 是 | 审核详情数组 |
| createUser | String | 否 | 创建用户（不传则默认为"system"） |

**batchList数组元素**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| clientId | String | 是 | 客户ID |
| auditId | String | 是 | 审核ID |
| auditSeq | String | 是 | 审核序号 |
| auditDesc | String | 是 | 审核描述 |
| disposeDesc | String | 是 | 处理描述 |

**请求示例**:
```json
{
  "batchList": [
    {
      "clientId": "46091",
      "auditId": "AUDIT001",
      "auditSeq": "1",
      "auditDesc": "底稿缺失",
      "disposeDesc": "需要补充底稿"
    },
    {
      "clientId": "46091",
      "auditId": "AUDIT001",
      "auditSeq": "2",
      "auditDesc": "信息不完整",
      "disposeDesc": "需要完善信息"
    }
  ],
  "createUser": "admin"
}
```

**返回值示例**:
```json
{
  "code": 200,
  "success": true,
  "data": "2",
  "msg": "操作成功"
}
```

**执行SQL**:
```sql
INSERT INTO thjs.t_th_appr_detail 
(client_id, audit_id, audit_seq, audit_desc, dispose_desc, create_user, create_time) 
VALUES 
(?, ?, ?, ?, ?, ?, sysdate),
(?, ?, ?, ?, ?, ?, sysdate)
```

---

### 25. saveApprList - 保存审核列表

- **请求方式**: POST
- **接口路径**: `/thfxq/saveApprList`
- **作用**: 保存审核列表信息，使用小驼峰格式参数

**入参** (JSON Body):

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| clientId | String | 是 | 客户ID |
| auditId | String | 是 | 审核ID |
| remark | String | 是 | 备注 |
| createUser | String | 否 | 创建用户（不传则默认为"system"） |

**请求示例**:
```json
{
  "clientId": "46091",
  "auditId": "AUDIT001",
  "remark": "审核备注",
  "createUser": "admin"
}
```

**返回值示例**:
```json
{
  "code": 200,
  "success": true,
  "data": "1",
  "msg": "操作成功"
}
```

**执行SQL**:
```sql
INSERT INTO thjs.t_th_appr_list 
(client_id, audit_id, remark, create_user, create_time) 
VALUES (?, ?, ?, ?, sysdate)
```

---

### 26. updateClientStatus - 更新客户状态

- **请求方式**: POST
- **接口路径**: `/thfxq/updateClientStatus`
- **作用**: 更新客户状态，调用存储过程执行业务逻辑

**入参** (JSON Body):

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| clientId | String | 是 | 客户ID |
| opFlag | String | 是 | 操作标识 |
| userName | String | 是 | 用户名 |

**请求示例**:
```json
{
  "clientId": "46091",
  "opFlag": "1",
  "userName": "admin"
}
```

**返回值示例**:
```json
{
  "code": 200,
  "success": true,
  "data": "{\"returnMsg\":\"操作成功\",\"returnCode\":\"0\"}",
  "msg": "操作成功"
}
```

**执行存储过程**:
```sql
{call thjs.p_fxq_cust_rz_l(?, ?, ?, ?, ?)}
```

**存储过程参数说明**:
- I_CLIENT_ID: 客户ID（入参）
- I_OP_FLAG: 操作标识（入参）
- I_USER_NAME: 用户名（入参）
- O_RETURN_MSG: 返回消息（出参）
- O_RETURN_CODE: 返回码（出参）

---

### 27. getMaintainer - 获取维护人员信息

- **请求方式**: GET
- **接口路径**: `/thfxq/getMaintainer`
- **作用**: 根据客户ID查询维护人员信息

**入参**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| clientId | String | 是 | 客户ID |

**响应值**: JSON字符串，包含维护人员信息列表

**返回值示例**:
```json
{
    "code": 200,
    "success": true,
    "data": "[{\"sid\":\"114398\",\"userId\":\"035937\",\"userName\":\"chenhaiyang\",\"displayName\":\"陈海洋\",\"deptId\":\"0212\",\"deptName\":\"技术研发部\",\"email\":\"	chenhaiyang@gtht.com\",\"mobile\":\"13800138000\",\"staffId\":\"114398\",\"status\":\"1\",\"createTime\":\"2025-01-01 00:00:00\",\"updateTime\":\"2025-01-01 00:00:00\"}]",
    "msg": "操作成功"
}
```
"handlerInfoList": [{
                                            "userOaCode": null,
                                            "userCode": "035937",
                                            "userName": "陈海洋",
                                            "orgCode": "0212",
                                            "orgName": "技术研发部",
                                            "deptId": "035937",
                                            "deptName": "陈海洋",
                                            "ehrDeptId": "0212",
                                            "ehrDeptName": "技术研发部",
                                            "parentOrgCode": "0212",
                                            "STAFF_ID": "114398",
                                            "N_NAME": "陈海洋",
                                            "N_CODE": "035937",
                                            "PARENT_CODE_ID": "0212",
                                            "PARENT_CODE_NAME": "技术研发部",
                                            "USER_NAME": "陈海洋",
                                            "EMP_NO": "035937",
                                            "isemployee": true
                                        }]
**执行SQL**:
```sql
select u.* from basic_thjs.WB_USER u 
inner join thjs.t_maintainer_info a
on u.user_name = a.new_maintainer
where a.client_id = ?
```

---

### 28. selectContent - 查询自检流程内容

- **请求方式**: GET
- **接口路径**: `/thfxq/selectContent`
- **作用**: 根据流程实例ID查询自检流程内容

**入参**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| piid | String | 是 | 流程实例ID |

**响应值**: JSON字符串，包含自检流程内容

**返回值示例**:
```json
{
    "code": 200,
    "success": true,
    "data": "\"自检流程内容字符串...\"",
    "msg": "操作成功"
}
```

**执行SQL**:
```sql
select DBMS_LOB.SUBSTR(content, 4000) as content from T_PROJ_SELFCHECK_FLOW where sys_piid = ?
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 500 | 服务器内部错误 |
| 其他 | 具体业务错误 |