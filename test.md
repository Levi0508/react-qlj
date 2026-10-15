# 流程表单分析报告

## 一、架构概览

本项目采用 **React + Ant Design** 构建，使用 **流程上下文（Flow Context）** 进行状态管理。核心组件关系如下：

```
┌─────────────────────────────────────────────────────────────┐
│                    业务页面 (CustomForm.js)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              IbFlowForm (主表单组件)                   │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Form.Item (字段组件) + 自定义子组件            │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Bottom (底部按钮栏)                      │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  IconButton (提交、保存、关闭等按钮)             │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、提交按钮逻辑

### 2.1 按钮配置与映射

按钮操作在 `IconButton.jsx` 中定义映射关系：

```javascript
const buttonActionMap = {
    close: 'clickClose',                // 关闭
    save: 'clickSave',                  // 保存
    submit: 'clickSubmit',              // 提交
    sendBack: 'clickSendBack',          // 退回
    // ... 其他操作
}
```

**文件位置**：`src/components/sdkGtjaLinkWeb/flow/components/Bottom/IconButton.jsx:9-30`

### 2.2 按钮点击处理流程

```
用户点击按钮
    ↓
IconButton.handleClick()
    ↓
dispatch(action)  // 触发对应 action
    ↓
IBFlowForm.submitForm()  // 实际提交逻辑
```

**核心代码**（IconButton.jsx:126-131）：
```javascript
const action = custom || buttonActionMap[operator];
if (typeof action === 'function') {
    action();
} else if (typeof action === 'string' || (typeof action === 'object' && typeof action.type === 'string')) {
    dispatch(action);  // 分发 action 到 flowDispatcher
}
```

### 2.3 提交表单核心逻辑

在 `IBFlowForm.js` 中注册了 `submitForm` action：

```javascript
const submitForm = async ({ payload }, { getState, setState, dispatch }) => {
    const submitType = payload.type;
    const formValues = form.getFieldsValue();
    let parsedFormValues = formValues;
    
    // 1. 调用业务自定义校验
    if (typeof onBeforeSubmitForm === 'function') {
        try {
            parsedFormValues = onBeforeSubmitForm(parsedFormValues, submitType) || formValues;
            // 支持异步校验
            if (typeof parsedFormValues.then === 'function') {
                parsedFormValues = (await parsedFormValues) || formValues;
            }
            if (parsedFormValues instanceof Error) {
                return parsedFormValues.message;
            }
        } catch (error) {
            return error.message;  // 校验失败，返回错误信息
        }
    }
    
    // 2. 组装请求参数
    const otherParams = pick(flowDispatcher.getState(), ['piid', 'tiid', 'groupFlag', 'SYS_GUID', 'todoTitle']);
    
    // 3. 调用后端接口
    const result = await linkRequest(
        submitType === 'save' ? 'FLOW_MAINFORM_U0006' : 'FLOW_MAINFORM_U0007',
        { ...parsedFormValues, ...otherParams }
    );
    
    // 4. 提交成功后的回调
    if (result.success) {
        if (typeof onAfterSubmit === 'function') {
            onAfterSubmit(result.Data.SYS_GUID, otherParams, submitType);
        }
        return true;
    }
    
    return result.ErrMsg;
};
```

**文件位置**：`src/components/IbFlowForm/IBFlowForm.js:100-144`

---

## 三、校验逻辑

### 3.1 校验时机与方式

| 校验类型 | 触发时机 | 实现位置 |
|---------|---------|---------|
| **AntD 内置校验** | 字段变更/表单提交 | `form.validateFieldsAndScroll()` |
| **业务自定义校验** | 提交前 | `onBeforeSubmitForm` 回调 |

### 3.2 业务自定义校验实现

在业务页面 `CustomForm.js` 中实现 `handleBeforeSubmitForm` 方法：

```javascript
handleBeforeSubmitForm = (formData) => {
    // 依次检查每个子部门，"已提交人数"是否等于"本次应填报人数"
    this.state.tableData.map(item => {
        if (item.total !== item.submittedNum) {
            Modal.warning({
                title: '提示',
                content: `${item.deptName}存在员工未填报，请敦促尽快填报`,
                onOk() {
                    that.getSpDep();  // 重新查询数据
                },
            });
            // 抛出异常阻止提交
            throw new Error(`${item.deptName}存在员工未填报`);
        }
        return item;
    });
    return formData;
}
```

**文件位置**：`src/pages/cmp051/CustomForm.js:123-141`

### 3.3 校验阻止提交的方式

```javascript
// 方式1：抛出异常
throw new Error('校验失败信息');

// 方式2：返回 Error 对象
return new Error('校验失败信息');

// 方式3：返回 Promise 并 reject
return Promise.reject(new Error('校验失败信息'));
```

---

## 四、子组件数据传递机制

### 4.1 数据流向

```
┌──────────────────┐        props        ┌──────────────────┐
│   主表单         │ ──────────────────> │   子组件         │
│ CustomForm.js   │                     │ DetailModal      │
└────────┬────────┘                     └────────┬────────┘
         │                                        │
         │           回调函数/状态更新              │
         │<───────────────────────────────────────│
         │                                        │
         ▼                                        ▼
┌──────────────────┐                     ┌──────────────────┐
│   state.tableData│<────────────────────│  更新tableData   │
│   state.planId   │                     │   触发重新查询   │
└──────────────────┘                     └──────────────────┘
```

### 4.2 父传子：Props 传递

**主表单传递数据到子组件**（CustomForm.js:408-416）：

```javascript
<DetailModal
    getSpDep={this.getSpDep}           // 回调函数：重新查询数据
    visible={this.state.detailModalVisible}
    deptName={this.state.deptName}     // 部门名称
    planId={this.state.planId}         // 计划ID
    deptId={this.state.deptId}         // 部门ID
    onOk={this.handleOk}
    onCancel={this.handleCancel}
/>
```

### 4.3 子传父：回调函数

**子组件通过回调更新父组件状态**：

```javascript
// 子组件中调用父组件传递的回调
this.props.getSpDep();  // 触发父组件重新查询数据

// 或者直接通过 props 传递的 setState 更新
this.props.onOk();      // 关闭弹窗
```

### 4.4 全局状态管理

使用 `flowDispatcher` 进行跨组件状态共享：

```javascript
// 注册状态更新
flowDispatcher.setState({
    SYS_GUID: result.Data.SYS_GUID,
    fields: fields,
    // ...
});

// 获取全局状态
const otherParams = pick(flowDispatcher.getState(), ['piid', 'tiid', 'groupFlag', 'SYS_GUID']);
```

---

## 五、关键生命周期钩子

| 钩子方法 | 触发时机 | 用途 |
|---------|---------|------|
| `onGetFormData` | 表单数据加载完成后 | 格式化/转换表单数据 |
| `onGetChildFormData` | 子表单数据加载完成后 | 处理子表单数据 |
| `onBeforeSubmitForm` | 提交表单前 | 业务校验、数据转换 |
| `onAfterSubmit` | 提交表单后 | 提交成功后的后续处理 |

**生命周期流程图**：

```
页面加载
    ↓
initForm()          // 初始化表单配置
    ↓
initMainFormConfig() // 加载主表单数据
    ↓
onGetFormData()     // 业务自定义数据转换
    ↓
用户操作表单
    ↓
用户点击提交
    ↓
onBeforeSubmitForm() // 业务校验
    ↓
submitForm()        // 提交到后端
    ↓
onAfterSubmit()     // 提交后处理
```

---

## 六、核心组件职责

| 组件 | 职责 | 文件路径 |
|-----|------|---------|
| **IbFlowForm** | 主表单容器，管理表单生命周期 | `src/components/IbFlowForm/IBFlowForm.js` |
| **Item** | 字段包装器，处理编辑/查看模式 | `src/components/IbFlowForm/Item.js` |
| **Bottom** | 底部按钮栏 | `src/components/sdkGtjaLinkWeb/flow/components/Bottom/Bottom.js` |
| **IconButton** | 按钮组件，处理点击事件分发 | `src/components/sdkGtjaLinkWeb/flow/components/Bottom/IconButton.jsx` |
| **DetailModal** | 详情弹窗（业务子组件） | `src/pages/cmp051/components/DetailModal/index.tsx` |

---

## 七、总结

1. **提交按钮逻辑**：通过 `IconButton` 分发 action，最终在 `IBFlowForm.submitForm` 中处理实际提交

2. **校验逻辑**：支持 AntD 内置校验和业务自定义校验（通过 `onBeforeSubmitForm` 回调），抛出异常可阻止提交

3. **数据传递**：
   - 父 → 子：通过 props 传递数据和回调函数
   - 子 → 父：通过回调函数触发父组件状态更新
   - 全局共享：通过 `flowDispatcher` 管理流程级状态

4. **扩展点**：业务页面通过实现四个生命周期钩子（`onGetFormData`、`onGetChildFormData`、`onBeforeSubmitForm`、`onAfterSubmit`）实现自定义逻辑