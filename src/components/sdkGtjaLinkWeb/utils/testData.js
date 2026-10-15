export const testCurrentUser = {
    uid: 'zhangqilong',
    username: '张启隆',
    deptName: '综合执行组',
};

export const testFormConfig = {
    form: {
        id: "SUPERVISION_MAIN_TABLE",
        showtoolbar: false,
        class: "noborder",
        layout: {grid:{col:{span: 12}}},
        fields: [
            { field: 'CREATE_DEPT_NAME', labelname: '拟稿部门', type: 'input' },
            { field: 'CREATE_USER_NAME', labelname: '拟稿人', type: 'input' },
            { field: 'CREATE_DATE', labelname: '拟稿日期', type: 'date' },
            { field: 'CREATE_CONTACT', labelname: '联系电话', type: 'input' },
            { field: 'SUPERVISION_ITEM', labelname: '督办事项', type: 'input',
                layout: { grid: { col: { span: 24 } } }
            },
            { field: 'SUPERVISION_CLASS', labelname: '督办类别', type: 'select', displaytype: 'select',
                data: [{ value: '1', text: '年度重点工作' },
                        { value: '2', text: '重要会议决策' },
                        { value: '3', text: '领导批示事项' },
                        { value: '4', text: '其他督办事项' }]
            },
            { field: 'SUPERVISION_SOURCE', labelname: '督办来源', type: 'input' },
            { field: 'ORGANIZER_DEPT_NO', labelname: '主办单位', type: 'input' },
            { field: 'CO_ORGANIZER_DEPT_NO', labelname: '协办单位', type: 'input' },
            { field: 'LIMIT_DATE', labelname: '计划办结时限', type: 'date' },
            { field: 'DELAY_LIMIT_DATE', labelname: '延期办结时限', type: 'date' },
            { field: 'URGENCY', labelname: '缓急', type: 'select',
                limitype: 2, defval: 1,
                data: [{ value: 1, text: '一般' },
                        { value: 2, text: '急件' },
                        { value: 3, text: '特急' }]
            },
            { field: 'SECRET', labelname: '密级', type: 'select',
                limitype: 2, defval: 1,
                data: [{ value: 1, text: '一般' },
                        { value: 2, text: '秘密' },
                        { value: 3, text: '机密' },
                        { value: 4, text: '绝密' }]
            },
            { field: 'REQUIREMENT', labelname: '督办要求', type: 'input',
                layout: { grid: { col: { span: 24 } } }
            },
            { field: 'REMARK', labelname: '备注', type: 'input',
                layout: { grid: { col: { span: 24 } } }
            }
        ],
        data: {
            urlType: 'FLOW_MAINFORM_Q0001',
            getParam: function(para) {
                return Object.assign({groupFlag: "SUPERVISION_MAIN_TABLE"}, para);
            },
            dataComplete: function(data) {
                if(data !== null || data !== undefined)
                    this.call("saveData", { isDone: true, SYS_GUID: data["SYS_GUID"]});
            }
        },
        submit: {
            urlType: function(para, data) {
                if(data && data.isDone)
                    return "FLOW_MAINFORM_U0003";
                return 'FLOW_MAINFORM_I0002';
            },
            getParam: function(para, data) {
                return Object.assign({ CREATE_DEPT_NO: "1101", CREATE_DEPT_NAME: "1101",
                    ORGANIZER_DEPT_NAME: "总部", CO_ORGANIZER_DEPT_NAME: "总部",
                    groupFlag: "SUPERVISION_MAIN_TABLE",
                    guid: data["SYS_GUID"]||""
                }, para);
            }
        }
    }
};
