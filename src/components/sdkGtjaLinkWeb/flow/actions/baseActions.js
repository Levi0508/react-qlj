import _ from 'lodash';
import React from 'react';
import {
    Modal,
    message,
} from 'antd';
import { request } from 'ice';
import moment from 'moment';

import * as flowServices from '../../services/flow/flow';

import linkRequest from '../../utils/linkRequest';
import utils from '../../utils/utils';
import services from '../../services';
import store from '@/store';

// personType转taskType
const personTypeToTaskType = {
    '0': '0',   // 起草-待办
    '1': '0',   // 待办-待办
    '2': '1',   // 已办-已办
    '3': '2',   // 待阅-待阅
    '4': '3',   // 已阅-已阅
    '5': '1',   // 被抢办-已办
};

const baseActions = {

    save(action, { setState }) {

        return setState(action.payload);
    },

    saveSilence(action, { setStateSilence }) {
        return setStateSilence(action.payload);
    },

    /**
     * 更新被选择的路径
     * 将分组的路径拆解为单路径的数组并保存
     */
    updateSelectedPaths({ payload }, { getState, setState }) {
        const selectedPathIds = payload;
        const nextPathList = getState('nextPathList');
        let selectedPaths = selectedPathIds.map(id => nextPathList.find(p => p.selectId === id));
        let groupSelectId = null;   // 合并路径id
        const selectedPathNames = selectedPaths.map(item => item.selectPathName);
        selectedPaths = selectedPaths
            .reduce((r, n) => {
                const { simpleEntity, groupEntityList, group, selectId } = n;
                if (simpleEntity && simpleEntity.id) r.push(simpleEntity);
                if (Array.isArray(groupEntityList) && groupEntityList.length > 0) r.push(...groupEntityList);
                if (group) groupSelectId = selectId;
                return r;
            }, []);
        return setState({
            selectedPathIds,
            selectedPathNames,
            selectedPaths,
            groupSelectId,
        });
    },

    /**
     * 查询流程模板配置
     */
    async fetchFlowTemplateInfo({ payload }, { getState, setState, dispatch }) {
        const {
            flowCode,
            flowVer,
            personType,
        } = getState();
        const nodeCode = getState('curNode.nodeCode');
        const result = await flowServices.getFlowTemplateInfo({
            flowCode,
            flowVer,
            nodeCode,
            taskType: personTypeToTaskType[personType],
        });
        if (result.success) {
            dispatch({
                type: 'updateTemplate',
                payload: result.Data,
            });
            // 获取附件域配置
            dispatch({
                type: `fetchAttachmentPer`,
                payload: {
                    flowCode: result.Data.template.flowCode,
                    flowVer: result.Data.template.flowVer,
                },
            });
            // 获取附件类型列表
            dispatch({
                type: `fetchAttachmentTypeList`,
                payload: {
                    flowCode: result.Data.template.flowCode,
                    flowVer: result.Data.template.flowVer,
                },
            });
        } else {
            message.warn(`查询流程模板信息失败：${result.ErrMsg}`);
        }

        // 查询操作按钮
        dispatch({
            type: 'fetchOperators',
        });

        // 获取附件列表信息
        dispatch({
            type: `fetchAttachmentList`,
        });

        return result;
    },

    async updateTemplate({ payload }, { getState, setState, dispatch }) {
        if (!payload) return;
        const { buttonList, buttonSelected, template } = payload;
        const flowVer = _.get(template, 'flowVer');
        const curNode = getState('curNode');

        const newState = {
            isInit: true,
            template,
            buttonList, // 全部操作按钮的配置
            //title,
            flowVer,
            curNode: curNode || {  // 默认为起草环节
                nodeName: '起草',
                nodeCode: 'draft',
                personType: '0',
            },
        };

        const curTitle = getState('title'); // 如果当前没有标题则使用模板标题
        if (_.isEmpty(curTitle)) {
            newState.title = _.get(template, 'flowName');
        }

        const curWindowTitle = getState('windowTitle'); // 如果没有页面标题则使用模板标题
        if (_.isEmpty(curWindowTitle))
            newState.windowTitle = _.get(template, 'flowName');

        const flowLayout = _.get(template, "flowLayout", "1");
        if (flowLayout === "2") {
            newState.showRichText = false;
        }

        const { operatorFlag } = buttonSelected || {};
        if (operatorFlag) {
            // 设置当前展示的操作按钮
            newState.operators = operatorFlag.split(',');
        }

        setState(newState);
    },

    /**
     * 获取操作按钮配置
     * Bottom组件初始化完成时调用
     */
    async fetchOperators({ payload }, { getState, setState, dispatch }) {
        const {
            flowCode,
            flowVer,
            piid,
            tiid,
            personType,
            buttonList,
        } = getState();
        const nodeCode = getState('curNode.nodeCode');
        const params = {
            flowCode,
            flowVer,
            piid,
            tiid,
            taskType: personTypeToTaskType[personType],
        };
        if (nodeCode) {
            // 当前用户有任务，查环节操作配置
            params.source = '1';
            params.nodeCode = nodeCode;
        } else {
            // 没有获得当前环节code，查全局已办配置
            params.source = '0';
            params.taskType = '1';
        }
        const result = await flowServices.getFlowOperators(params);
        const defaultOperators = ['close', 'flowTrack', 'flowChart', 'help']; // 默认情况下的操作按钮
        if (result.success) {
            const { operatorFlag, operatorConfigList } = result.Data || { operatorFlag: defaultOperators.join(',') };

            if (Array.isArray(operatorConfigList) && operatorConfigList.length > 0) {
                // 把自定义的操作按钮属性customConfig加入到buttonList对应的button中
                operatorConfigList.forEach(customConfig => {
                    const button = (buttonList || []).find(item => item.operatorFlag === customConfig.operatorFlag);
                    if (button) {
                        button.customConfig = customConfig;
                    }
                });
            }

            setState({ operators: operatorFlag.split(','), buttonList });
        } else {
            setState({ operators: defaultOperators });
            message.warn(`获取操作按钮失败：${result.ErrMsg}`);
        }
    },

    /**
     * 起草流程
     * 如成功则返回true，失败则返回错误信息字符串
     */
    async draft({ payload }, { getState, setState, dispatch }) {
        const {
            isBeforeDraft,
            flowCode,
            todoTitle,
            groupFlag,
            title,
            instancyLv,
            draftDeptCode,
            draftDeptName,
        } = getState();
        if (!isBeforeDraft) return false;    // 已起草则直接结束起草
        const result = await flowServices.draft(flowCode, todoTitle || '待办标题', groupFlag, title, instancyLv, draftDeptCode, draftDeptName);

        if (result.success) {
            // 起草成功
            const piid = _.get(result.Data, 'piid');
            const flowVer = _.get(result.Data, 'flowVer');
            const drafterInfo = _.pick(result.Data, ['draftUserId', 'draftUserName', 'draftDeptCode', 'draftDeptName']);
            if (!piid) {
                throw new Error('起草成功但未获得piid');
            }
            // 将piid更新至地址栏
            history.replaceState(null, null, `${window.location.pathname}?piid=${piid}`);
            // 保存piid
            setState({
                piid,
                curTaskLoaded: true,    // 防止起草保存后重新加载表单
                flowVer,
                drafterInfo,
                isBeforeDraft: false,   // 设置为起草结束
            });
            // // initWindow
            await dispatch({
                type: 'initWindow',
            });

            // message.success('起草成功');
            return true;
        } else {
            return `起草失败：${result.ErrMsg}`;
        }
    },

    /**
     * 使用piid初始化流程实例信息
     */
    async initWindow({ payload }, { getState, setState, dispatch }) {
        const {
            piid,
        } = getState();

        const result = await flowServices.getAllByPiid({
            piid,
        });

        await dispatch({
            type: 'updateStateAfterGetAll',
            payload: result,
        });
    },

    /**
     * 解析流程实例信息
     */
    updateStateAfterGetAll({ payload }, { getState, setState, dispatch, setStateSilence }) {
        const result = payload;
        const { piid } = getState();
        const { tiid } = utils.getPageQuery() || {};
        if (result.success) {
            const {
                authStatus,     // 当前用户是否被授权查看
                drafterInfo,    // 当前流程实例的起草人信息
                instFlowBase,   // 当前流程实例的基础信息，包含起草人信息、创建时间、流程编码、流水号、系统号等等
                instFlowCurrentPersonList,  // 当前用户在实例中所有任务，包括待办、待阅、已办
                instFlowTodoPersonList, // 当前流程实例所有激活的任务
                processObject,  //
                template,       // 流程模板基本信息，内含所有环节基本信息
            } = result.Data;
            // 2021-5-21 根据蒋老师意见页面title改为标题名称
            const windowTitle = _.get(instFlowBase, 'todoTitle', _.get(template, 'templateName', ''));
            const title = _.get(instFlowBase, 'udf1', windowTitle);
            const instancyLv = _.get(instFlowBase, 'udf2', '0');
            const secrecyLv = _.get(instFlowBase, 'udf3', '0');

            const serialNum = _.get(instFlowBase, 'serialNum');
            const saveData = {
                ...result.Data,
                piid,
                windowTitle,
                title,
                instancyLv,
                secrecyLv,
                flowVer: _.get(instFlowBase, 'flowVer'),
                todoTitle: _.get(instFlowBase, 'todoTitle'),
                serialNum,
            };
            if (Array.isArray(instFlowCurrentPersonList)) {
                let curTask;
                // 起草+待办任务
                const todoList = instFlowCurrentPersonList
                    .filter(item => ['0', '1'].indexOf(item.personType) >= 0);
                // 待阅任务
                const toreadList = instFlowCurrentPersonList
                    .filter(item => item.personType === '3');
                // 已办/被抢办任务
                const doneList = instFlowCurrentPersonList
                    .filter(item => ['2', '5'].indexOf(item.personType) >= 0)
                    .sort((a, b) => b.createTime - a.createTime);
                // 已阅任务
                const readDoneList = instFlowCurrentPersonList
                    .filter(item => item.personType === '4');

                if (tiid && instFlowCurrentPersonList.some(item => item && item.tiid === tiid)) {
                    // 如果url传参中有tiid，则优先取指定tiid的任务
                    curTask = instFlowCurrentPersonList.find(item => item.tiid === tiid);
                } else if (todoList.length === 1) {
                    // 只有1条待办任务时，加载该任务
                    curTask = todoList[0];
                } else if (todoList.length > 1) {
                    // 存在多条待办时，弹窗选择
                    saveData.taskSelectModalVisible = true;
                } else if (toreadList.length === 1) {
                    // 只有1条待阅任务时，加载该任务
                    curTask = toreadList[0];
                } else if (toreadList.length > 1) {
                    // 存在多条待阅时，弹窗选择
                    saveData.taskSelectModalVisible = true;
                } else if (doneList.length > 0) {
                    // 存在多条已办时，加载最新的任务
                    curTask = doneList[0];
                } else if (readDoneList.length > 0) {
                    // 存在多条已阅时，加载最新的任务
                    curTask = readDoneList[0];
                } else {
                    message.warn('您没有权限查看该任务');
                }

                if (!authStatus && toreadList.length >= 1) {
                    // 授权查看为true时，不调用待阅转已阅
                    // 将用户所有待阅转已阅
                    toreadList.forEach(task => {
                        flowServices.setReadTaskDone(task.tiid);
                    });
                }

                if (curTask) {
                    // 加载选中任务
                    setStateSilence(saveData);
                    dispatch({
                        type: 'loadTask',
                        payload: curTask
                    });
                    return result;
                }
            }
            setState(saveData);
        } else {
            message.warn(`获取流程实例失败：${result.ErrMsg}`);
        }
        return result;
    },

    loadTask({ payload }, { getState, setState, setStateSilence, dispatch }) {
        const curTask = payload;

        const saveData = {
            taskSelectModalVisible: false,  // 隐藏任务选择弹窗
            curTaskLoaded: true,
            curTask,
        };
        if (curTask) {
            // 加载待办任务
            const { tiid } = curTask;

            saveData.tiid = tiid;
            // 更新人员任务类型
            saveData.personType = curTask.personType;
            // 转换当前环节信息，用于展示
            saveData.curNode = {
                nodeCode: curTask.nodeCode,
                nodeName: curTask.nodeName,
                personType: curTask.personType,
            };
            setStateSilence(saveData);

            // 查询意见填写配置
            dispatch('fetchOpinionConfig');
            // 查询结论性意见列表
            dispatch('fetchDecisionOpinionList');
            // 查询常用意见列表
            dispatch('fetchUserOpinionList');
            // 获取附件域权限配置
            dispatch('fetchAttachmentPer');
            //  获取附件类型列表信息
            dispatch('fetchAttachmentTypeList');

            if (tiid && ['0', '1', '2'].indexOf(curTask.personType) >= 0) {
                // 设置任务为已读
                const { piid } = getState();
                flowServices.setTaskRead({ piid, tiid, userId: curTask.userId });
            }
        } else {
            // 加载全局已办
            saveData.curNode = {};
            setState(saveData);
        }

        // 查询流程模板
        dispatch('fetchFlowTemplateInfo');
        // 查询意见列表
        dispatch('fetchOpinionList');

        return curTask;
    },

    /**
     * 切换帮助弹窗状态
     * payload传入bool值时，显隐状态以payload为准
     * 否则切换到当前状态的反状态
     */
    toggleHelpModal({ payload }, { getState, setState, dispatch }) {
        const helpModalVisible = payload === undefined ? !getState('helpModalVisible') : !!payload;
        return setState({
            helpModalVisible,
        });
    },

    /**
     * 切换正文历史版本的显隐状态
     * payload传入bool值时，显隐状态以payload为准
     * 否则切换到当前状态的反状态
     */
    async toggleVersionHisModal({ payload }, { getState, setState, dispatch }) {
        const versionHisModalVisible = payload === undefined ? !getState('versionHisModalVisible') : !!payload;
        if (versionHisModalVisible) {
            const { piid, tiid } = getState();
            const result = await flowServices.queryVersionHisList({ piid, tiid });
            if (result.success) {
                setState({
                    versionHisModalVisible,
                    versionHisList: result.Data,
                });
            } else {
                message.warn(`查询历史版本失败：${result.ErrMsg}`);
            }
        } else {
            return setState({
                versionHisModalVisible,
            });
        }
    },

    /**
     * 切换正文历史版本记录的显隐状态
     * payload传入bool值时，显隐状态以payload为准
     * 否则切换到当前状态的反状态
     */
    async toggleVersionHisOneModal({ payload }, { getState, setState, dispatch }) {
        const versionHisOneModalVisible = payload === undefined ? !getState('versionHisOneModalVisible') : !!payload.versionHisOneModalVisible;
        if (versionHisOneModalVisible) {
            const { piid, tiid } = getState();
            const { id } = payload;
            const result = await flowServices.getVersionHis({ piid, tiid, id });
            if (result.success) {
                setState({
                    versionHisOneModalVisible,
                    versionHisOne: result.Data,
                });
            } else {
                message.warn(`查询历史版本失败：${result.ErrMsg}`);
            }
        } else {
            return setState({
                versionHisOneModalVisible,
            });
        }
    },
    /**
     * 切换流程跟中弹窗的显隐状态
     * payload传入bool值时，显隐状态以payload为准
     * 否则切换到当前状态的反状态
     */
    toggleFlowTrackModal({ payload }, { getState, setState, dispatch }) {
        const flowTrackModalVisible = payload === undefined ? !getState('flowTrackModalVisible') : !!payload;
        return setState({
            flowTrackModalVisible,
        });
    },
    /**
     * 切换错误报告弹窗的显隐状态
     * payload传入bool值时，显隐状态以payload为准
     * 否则切换到当前状态的反状态
     */
    toggleErrorReportModal({ payload }, { getState, setState, dispatch }) {
        const errorReportModalVisible = payload === undefined ? !getState('errorReportModalVisible') : !!payload.errorReportModalVisible;
        const errorReportMsg = payload === undefined ? "" : (payload.errorReportMsg || "");
        return setState({
            errorReportModalVisible,
            errorReportMsg
        });
    },

    /**
     * 切换提醒弹窗状态
     * payload传入bool值时，显隐状态以payload为准
     * 否则切换到当前状态的反状态
     */
    toggleNoticeModal({ payload }, { getState, setState, dispatch }) {
        const noticeModalVisible = payload === undefined ? !getState('noticeModalVisible') : !!payload;
        return setState({
            noticeModalVisible,
        });
    },

    /**
     * 切换上传附件弹窗的显隐状态
     * payload传入bool值时，显隐状态以payload为准
     * 否则切换到当前状态的反状态
     */
    toggleAttachmentModal({ payload }, { getState, setState, dispatch }) {
        const attachmentModalVisible = payload === undefined ? !getState('attachmentModalVisible') : !!payload;
        return setState({
            attachmentModalVisible,
        });
    },

    /**
    * 切换文件对比弹窗状态
    * payload传入bool值时，显隐状态以payload为准
    * 否则切换到当前状态的反状态
    */

    toggleFileCompareModal({ payload }, { getState, setState, dispatch }) {
        const fileCompareModalVisible = payload === undefined ? !getState('fileCompareModalVisible') : !!payload;
        return setState({
            fileCompareModalVisible,
        });
    },

    /**
     * 切换路径选择弹窗的显隐状态
     * payload传入bool值时，显隐状态以payload为准
     * 否则切换到当前状态的反状态
     */
    async togglePathSelectModal({ payload }, { getState, setState, dispatch }) {
        const pathSelectModalVisible = payload === undefined ? !getState('pathSelectModalVisible') : !!payload;

        // 执行查询智能提交参数
        await dispatch('fetchSmartCommitParams');
        const { smartCommitParams, smartCommitModalVisible } = getState();
        if (pathSelectModalVisible && !smartCommitModalVisible && smartCommitParams) {
            // 弹出猜你想要
            return setState({ smartCommitModalVisible: true });
        }
        setState({ smartCommitModalVisible: false });

        if (pathSelectModalVisible) {
            // 查询可选路径列表
            const result = await dispatch({
                type: 'fetchNextPathList',
            });
            if (!result) return; // 查询路径接口报错，不弹路径选择窗
            const { nextPathList } = getState();

            if (nextPathList.length === 1) {
                const selectedPathIds = [nextPathList[0].selectId];  // 如果只有一条路径可选择，则默认选中
                await dispatch({
                    type: 'updateSelectedPaths',
                    payload: selectedPathIds,
                });

                // 触发单路径直接弹出选人
                dispatch({
                    type: 'ensurePathSelect',
                });
                return pathSelectModalVisible;
            }
        }

        return setState({
            pathSelectModalVisible,
        });
    },

    async ensurePathSelect({ payload }, { getState, setState, setStateSilence, dispatch }) {
        const {
            selectedPaths,
            selectedNodesHandlerIds,
            selectedNodesHandlers,
            piid,
            flowCode,
            curNode
        } = getState();

        // 判断送结束
        const endNodeCode = _.get(selectedPaths, '[0].endNodeCode');

        if (flowCode==='IBCM001' && endNodeCode === '_EOF') {
            // hgrysh节点送结束时打印当前选择的路径
            if (curNode?.nodeCode === 'hgrysh') {
                console.log('===== hgrysh节点送结束 =====');
                console.log('当前节点:', curNode);
                console.log('选择的路径列表:', selectedPaths);
                selectedPaths.forEach((path, index) => {
                    console.log(`路径${index + 1}:`, {
                        路径ID: path.id,
                        路径编码: path.pathCode,
                        路径名称: path.pathName,
                        起始节点编码: path.beginNodeCode,
                        结束节点编码: path.endNodeCode,
                        路径类型: path.pathType,
                        审批类型: path.approveType
                    });
                });
                console.log('============================');
            }

            // 处理送结束，不弹人员选择窗
            dispatch({
                type: 'togglePathSelectModal',
                payload: false,
            });
            // 弹窗提醒将要送结束
            Modal.confirm({
                title: '提示',
                icon: 'exclamation',
                content: '即将送结束，是否确认？',
                onOk: async () => {
                    // hgrysh节点送结束时调用待阅接口
                    if (curNode?.nodeCode === 'hgrysh') {
                        try {
                            const title = getState('title') || '反洗钱客户填报';
                            const { tiid, instancyLv, secrecyLv } = getState();
                            const userInfo = store.getModelState('user');

                            // 先调用 getMaintainer 接口获取维护人员信息
                            const ibFlowForm = getState('ibFlowForm');
                            const formValues = ibFlowForm?.getFieldsValue?.() || {};
                            const clientId = formValues.CLIENT_ID;

                            if (!clientId) {
                                message.error('无法获取客户ID，无法发送待阅');
                                return;
                            }

                            console.log('调用getMaintainer接口，clientId:', clientId);

                            const maintainerResult = await request({
                                url: '/thfxq/getMaintainer',
                                method: 'GET',
                                params: { clientId, userId: userInfo.userId }
                            });

                            console.log('getMaintainer接口返回结果:', maintainerResult);

                            if (!maintainerResult.success || maintainerResult.code !== 200) {
                                message.error(`获取维护人员失败：${maintainerResult.msg || '未知错误'}`);
                                return;
                            }

                            // 解析返回的维护人员信息（data是JSON字符串）
                            let maintainerList = [];
                            try {
                                maintainerList = JSON.parse(maintainerResult.data);
                            } catch (e) {
                                console.error('解析维护人员数据失败:', e);
                                message.error('解析维护人员数据失败');
                                return;
                            }

                            if (!maintainerList || maintainerList.length === 0) {
                                message.error('未找到维护人员信息，无法发送待阅');
                                return;
                            }

                            // 将维护人员信息转换为 handlerInfoList 格式
                            const handlerInfoList = maintainerList.map(user => ({
                                userOaCode: null,
                                userCode: user.userId,
                                userName: user.displayName,
                                orgCode: user.deptId,
                                orgName: user.deptName,
                                deptId: user.userId,
                                deptName: user.displayName,
                                ehrDeptId: user.deptId,
                                ehrDeptName: user.deptName,
                                parentOrgCode: user.deptId,
                                STAFF_ID: user.staffId || user.sid,
                                N_NAME: user.displayName,
                                N_CODE: user.userId,
                                PARENT_CODE_ID: user.deptId,
                                PARENT_CODE_NAME: user.deptName,
                                USER_NAME: user.displayName,
                                EMP_NO: user.userId,
                                isemployee: true
                            }));

                            console.log('构建的handlerInfoList:', handlerInfoList);

                            // 构建 JSON 数据
                            const jsonData = {
                                "Param": JSON.stringify({
                                    "piid": piid,
                                    "tiid": tiid || '',
                                    "todoTitle": title,
                                    "instancyLv": instancyLv || "0",
                                    "secrecyLv": secrecyLv || null,
                                    "completeTaskPathList": [{
                                        "endNodeCode": "_EOF",
                                        "handlerInfoList": handlerInfoList
                                    }]
                                }),
                                "Type": "FLOW_MAIN_I0011"
                            };

                            // 使用 URLSearchParams 构建表单数据
                            const formData = new URLSearchParams();
                            formData.append('data', JSON.stringify(jsonData));

                            console.log('调用待阅接口，参数:', formData.toString());

                            const result = await request({
                                url: '/flowCommon/flowApi?FLOW_MAIN_I0011&funcId=FLOW_MAIN_I0011',
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'X-Flow-Systemid': 'IBCM',
                                    'X-Userid': maintainerList[0].curUserId, //'035937',
                                    'X-Username': maintainerList[0].curUserName //'chenhaiyang'
                                },
                                data: formData
                            });

                            console.log('待阅接口返回结果:', result);

                            // 判断接口是否调用成功
                            if (result.State !== 0) {
                                message.error(`发送待阅失败：${result.ErrMsg || '未知错误'}`);
                                return;
                            }

                            message.success('发送待阅成功');
                        } catch (error) {
                            console.error('调用待阅接口失败:', error);
                            message.error(`发送待阅失败：${error.message || '网络错误'}`);
                            return;
                        }
                    }

                    return dispatch({
                        type: 'completeTask',
                    });
                },
                okText: '确认',
                cancelText: '取消',
            });
            return;
        }

        // 如果所有路径的selectPerson字段都为0时，表示不需要选择处理人，直接使用对应的handlerInfoList作为处理人提交
        // 若handlerInfoList也为空，则直接提交
        if (selectedPaths.every(path => path.selectPerson === '0')) {
            selectedPaths.forEach(path => {
                const { endNodeCode, handlerInfoList } = path;
                if (Array.isArray(handlerInfoList)) {
                    selectedNodesHandlerIds[endNodeCode] = handlerInfoList.map(user => user._id);
                    selectedNodesHandlers[endNodeCode] = handlerInfoList;
                }
            });
            setStateSilence({
                selectedNodesHandlerIds: {
                    ...selectedNodesHandlerIds,
                },
                selectedNodesHandlers: {
                    ...selectedNodesHandlers,
                },
            });
            dispatch({
                type: 'toggleSubmitConfirmModal',
                payload: true,
            });
            return;
        }


        dispatch({
            type: 'toggleHandlerSelectModal',
            payload: true,
        });
    },

    /**
     * 切换路径选择弹窗的显隐状态
     * payload传入bool值时，显隐状态以payload为准
     * 否则切换到当前状态的反状态
     */
    toggleHandlerSelectModal({ payload }, { getState, setState, dispatch }) {
        const handlerSelectModalVisible = payload === undefined ? !getState('handlerSelectModalVisible') : !!payload;

        if (handlerSelectModalVisible) {
            dispatch('fetchAllNodeHandlerList');    // 根据当前所选的路径，查询所有候选人
        }
        return setState({ handlerSelectModalVisible });
    },

    /**
     * 退回确认弹窗的显隐状态
     * payload传入bool值时，显隐状态以payload为准
     * 否则切换到当前状态的反状态
     */
    toggleSendBackModal({ payload }, { getState, setState, dispatch }) {
        const sendBackConfirmModalVisible = payload === undefined ? !getState('sendBackConfirmModalVisible') : !!payload;
        return setState({ sendBackConfirmModalVisible });
    },

    /**
     * 提交确认弹窗的显隐状态
     * payload传入bool值时，显隐状态以payload为准
     * 否则切换到当前状态的反状态
     * 12-23 提交不需要弹出确认弹窗，直接提交!
     */
    toggleSubmitConfirmModal({ payload }, { getState, setState, dispatch }) {
        const submitConfirmModalVisible = payload === undefined ? !getState('submitConfirmModalVisible') : !!payload;
        const { nextPathList, selectedPaths } = getState();
        if (nextPathList.length === 1 && selectedPaths.every(path => path.selectPerson === '0')) {
            // 如果只有一条路径可选择、且所有路径的人员都需要选择，则需要弹出确认弹窗
            return setState({ submitConfirmModalVisible });
        }
        dispatch({
            type: 'completeTask',
        });
    },

    /**
     * 提交确认弹窗的显隐状态
     * payload传入bool值时，显隐状态以payload为准
     * 否则切换到当前状态的反状态
     */
    toggleFeedbackModal({ payload }, { getState, setState, dispatch }) {
        const feedbackModalVisible = payload === undefined ? !getState('feedbackModalVisible') : !!payload;
        return setState({ feedbackModalVisible });
    },

    /**
     * 文件作废弹窗的显隐状态
     * payload传入bool值时，显隐状态以payload为准
     * 否则切换到当前状态的反状态
     */
    toggleFileDeleteModal({ payload }, { getState, setState, dispatch }) {
        const fileDeleteModalVisible = payload === undefined ? !getState('fileDeleteModalVisible') : !!payload;
        return setState({ fileDeleteModalVisible });
    },

    async submitFileDelete({ payload }, { getState, setState, dispatch }) {
        const data = payload;
        const {
            piid,
            tiid,
        } = getState();
        data.piid = piid;
        data.tiid = tiid;
        const result = await flowServices.submitFileDelete(data);
        if (result.success) {
            message.success('文件已作废');
            setState({
                fileDeleteModalVisible: false,
            });
            dispatch('clickClose');
            window.location = window.location;
        } else {
            message.warn(`提交文件作废失败：${result.ErrMsg}`);
        }
        return result;
    },

    /**
     * 查询可选路径列表
     */
    async fetchNextPathList({ payload }, { getState, setState, dispatch, setStateSilence }) {
        const { piid, tiid, flowCode, flowVer, curNode: { nodeCode }, groupFlag, isSendBack } = getState();
        const params = { flowCode, flowVer, nodeCode, piid, tiid, groupFlag };
        if (isSendBack) params.onlyBackPath = 1; // 设置只查退回路径
        const result = await flowServices.getNodeList(params);
        if (result.success) {
            const {
                maxNum,
                minNum,
                pathSelectEntityList: nextPathList,
                selectFlag,     // 路径选择限制，1-单选，其他-多选
            } = result.Data;

            const min = minNum || (selectFlag === '1' ? 1 : 0);
            const max = maxNum || (selectFlag === '1' ? 1 : 0);
            setState({
                selectFlag,
                nextPathList,
                selectedPathIds: [],
                selectedPaths: [],
                pathConfig: {
                    min,
                    max,
                },
            });
        } else {
            message.warn(`查询可选路径列表失败：${result.ErrMsg}`);
        }
        return result.success;
    },

    /**
     * 查询传入所有选中的路径所指向的环节的候选人列表，并存入nodesHandlers
     */
    async fetchAllNodeHandlerList({ payload }, { getState, setState, dispatch }) {
        const {
            piid,
            tiid,
            selectedPaths,
        } = getState();
        const promises = selectedPaths.map(path => {
            const { pathCode, endNodeCode } = path;
            return flowServices.getNodeHandlerList({
                piid,
                tiid,
                nodeCode: endNodeCode,
                pathCode,
            });
        });

        let pathHandlerSelectedCount = 0;   // 已自动填入候选人的路径的数量
        const newState = await Promise.all(promises).then(results => {
            const newState = {
                nodesHandlerTree: {},
                nodesHandlers: {},
                nodeChooseTypes: {},
                selectedNodesHandlerIds: {},
                selectedNodesHandlers: {},
            };
            for (let i = 0; i < results.length; i += 1) {
                const result = results[i];
                const path = selectedPaths[i];
                const nodeCode = path.endNodeCode;
                if (result.success) {
                    const {
                        data,
                        chooseType,
                    } = result.Data;

                    let orgList = [];
                    let handlerList = [];
                    let handlerTree = [];

                    // 对数据做一些处理，以便让后续组件统一取数据
                    data.forEach(item => {
                        const {
                            nodeFlag,
                            deptId,
                            deptName,
                            orgCode,
                            userCode,
                        } = item;
                        if (nodeFlag === '1') {
                            // 部门，设置唯一id为部门id，并给orgCode、orgName赋值
                            item._id = deptId;
                            item.orgCode = deptId;
                            item.orgName = deptName;
                            item.children = [];
                            orgList.push(item);
                        } else {
                            // 通过orgCode和userCode设置唯一id
                            item._id = `[${orgCode}]${userCode}`;
                            handlerList.push(item);
                        }
                    });

                    if (orgList.length === 0) {
                        // 老接口，data中没有返回部门信息，需要通过人员信息构建部门树
                        const parseTree = (list) => {
                            const parsedTree = list.reduce((r, n) => {
                                const { orgCode, orgName } = n;
                                let org = r.find(rn => rn.orgCode === orgCode);
                                if (!org) {
                                    org = {
                                        orgCode,
                                        orgName,
                                        children: [],
                                    };
                                    r.push(org);
                                }
                                org.children.push(n);
                                return r;
                            }, []);
                            return parsedTree;
                        };
                        handlerTree = parseTree(data);
                        handlerList = data;
                    } else {
                        // 新接口，data中返回了部门信息和人员信息
                        const tempOrg = {
                            orgCode: '没有部门的人员',
                            orgName: '没有部门的人员',
                            children: [],
                        };

                        handlerTree = data.reduce((r, n) => {
                            const {
                                nodeFlag,
                                parentOrgCode,
                                orgCode,
                            } = n;
                            if (nodeFlag === '1') {
                                // 部门
                                if (parentOrgCode === '0') {
                                    // 加入根节点
                                    r.push(n);
                                } else {
                                    // 加入对应的父节点
                                    const parent = orgList.find(item => item.orgCode === parentOrgCode);
                                    if (parent) {
                                        if (!parent.children) parent.children = [];
                                        parent.children.push(n);
                                    } else {
                                        tempOrg.children.push(n);
                                    }
                                }
                            } else {
                                // 人员
                                const parent = orgList.find(item => [parentOrgCode, orgCode].indexOf(item.orgCode) >= 0);
                                if (parent) {
                                    if (!parent.children) parent.children = [];
                                    parent.children.push(n);
                                } else {
                                    tempOrg.children.push(n);
                                }
                            }
                            return r;
                        }, []);

                        // 对部门和人员进行排序：部门在前人员在后，按照orderNo从小到大排序  2021-05-12
                        const sorter = (a, b) => {
                            if (a.nodeFlag === b.nodeFlag) return a.orderNo - b.orderNo;
                            return a.nodeFlag === '1' ? -1 : (b.nodeFlag === '1' ? 1 : 0);
                        };
                        const sortTree = (tree) => {
                            tree.sort(sorter);
                            tree.forEach(item => {
                                if (Array.isArray(item.children)) {
                                    sortTree(item.children);
                                }
                            });
                        };
                        sortTree(handlerTree);

                        if (tempOrg.children.length > 0) {
                            handlerTree.push(tempOrg);
                        }
                    }

                    newState.nodesHandlerTree[nodeCode] = handlerTree;
                    newState.nodesHandlers[nodeCode] = handlerList;
                    newState.nodeChooseTypes[nodeCode] = chooseType;

                    if (chooseType === 2 || handlerList.length === 1) {
                        // 环节候选人配置为全选、或可选人员数量为1时，将所有候选人加入到已选人员中
                        pathHandlerSelectedCount += 1;
                        newState.selectedNodesHandlerIds[nodeCode] = handlerList.map(item => item._id);
                        newState.selectedNodesHandlers[nodeCode] = [...handlerList];
                    }
                } else {
                    message.warn(`【${path.pathName}】查询候选人失败：${result.ErrMsg}`);
                }
            }
            return newState;
        });
        setState(newState);
        // if (pathHandlerSelectedCount === selectedPaths.length) {    // 12-23 提交不需要弹出确认弹窗
        //     // 所有路径都已经自动选了候选人时，自动弹出候选人确认弹窗
        //     dispatch('toggleSubmitConfirmModal');
        // }
    },

    /**
     * 用户点击底部的关闭按钮
     */
    async clickClose({ payload }, { getState, setState, dispatch }) {
        return window.close();
    },

    /**
     * 点击填写意见按钮
     */
    async clickDecision({ payload }, { getState, setState, dispatch }) {
        // TODO: 查询意见相关配置
        dispatch({
            type: 'toggleOpinionModal',
            payload: true,
        });
    },

    /**
     * 点击错误报告
     */
    async clickErrorReport({ payload }, { getState, setState, dispatch }) {
        const { piid, tiid } = getState();
        const result = await flowServices.getErrorReportReview({ piid, tiid });

        dispatch({
            type: 'toggleErrorReportModal',
            payload: {
                errorReportModalVisible: true,
                errorReportMsg: result.success ? result.Data : "请求错误",
            },
        });
    },

    /**
     * 提交错误报告
     */
    async submitErrorReport({ payload }, { getState, setState, dispatch }) {
        const {
            mailSubject,
            mailDesc,
            fileList,
        } = payload;
        const { piid, tiid } = getState();

        const result = await flowServices.submitErrorReport({ piid, tiid, mailSubject, mailDesc, fileList });
        if (result.success) {
            message.success(`错误报告发送成功`);
            dispatch({
                type: 'toggleErrorReportModal',
                payload: {
                    errorReportModalVisible: false,
                },
            });
        } else {
            message.warn(`意见保存失败：${result.ErrMsg}`);
        }
    },

    /**
     * 点击附件上传
     */
    async clickAttachment({ payload }, { getState, setState, dispatch }) {
        setState({ selectedTabId: 'attachment' });
    },

    /**
     * 点击查看流程图
     */
    clickFlowChart(action, { getState }) {
        const { systemId, flowCode, flowVer, piid } = getState();
        window.open(`https://www.gtja.net/flowweb/flowChart?systemId=${systemId}&flowCode=${flowCode}&flowVer=${flowVer}&piid=${piid}`);
    },

    /**
     * 点击发布
     */
    async clickPublish(action, { getState, setState, dispatch }) {
        const flag = await dispatch({
            type: 'clickSave',
        });
        if (flag) {
            const { systemId, flowCode, flowVer, piid, tiid } = getState();
            window.open(`/flowweb/flowDocument?systemId=${systemId}&flowCode=${flowCode}&flowVer=${flowVer}&piid=${piid}&tiid=${tiid}`);
        }
    },

    /**
     * 点击文件跟踪
     */
    clickFileTrack(action, { getState }) {
        message.info('功能开发中...');
    },

    /**
     * 点击帮助
     */
    async clickHelp({ payload }, { getState, setState, dispatch }) {
        // TODO: 查询意见相关配置
        dispatch({
            type: 'toggleHelpModal',
            payload: true,
        });
    },
    /**
     * 点击正文历史
     */
    async clickVersionHis({ payload }, { getState, setState, dispatch }) {
        // TODO: 查询意见相关配置
        dispatch({
            type: 'toggleVersionHisModal',
            payload: true,
        });
    },
    /**
     * 点击流程跟踪
     */
    async clickFlowTrack({ payload }, { getState, setState, dispatch }) {
        // TODO: 查询意见相关配置
        dispatch({
            type: 'toggleFlowTrackModal',
            payload: true,
        });
        dispatch('fetchFlowTrackList');
    },

    /**
     * 点击提醒
     */
    async clickNotice({ payload }, { getState, setState, dispatch }) {
        dispatch({
            type: 'toggleNoticeModal',
            payload: true,
        });
    },

    /**
     * 提醒
     */
    async submitNoticeReport({ payload }, { getState, setState, dispatch }) {
        const {
            msgType,
            subject,
            content,
            toUserInfoList,
        } = payload;
        const { piid, tiid } = getState();

        const result = await flowServices.submitNoticeReport({ piid, tiid, subject, content, msgType, toUserInfoList });
        if (result.success) {
            message.success(`提醒成功`);
            dispatch({
                type: 'toggleNoticeModal',
                payload: false,
            });
        } else {
            message.warn(`提醒失败：${result.ErrMsg}`);
        }
    },
    /**
     * 点击文件对比
     */
    async clickFileCompare({ payload }, { getState, setState, dispatch }) {
        dispatch({
            type: 'toggleFileCompareModal',
            payload: true,
        });
    },

    /**
     * 文件对比
     */
    async submitFileCompare({ payload }, { getState, setState, dispatch }) {
        const {
            dispatchData
        } = payload;
        const result = await flowServices.submitFileCompare(dispatchData);
        if (result.State == 0) {
            window.open(`/manage/filecompare.html?menuId=2000083060&menuindex=32&activeKey=info2`)
            dispatch({
                type: 'toggleFileCompareModal',
                payload: false,
            });
        } else {
            message.warn(`请求失败：${result.ErrMsg}`);
        }
    },
    /**
     * 缓存意见，completeTask时统一提交
     */
    async saveOpinion({ payload }, { getState, setState, dispatch, setStateSilence }) {
        const {
            opnContent,
            decisionOpinionCode,
        } = payload;

        setStateSilence({
            opinionModalData: {
                opnContent,
                decisionOpinionCode,
            },
        });
        const { allowWrite, showDecisionOpinion, useDecisionOpinion } = getState('opinionConfig');
        if (allowWrite - 3 !== 0) {
            if (allowWrite - 2 === 0 && (!opnContent || opnContent.length === 0)) {
                // 需要填写意见详情，但没有填写时，不保存意见
                return;
            }
        }

        // 2021-03-30 将结论性意见是否显示的控制独立出来
        if (showDecisionOpinion - 1 === 0 && useDecisionOpinion - 1 === 0 && !decisionOpinionCode) {
            // 需要选择结论性意见，但没有选择时，不保存意见
            return;
        }

        const { piid, tiid } = getState();
        const data = {
            piid,
            tiid,
            opnContent,
            decisionOpinionCode,
        };
        const result = await flowServices.submitOpinion(data);
        if (result.success) {
            message.success('意见已保存');
            dispatch({
                type: 'toggleOpinionModal',
                payload: false,
            });
            dispatch('fetchOpinionList');

            // 尝试继续处理提交
            const { opinionModalVisible, submitAfterOpinion, isSendBack } = getState();
            if (!opinionModalVisible) {
                if (submitAfterOpinion) {
                    if (isSendBack) {
                        dispatch('clickSendBack');  // 继续处理退回
                    } else {
                        dispatch('clickSubmit');    // 继续处理提交
                    }
                }
                setStateSilence({ submitAfterOpinion: false });
            }

        } else {
            message.warn(`意见保存失败：${result.ErrMsg}`);
        }
    },

    /**
     * 用户点击保存按钮
     */
    async clickSave({ payload }, { getState, setState, dispatch }) {
        const { isBeforeDraft, isEdit, flowCode, curNode } = getState();

        let msg = await dispatch({
            type: 'checkAttachment',
        });
        if (typeof msg === 'string') {
            if (msg) message.warn(`附件检验失败：${msg}`);
            return false;
        }

        // 尝试起草
        msg = await dispatch({
            type: 'draft',
        });
        if (typeof msg === 'string') {
            if (msg) message.warn(`起草失败：${msg}`);
            return false;
        }

        // 保存表单
        if (isEdit) {
            // 保存表单
            msg = await dispatch({
                type: 'submitForm',
                payload: {
                    type: "save",
                }
            });
            if (typeof msg === 'string') {
                if (msg) message.warn(`保存失败：${msg}`);
                return false;
            }

            // 反洗钱客户填报审核流程 - 在表单保存成功后调用updateClient接口
            // ibcm001的xmzqr节点和ibcm004的fxqkhqr节点是完全相同的表单
            if ((flowCode == 'IBCM001' && curNode.nodeCode === 'xmzqr') || (flowCode == 'IBCM004' && curNode.nodeCode === 'fxqkhqr')) {
                try {
                    // 从ibFlowForm获取表单数据
                    const ibFlowForm = getState('ibFlowForm');
                    if (!ibFlowForm) {
                        console.warn("无法获取表单对象ibFlowForm，跳过updateClient接口调用");
                    } else {
                        // 获取表单中的所有字段值
                        const formValues = ibFlowForm.getFieldsValue();

                        // 从表单数据中获取客户基本信息
                        const clientId = formValues.CLIENT_ID;
                        const organFlag = formValues.ORGAN_FLAG || '1';
                        const clientBelong = formValues.CLIENT_BELONG;

                        console.log("IBCM001流程 - 准备调用updateClient接口，表单数据:", formValues);

                        if (!clientId) {
                            console.warn("无法获取CLIENT_ID，跳过updateClient接口调用");
                        } else {
                            // 从表单数据中获取客户信息
                            // clientName从BasicInfo表单绑定的client_name字段获取
                            // clientStatus从selectBasicInfo接口获取
                            let clientName = formValues.client_name || formValues.CLIENT_NAME || formValues.CLIENT_NAME;
                            let clientStatus = formValues.CLIENT_STATUS || '0';
                            try {
                                const clientInfoResult = await request({
                                    url: 'thfxq/selectBasicInfo',
                                    method: 'GET',
                                    params: { clientId: clientId }
                                });
                                if (clientInfoResult && clientInfoResult.success && clientInfoResult.data) {
                                    const clientInfoData = JSON.parse(clientInfoResult.data);
                                    if (clientInfoData.length > 0) {
                                        const basicInfo = clientInfoData[0];
                                        // clientStatus优先使用接口返回的值
                                        if (basicInfo.clientStatus !== undefined) {
                                            clientStatus = basicInfo.clientStatus;
                                        }
                                    }
                                }
                            } catch (error) {
                                console.warn("调用selectBasicInfo接口获取客户信息失败，使用表单数据:", error);
                            }
                            // 构建updateClient接口参数
                            // 根据base_edit.xwl中的逻辑构建参数，后端期望小驼峰格式
                            const userInfo = store.getModelState('user');
                            let updateParams = {
                                clientId: clientId,
                                clientName: clientName,
                                organFlag: organFlag,
                                clientBelong: clientBelong,
                                clientStatus: clientStatus,
                                workType: '1', // 0创建 1更新 2确认
                                dataStatus: '1', // 0草稿 1正式
                                updateUser: userInfo.userId
                            };

                            // 从表单数据中获取更多表单字段
                            // 注意：后端期望小驼峰格式
                            const formFields = [
                                'idType', 'idNo', 'idBegindate', 'idEnddate',
                                'nationality', 'birthday', 'industryType', 'industryName', 'tel',
                                'isObjectReport', 'associatedDate', 'remark',
                                'gender', 'income', 'professionCode', 'idAddress',
                                'address', 'officeAddress', 'registerCountry',
                                'registerMoneyType', 'registerFund', 'setupDate',
                                'busiScope', 'isSpecial', 'clientType',
                                'clientTypeOther', 'specialMatters', 'missingInformation',
                                'missingDraft', 'specialMattersOther', 'specialReason',
                                'completedCdd', 'lowRiskExplanation', 'takeMeasures',
                                // 反洗钱特殊情况附件字段
                                'communicationRecords', 'agreeRecords', 'otherRecords',
                                // 业务关系模块字段
                                'business_remark', 'associatedDate'
                            ];

                            const fieldMapping = {
                                'client_name': 'clientName',
                                'id_type': 'idType',
                                'id_no': 'idNo',
                                'id_begindate': 'idBegindate',
                                'id_enddate': 'idEnddate',
                                'nationality': 'nationality',
                                'birthday': 'birthday',
                                'industry_type': 'industryType',
                                'industry_name': 'industryName',
                                'tel': 'tel',
                                'gender': 'gender',
                                'income': 'income',
                                'profession_code': 'professionCode',
                                'id_address': 'idAddress',
                                'address': 'address',
                                'office_address': 'officeAddress',
                                'register_country': 'registerCountry',
                                'register_money_type': 'registerMoneyType',
                                'register_fund': 'registerFund',
                                'setup_date': 'setupDate',
                                'busi_scope': 'busiScope',
                                // 地址相关字段
                                'province': 'province',
                                'city': 'city',
                                'district': 'district',
                                'contact_province': 'province2',
                                'contact_city': 'city2',
                                'contact_district': 'district2',
                                'id_province': 'province1',
                                'id_city': 'city1',
                                'id_district': 'district1',
                                // 其他字段的映射
                                'is_object_report': 'isObjectReport',
                                'associated_date': 'associatedDate',
                                'remark': 'remark',
                                'is_special': 'isSpecial',
                                'client_type': 'clientType',
                                'client_type_other': 'clientTypeOther',
                                'missing_information': 'missingInformation',
                                'missing_draft': 'missingDraft',
                                'special_matters': 'specialMatters',
                                'special_matters_other': 'specialMattersOther',
                                'special_reason': 'specialReason',
                                'completed_cdd': 'completedCdd',
                                'low_risk_explanation': 'lowRiskExplanation',
                                'take_measures': 'takeMeasures',
                                // 大写下划线 -> 小驼峰
                                'CLIENT_NAME': 'clientName',
                                'ID_TYPE': 'idType',
                                'ID_NO': 'idNo',
                                'ID_BEGINDATE': 'idBegindate',
                                'ID_ENDDATE': 'idEnddate',
                                'NATIONALITY': 'nationality',
                                'BIRTHDAY': 'birthday',
                                'INDUSTRY_TYPE': 'industryType',
                                'INDUSTRY_NAME': 'industryName',
                                'TEL': 'tel',
                                'GENDER': 'gender',
                                'INCOME': 'income',
                                'PROFESSION_CODE': 'professionCode',
                                'ID_ADDRESS': 'idAddress',
                                'ADDRESS': 'address',
                                'OFFICE_ADDRESS': 'officeAddress',
                                'REGISTER_COUNTRY': 'registerCountry',
                                'REGISTER_MONEY_TYPE': 'registerMoneyType',
                                'REGISTER_FUND': 'registerFund',
                                'SETUP_DATE': 'setupDate',
                                'BUSI_SCOPE': 'busiScope',
                                'PROVINCE': 'province',
                                'CITY': 'city',
                                'DISTRICT': 'district',
                                'CONTACT_PROVINCE': 'contactProvince',
                                'CONTACT_CITY': 'contactCity',
                                'CONTACT_DISTRICT': 'contactDistrict',
                                'ID_PROVINCE': 'idProvince',
                                'ID_CITY': 'idCity',
                                'ID_DISTRICT': 'idDistrict',
                                // 其他可能需要映射的字段
                                'IS_OBJECT_REPORT': 'isObjectReport',
                                'ASSOCIATED_DATE': 'associatedDate',
                                'REMARK': 'remark',
                                'IS_SPECIAL': 'isSpecial',
                                'CLIENT_TYPE': 'clientType',
                                'CLIENT_TYPE_OTHER': 'clientTypeOther',
                                'MISSING_INFORMATION': 'missingInformation',
                                'MISSING_DRAFT': 'missingDraft',
                                'SPECIAL_MATTERS_OTHER': 'specialMattersOther',
                                'SPECIAL_REASON': 'specialReason',
                                'COMPLETED_CDD': 'completedCdd',
                                'LOW_RISK_EXPLANATION': 'lowRiskExplanation',
                                'TAKE_MEASURES': 'takeMeasures',
                                // 反洗钱特殊情况附件字段映射
                                'COMMUNICATION_RECORDS': 'communicationRecords',
                                'AGREE_RECORDS': 'agreeRecords',
                                'OTHER_RECORDS': 'otherRecords',
                                'communication_records': 'communicationRecords',
                                'agree_records': 'agreeRecords',
                                'other_records': 'otherRecords',
                                // 业务关系模块字段映射 - business_remark映射到remark
                                'business_remark': 'remark',
                                'BUSINESS_REMARK': 'remark'
                            };

                            // 从表单数据中获取字段值
                            // 首先尝试直接匹配小驼峰字段
                            formFields.forEach(field => {
                                if (formValues[field] !== undefined) {
                                    updateParams[field] = formValues[field];
                                }
                            });

                            // 然后尝试通过字段映射获取其他格式字段的值
                            Object.entries(fieldMapping).forEach(([sourceField, targetField]) => {
                                if (formValues[sourceField] !== undefined && updateParams[targetField] === undefined) {
                                    updateParams[targetField] = formValues[sourceField];
                                }
                            });

                            // 最后，尝试通用的字段名转换：尝试不同格式的字段名
                            formFields.forEach(field => {
                                if (updateParams[field] === undefined) {
                                    // 尝试小写下划线版本
                                    const snakeCaseField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
                                    if (formValues[snakeCaseField] !== undefined) {
                                        updateParams[field] = formValues[snakeCaseField];
                                    }
                                }
                            });

                            // 处理日期字段格式
                            const dateFields = ['idBegindate', 'idEnddate', 'birthday', 'setupDate', 'associatedDate'];
                            dateFields.forEach(field => {
                                if (updateParams[field] && updateParams[field].format) {
                                    // 如果是moment对象，转换为字符串格式
                                    updateParams[field] = updateParams[field].format('YYYY-MM-DD');
                                } else if (updateParams[field] && typeof updateParams[field] === 'object' && updateParams[field]._isAMomentObject) {
                                    // 另一种moment对象检测方式
                                    updateParams[field] = moment(updateParams[field]).format('YYYY-MM-DD');
                                }
                            });

                            // 处理多选字段
                            if (updateParams.clientType && Array.isArray(updateParams.clientType)) {
                                updateParams.clientType = updateParams.clientType.join(',');
                            }
                            if (updateParams.specialMatters && Array.isArray(updateParams.specialMatters)) {
                                updateParams.specialMatters = updateParams.specialMatters.join(',');
                            }

                            // 处理注册资本金字段：去掉千分位逗号，只保留数字
                            if (updateParams.registerFund !== undefined && updateParams.registerFund !== null && updateParams.registerFund !== '') {
                                // 转换为字符串后去掉所有逗号，再转回数字格式
                                const fundStr = String(updateParams.registerFund).replace(/,/g, '');
                                updateParams.registerFund = fundStr;
                            }

                            // 处理地址字段：将区域代码转换为中文名称
                            if (window.getAddressNames) {
                                const addressNames = window.getAddressNames();
                                // 机构户办公地址
                                if (addressNames.provinceName) {
                                    updateParams.province = addressNames.provinceName;
                                }
                                if (addressNames.cityName) {
                                    updateParams.city = addressNames.cityName;
                                }
                                if (addressNames.districtName) {
                                    updateParams.district = addressNames.districtName;
                                }
                                // 个人户联系地址
                                if (addressNames.contactProvinceName) {
                                    updateParams.province2 = addressNames.contactProvinceName;
                                }
                                if (addressNames.contactCityName) {
                                    updateParams.city2 = addressNames.contactCityName;
                                }
                                if (addressNames.contactDistrictName) {
                                    updateParams.district2 = addressNames.contactDistrictName;
                                }
                                // 个人户证件地址
                                if (addressNames.idProvinceName) {
                                    updateParams.province1 = addressNames.idProvinceName;
                                }
                                if (addressNames.idCityName) {
                                    updateParams.city1 = addressNames.idCityName;
                                }
                                if (addressNames.idDistrictName) {
                                    updateParams.district1 = addressNames.idDistrictName;
                                }
                            }

                            // 调用updateClient接口
                            const updateResult = await request({
                                url: 'thfxq/updateClient',
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                data: updateParams
                            });

                            if (updateResult && updateResult.success) {
                                message.success('保存成功')
                                // 可以在这里添加成功后的处理逻辑
                            }
                        }
                    }
                } catch (error) {
                    console.error("调用updateClient接口时出错:", error);
                }
            }
        }
        return false;
        message.success('保存成功');
        return true;
    },

    /**
     * 其他自定义校验，返回错误字符串表示校验失败
     */
    async checkExtraBeforeSubmit({ payload }, { getState, setState, dispatch }) {
        return null;
    },

    /**
     * 提交前校验，包括意见、表单、附件
     * 适用于下发按钮
     */
    async checkBeforeSubmit({ payload }, { getState, setState, dispatch }) {

        // 当前用户可编辑的情况下，先执行提交表单
        const { isBeforeDraft, isEdit, isFormInit, isSendBack, flowCode, curNode } = getState();

        if (isBeforeDraft) {
            // 如果尚未起草则执行起草
            const draftResult = await dispatch({
                type: 'draft',
            });
            if (typeof draftResult === 'string') {
                return `起草失败：${draftResult}`;
            }
        }
        if (!isFormInit) {
            return `表单未加载`;
        }

        // IBCM001流程在xmzqr节点、IBCM004流程在fxqkhqr节点跳过常规表单校验，使用clickSubmit中的特殊校验逻辑
        const skipFormCheck = isEdit && (
            (flowCode === 'IBCM001' && (curNode?.nodeCode === 'xmzqr' || curNode?.nodeCode === 'hgrysh')) ||
            (flowCode === 'IBCM004' && (curNode?.nodeCode === 'fxqkhqr' || curNode?.nodeCode === 'fxqkhdy'))
        );

        // 校验表单并保存
        if (!isSendBack && isEdit) {
            // 校验表单 - IBCM001流程跳过
            if (!skipFormCheck) {
                let checkMsg = await dispatch({
                    type: 'checkForm',
                });
                // 表单校验不通过，返回文本或者是数组文本
                if (typeof checkMsg === 'string') {
                    return `表单校验失败：${checkMsg}`;
                } else if (_.isArray(checkMsg)) {
                    return checkMsg;
                }
            }


            // 检查附件域
            let checkMsg = await dispatch({
                type: 'checkAttachment',
            });
            if (typeof checkMsg === 'string') {
                return `附件校验失败：${checkMsg}`;
            }

            // 其他自定义校验
            checkMsg = await dispatch({
                type: 'checkExtraBeforeSubmit',
            });
            if (typeof checkMsg === 'string') {
                return checkMsg;
            }

            // 保存表单
            checkMsg = await dispatch({
                type: 'submitForm',
                payload: {
                    type: "submit",
                }
            });
            if (typeof checkMsg === 'string') {
                return checkMsg ? `表单提交失败：${checkMsg}` : checkMsg;
            }
        }

        // 051工作流要求：先校验表单，再填写意见
        // 校验意见填写情况
        let checkMsg = await dispatch({
            type: 'checkOpinion',
        });
        if (typeof checkMsg === 'string') {
            // 点提交时不提示
            return checkMsg;
        }

        return true;
    },

    /**
     * 用户点击提交按钮
     */
    async clickSubmit({ payload }, { getState, setState, dispatch, setStateSilence }) {

        setStateSilence && setStateSilence({ isSendBack: false });
        const checkMsg = await dispatch({
            type: 'checkBeforeSubmit',
        });
        if (typeof checkMsg === 'string') {
            if (checkMsg) message.warn(checkMsg);
            return;
        } else if (_.isArray(checkMsg)) {
            if (checkMsg.length > 0) message.warn(<div>{checkMsg.map(msg => <div>{msg}</div>)}</div>);
            return;
        }

        // IBCM001流程和IBCM004流程特殊校验
        // ibcm001的xmzqr节点和ibcm004的fxqkhqr节点是完全相同的表单，使用相同的校验逻辑
        const { flowCode, isEdit, curNode } = getState();
        if (isEdit && (
            (flowCode === 'IBCM001' && curNode.nodeCode === 'xmzqr') ||
            (flowCode === 'IBCM004' && curNode.nodeCode === 'fxqkhqr')
        )) {
            try {
                // 获取表单数据
                const ibFlowForm = getState('ibFlowForm');
                if (!ibFlowForm) {
                    message.warn('无法获取表单对象，无法进行反洗钱流程校验');
                    return;
                }

                const formValues = ibFlowForm.getFieldsValue();
                const clientId = formValues.CLIENT_ID;
                const organFlag = formValues.ORGAN_FLAG || '1';
                const isSpecial = formValues.is_special;

                if (!clientId) {
                    message.warn('无法获取客户ID，无法进行反洗钱流程校验');
                    return;
                }

                // 构建错误消息数组
                const errorMessages = [];


                // 根据反洗钱特殊情况选择校验逻辑
                if (isSpecial === '1') {
                    // === 反洗钱特殊情况为"是" ===
                    // 1. BasicInfo字段非必填，不校验

                    // 2. 校验FxqSpecial反洗钱特殊情况模块
                    const requiredSpecialFields = [
                        { field: 'client_type', label: '客户类型', required: true },
                        { field: 'special_matters', label: '特殊事项', required: true },
                        { field: 'special_reason', label: '特殊事项原因', required: true },
                        { field: 'completed_cdd', label: '已开展的反洗钱尽职调查工作', required: true },
                        { field: 'low_risk_explanation', label: '客户洗钱风险较低的评估说明', required: true },
                        { field: 'take_measures', label: '后续措施', required: true }
                    ];

                    requiredSpecialFields.forEach(({ field, label, required }) => {
                        if (required) {
                            const value = formValues[field] || formValues[field.toUpperCase()] || formValues[field.toLowerCase()];
                            if (!value || (Array.isArray(value) && value.length === 0)) {
                                errorMessages.push({ type: 'fxqSpecial', field, label, msg: `请填写"${label}"` });
                            }
                        }
                    });

                    // 校验条件字段
                    const clientType = formValues.clientType || formValues.CLIENT_TYPE || formValues.client_type;
                    if (clientType && (Array.isArray(clientType) ? clientType.includes('99') : clientType.indexOf('99') !== -1)) {
                        const clientTypeOther = formValues.clientTypeOther || formValues.CLIENT_TYPE_OTHER || formValues.client_type_other;
                        if (!clientTypeOther) {
                            errorMessages.push({ type: 'fxqSpecial', field: 'client_type_other', label: '客户类型具体说明', msg: '请填写"客户类型具体说明"' });
                        }
                    }

                    const specialMatters = formValues.specialMatters || formValues.SPECIAL_MATTERS || formValues.special_matters;
                    if (specialMatters && (Array.isArray(specialMatters) ? specialMatters.includes('1') : specialMatters.indexOf('1') !== -1)) {
                        const missingInformation = formValues.missingInformation || formValues.MISSING_INFORMATION || formValues.missing_information;
                        if (!missingInformation) {
                            errorMessages.push({ type: 'fxqSpecial', field: 'missing_information', label: '具体说明缺失的信息', msg: '请填写"具体说明缺失的信息"' });
                        }
                    }

                    if (specialMatters && (Array.isArray(specialMatters) ? specialMatters.includes('2') : specialMatters.indexOf('2') !== -1)) {
                        const missingDraft = formValues.missingDraft || formValues.MISSING_DRAFT || formValues.missing_draft;
                        if (!missingDraft) {
                            errorMessages.push({ type: 'fxqSpecial', field: 'missing_draft', label: '具体说明缺失的底稿', msg: '请填写"具体说明缺失的底稿"' });
                        }
                    }

                    // 校验单个关联人记录的必填字段
                    const validateRelatedPersonRecord = (record, typeLabel, relatedType) => {
                        const errors = [];
                        const relatedName = record.related_name || record.relatedName;
                        const organFlag = record.organ_flag || record.organFlag;
                        const isGovDept = record.is_government_dept === '1' || record.isGovernmentDept === '1';
                        
                        // 如果是政府部门，只需校验姓名和是否政府部门字段
                        if (isGovDept) {
                            if (!relatedName) {
                                errors.push(`${typeLabel}"${relatedName || '未命名'}"的"姓名"不能为空`);
                            }
                            return errors.length > 0 ? errors : null;
                        }
                        
                        // 通用必填字段校验
                        const requiredFields = [
                            { field: relatedName, label: '姓名', prop: 'related_name' },
                            { field: record.nationality, label: '国家或地区', prop: 'nationality' },
                            { field: record.id_begindate || record.idBeginDate, label: '证件开始日期', prop: 'id_begindate' },
                            { field: record.id_enddate || record.idEndDate, label: '证件结束日期', prop: 'id_enddate' },
                            { field: record.id_type || record.idType, label: '证件类型', prop: 'id_type' },
                            { field: record.id_no || record.idNo, label: '证件号码', prop: 'id_no' }
                        ];
                        
                        requiredFields.forEach(({ field, label }) => {
                            if (!field) {
                                errors.push(`${typeLabel}"${relatedName || '未命名'}"的"${label}"不能为空`);
                            }
                        });
                        
                        // 机构类型 (organ_flag = 1)：校验是否政府部门字段
                        if (organFlag === '1') {
                            if (record.is_government_dept === undefined && record.isGovernmentDept === undefined) {
                                errors.push(`${typeLabel}"${relatedName || '未命名'}"的"是否政府部门"不能为空`);
                            }
                        }
                        
                        // 自然人类型 (organ_flag = 0)：校验出生日期
                        if (organFlag === '0' || organFlag === 'false') {
                            if (!record.birthday) {
                                errors.push(`${typeLabel}"${relatedName || '未命名'}"的"出生日期"不能为空`);
                            }
                        }
                        
                        // 法定代表人 (relatedType = 1) 和授权代表人 (relatedType = 4)：校验联系方式
                        if (relatedType === '1' || relatedType === '4') {
                            const mobno1 = record.mobno1;
                            if (!mobno1) {
                                errors.push(`${typeLabel}"${relatedName || '未命名'}"的"联系方式"不能为空`);
                            }
                        }
                        
                        // 受益所有人 (relatedType = 5)：校验受益所有人类型和地址
                        if (relatedType === '5') {
                            if (!record.beneficiary) {
                                errors.push(`${typeLabel}"${relatedName || '未命名'}"的"受益所有人类型"不能为空`);
                            }
                            if (!record.address) {
                                errors.push(`${typeLabel}"${relatedName || '未命名'}"的"地址"不能为空`);
                            }
                            // 如果受益所有人类型为A1/A2/B1/D1，还需校验股权比例
                            const beneficiaryTypes = ['A1', 'A2', 'B1', 'D1'];
                            if (beneficiaryTypes.includes(record.beneficiary)) {
                                if (!record.shareholding_ratio && !record.shareholdingRatio) {
                                    errors.push(`${typeLabel}"${relatedName || '未命名'}"的"受益所有人股权比例"不能为空`);
                                }
                            }
                        }
                        
                        return errors.length > 0 ? errors : null;
                    };

                    // 3. 校验关联人信息（仅机构户）
                    if (organFlag === '1') {
                        // 从CustomForm获取关联人信息（使用带命名空间的全局函数）
                        const getRelatedInfoFn = window[`getRelatedInfo_${flowCode}`] || window.getRelatedInfo;
                        const relatedInfo = getRelatedInfoFn ? getRelatedInfoFn() : null;

                        if (relatedInfo) {
                            // 法定代表人 (relatedType='1') - 只需校验姓名是否必填
                            if (!relatedInfo.legalRep || relatedInfo.legalRep.length === 0) {
                                errorMessages.push({ type: 'relatedPerson', subType: 'legalRep', label: '法定代表人', msg: '请添加"法定代表人"信息' });
                            } else {
                                relatedInfo.legalRep.forEach(record => {
                                    const relatedName = record.related_name || record.relatedName;
                                    if (!relatedName) {
                                        errorMessages.push({ type: 'relatedPerson', subType: 'legalRep', label: '法定代表人', msg: `法定代表人"${relatedName || '未命名'}"的"姓名"不能为空` });
                                    }
                                });
                            }

                            // 授权代表人 (relatedType='4') - 只需校验姓名是否必填
                            if (!relatedInfo.authorizedRep || relatedInfo.authorizedRep.length === 0) {
                                errorMessages.push({ type: 'relatedPerson', subType: 'authorizedRep', label: '授权代表人', msg: '请添加"授权代表人"信息' });
                            } else {
                                relatedInfo.authorizedRep.forEach(record => {
                                    const relatedName = record.related_name || record.relatedName;
                                    if (!relatedName) {
                                        errorMessages.push({ type: 'relatedPerson', subType: 'authorizedRep', label: '授权代表人', msg: `授权代表人"${relatedName || '未命名'}"的"姓名"不能为空` });
                                    }
                                });
                            }

                            // 受益所有人 (relatedType='5') - 只需校验姓名是否必填
                            if (!relatedInfo.beneficialOwner || relatedInfo.beneficialOwner.length === 0) {
                                errorMessages.push({ type: 'relatedPerson', subType: 'beneficialOwner', label: '受益所有人', msg: '请添加"受益所有人"信息' });
                            } else {
                                relatedInfo.beneficialOwner.forEach(record => {
                                    const relatedName = record.related_name || record.relatedName;
                                    if (!relatedName) {
                                        errorMessages.push({ type: 'relatedPerson', subType: 'beneficialOwner', label: '受益所有人', msg: `受益所有人"${relatedName || '未命名'}"的"姓名"不能为空` });
                                    }
                                });
                            }

                            // 控股股东 (relatedType='2') - 反洗钱特殊情况为"是"时无需校验
                            // 实际控制人 (relatedType='3') - 反洗钱特殊情况为"是"时无需校验
                        } else {
                            console.warn('无法获取关联人信息，跳过关联人校验');
                        }
                    }

                } else {
                    // === 反洗钱特殊情况为"否" ===
                    // 1. 校验BasicInfo所有必填字段
                    if (organFlag === '0') {
                        // 个人户必填字段
                        const requiredFields = [
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

                        requiredFields.forEach(({ field, label }) => {
                            const value = formValues[field] || formValues[field.toUpperCase()] || formValues[field.toLowerCase()];
                            if (!value) {
                                errorMessages.push({ type: 'basicInfo', field, label, msg: `请填写"${label}"` });
                            }
                        });
                        
                        // 校验个人户证件号码格式（身份证和营业执照）
                        const idType = formValues.id_type || formValues.ID_TYPE;
                        const idNo = formValues.id_no || formValues.ID_NO;
                        if (idType && idNo) {
                            // 身份证格式校验：18位，符合身份证号规则
                            if (idType === '1') {
                                const idCardRegex = /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
                                if (!idCardRegex.test(idNo)) {
                                    errorMessages.push({ type: 'basicInfo', field: 'id_no', label: '证件号码', msg: '请输入正确的证件号码' });
                                }
                            }
                            // 营业执照格式校验：统一社会信用代码（18位）
                            else if (idType === '3') {
                                const businessLicenseRegex = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
                                if (!businessLicenseRegex.test(idNo)) {
                                    errorMessages.push({ type: 'basicInfo', field: 'id_no', label: '证件号码', msg: '请输入正确的证件号码' });
                                }
                            }
                        }
                    } else {
                        // 机构户必填字段
                        const requiredFields = [
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

                        requiredFields.forEach(({ field, label }) => {
                            const value = formValues[field] || formValues[field.toUpperCase()] || formValues[field.toLowerCase()];
                            if (!value) {
                                errorMessages.push({ type: 'basicInfo', field, label, msg: `请填写"${label}"` });
                            }
                        });

                        // 校验省市区（仅境内）
                        const registerCountry = formValues.register_country;
                        if (registerCountry === '00CN') {
                            const province = formValues.province;
                            const city = formValues.city;
                            const district = formValues.district;
                            if (!province) errorMessages.push({ type: 'basicInfo', field: 'province', label: '省', msg: '请选择"省"' });
                            if (!city) errorMessages.push({ type: 'basicInfo', field: 'city', label: '市', msg: '请选择"市"' });
                            if (!district) errorMessages.push({ type: 'basicInfo', field: 'district', label: '区', msg: '请选择"区"' });
                        }
                        
                        // 校验机构户证件号码格式（身份证和营业执照）
                        const idType = formValues.id_type || formValues.ID_TYPE;
                        const idNo = formValues.id_no || formValues.ID_NO;
                        if (idType && idNo) {
                            // 身份证格式校验：18位，符合身份证号规则
                            if (idType === '1') {
                                const idCardRegex = /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
                                if (!idCardRegex.test(idNo)) {
                                    errorMessages.push({ type: 'basicInfo', field: 'id_no', label: '证照号码', msg: '请输入正确的证件号码' });
                                }
                            }
                            // 营业执照格式校验：统一社会信用代码（18位）
                            else if (idType === '3') {
                                const businessLicenseRegex = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
                                if (!businessLicenseRegex.test(idNo)) {
                                    errorMessages.push({ type: 'basicInfo', field: 'id_no', label: '证照号码', msg: '请输入正确的证件号码' });
                                }
                            }
                        }
                    }

                    // 2. 校验关联人信息（仅机构户）
                    if (organFlag === '1') {
                        // 从CustomForm获取关联人信息（使用带命名空间的全局函数）
                        const getRelatedInfoFn = window[`getRelatedInfo_${flowCode}`] || window.getRelatedInfo;
                        const relatedInfo = getRelatedInfoFn ? getRelatedInfoFn() : null;

                        // 校验单个关联人记录的必填字段
                        const validateRelatedPersonRecord = (record, typeLabel, relatedType) => {
                            const errors = [];
                            const relatedName = record.related_name || record.relatedName;
                            const organFlag = record.organ_flag || record.organFlag;
                            const isGovDept = record.is_government_dept === '1' || record.isGovernmentDept === '1';
                            
                            // 如果是政府部门，只需校验姓名和是否政府部门字段
                            if (isGovDept) {
                                if (!relatedName) {
                                    errors.push(`${typeLabel}"${relatedName || '未命名'}"的"姓名"不能为空`);
                                }
                                return errors.length > 0 ? errors : null;
                            }
                            
                            // 通用必填字段校验
                            const requiredFields = [
                                { field: relatedName, label: '姓名' },
                                { field: record.nationality, label: '国家或地区' },
                                { field: record.id_begindate || record.idBeginDate, label: '证件开始日期' },
                                { field: record.id_enddate || record.idEndDate, label: '证件结束日期' },
                                { field: record.id_type || record.idType, label: '证件类型' },
                                { field: record.id_no || record.idNo, label: '证件号码' }
                            ];
                            
                            requiredFields.forEach(({ field, label }) => {
                                if (!field) {
                                    errors.push(`${typeLabel}"${relatedName || '未命名'}"的"${label}"不能为空`);
                                }
                            });
                            
                            // 机构类型 (organ_flag = 1)：校验是否政府部门字段
                            if (organFlag === '1') {
                                if (record.is_government_dept === undefined && record.isGovernmentDept === undefined) {
                                    errors.push(`${typeLabel}"${relatedName || '未命名'}"的"是否政府部门"不能为空`);
                                }
                            }
                            
                            // 自然人类型 (organ_flag = 0)：校验出生日期
                            if (organFlag === '0' || organFlag === 'false') {
                                if (!record.birthday) {
                                    errors.push(`${typeLabel}"${relatedName || '未命名'}"的"出生日期"不能为空`);
                                }
                            }
                            
                            // 法定代表人 (relatedType = 1) 和授权代表人 (relatedType = 4)：校验联系方式
                            if (relatedType === '1' || relatedType === '4') {
                                const mobno1 = record.mobno1;
                                if (!mobno1) {
                                    errors.push(`${typeLabel}"${relatedName || '未命名'}"的"联系方式"不能为空`);
                                }
                            }
                            
                            // 受益所有人 (relatedType = 5)：校验受益所有人类型和地址
                            if (relatedType === '5') {
                                if (!record.beneficiary) {
                                    errors.push(`${typeLabel}"${relatedName || '未命名'}"的"受益所有人类型"不能为空`);
                                }
                                if (!record.address) {
                                    errors.push(`${typeLabel}"${relatedName || '未命名'}"的"地址"不能为空`);
                                }
                                // 如果受益所有人类型为A1/A2/B1/D1，还需校验股权比例
                                const beneficiaryTypes = ['A1', 'A2', 'B1', 'D1'];
                                if (beneficiaryTypes.includes(record.beneficiary)) {
                                    if (!record.shareholding_ratio && !record.shareholdingRatio) {
                                        errors.push(`${typeLabel}"${relatedName || '未命名'}"的"受益所有人股权比例"不能为空`);
                                    }
                                }
                            }
                            
                            return errors.length > 0 ? errors : null;
                        };

                        if (relatedInfo) {
                            // 法定代表人必填 (relatedType='1')
                            if (!relatedInfo.legalRep || relatedInfo.legalRep.length === 0) {
                                errorMessages.push({ type: 'relatedPerson', subType: 'legalRep', label: '法定代表人', msg: '请添加"法定代表人"信息' });
                            } else {
                                relatedInfo.legalRep.forEach(record => {
                                    const errors = validateRelatedPersonRecord(record, '法定代表人', '1');
                                    if (errors) {
                                        errors.forEach(error => {
                                            errorMessages.push({ type: 'relatedPerson', subType: 'legalRep', label: '法定代表人', msg: error });
                                        });
                                    }
                                });
                            }

                            // 授权代表人必填 (relatedType='4')
                            if (!relatedInfo.authorizedRep || relatedInfo.authorizedRep.length === 0) {
                                errorMessages.push({ type: 'relatedPerson', subType: 'authorizedRep', label: '授权代表人', msg: '请添加"授权代表人"信息' });
                            } else {
                                relatedInfo.authorizedRep.forEach(record => {
                                    const errors = validateRelatedPersonRecord(record, '授权代表人', '4');
                                    if (errors) {
                                        errors.forEach(error => {
                                            errorMessages.push({ type: 'relatedPerson', subType: 'authorizedRep', label: '授权代表人', msg: error });
                                        });
                                    }
                                });
                            }

                            // 受益所有人必填 (relatedType='5')
                            if (!relatedInfo.beneficialOwner || relatedInfo.beneficialOwner.length === 0) {
                                errorMessages.push({ type: 'relatedPerson', subType: 'beneficialOwner', label: '受益所有人', msg: '请添加"受益所有人"信息' });
                            } else {
                                relatedInfo.beneficialOwner.forEach(record => {
                                    const errors = validateRelatedPersonRecord(record, '受益所有人', '5');
                                    if (errors) {
                                        errors.forEach(error => {
                                            errorMessages.push({ type: 'relatedPerson', subType: 'beneficialOwner', label: '受益所有人', msg: error });
                                        });
                                    }
                                });
                            }

                            // 控股股东 (relatedType='2') - 可选，但如果存在则校验内部字段
                            if (relatedInfo.controllingShareholder && relatedInfo.controllingShareholder.length > 0) {
                                relatedInfo.controllingShareholder.forEach(record => {
                                    const errors = validateRelatedPersonRecord(record, '控股股东', '2');
                                    if (errors) {
                                        errors.forEach(error => {
                                            errorMessages.push({ type: 'relatedPerson', subType: 'controllingShareholder', label: '控股股东', msg: error });
                                        });
                                    }
                                });
                            }

                            // 实际控制人 (relatedType='3') - 可选，但如果存在则校验内部字段
                            if (relatedInfo.actualController && relatedInfo.actualController.length > 0) {
                                relatedInfo.actualController.forEach(record => {
                                    const errors = validateRelatedPersonRecord(record, '实际控制人', '3');
                                    if (errors) {
                                        errors.forEach(error => {
                                            errorMessages.push({ type: 'relatedPerson', subType: 'actualController', label: '实际控制人', msg: error });
                                        });
                                    }
                                });
                            }
                        } else {
                            console.warn('无法获取关联人信息，跳过关联人校验');
                        }
                    }
                }

                // 3. 如果有错误信息，处理友好的交互提示
                if (errorMessages.length > 0) {
                    // 按类型分组错误
                    const basicInfoErrors = errorMessages.filter(e => e.type === 'basicInfo');
                    const fxqSpecialErrors = errorMessages.filter(e => e.type === 'fxqSpecial');
                    const relatedPersonErrors = errorMessages.filter(e => e.type === 'relatedPerson');

                    // 触发表单验证显示红框和字段错误提示（使用带命名空间的全局函数）
                    let validationFieldErrors = {};
                    const validateFormFn = window[`validateForm_${flowCode}`] || window.validateIBCM001Form;
                    if (validateFormFn) {
                        // 调用CustomForm的校验方法，会自动设置字段错误状态
                        const validationResult = validateFormFn();
                        // 获取字段错误信息
                        if (validationResult && validationResult.fieldErrors) {
                            validationFieldErrors = validationResult.fieldErrors;
                        }
                    }

                    // 确定滚动目标
                    let scrollToId = null;
                    if (basicInfoErrors.length > 0) {
                        scrollToId = 'basicInfo';
                    } else if (fxqSpecialErrors.length > 0) {
                        scrollToId = 'fxqSpecial';
                    } else if (relatedPersonErrors.length > 0) {
                        // 映射关联人类型到元素ID
                        const typeToId = {
                            'legalRep': 'LegalRep',
                            'authorizedRep': 'authorizedRep',
                            'beneficialOwner': 'beneficialOwner'
                        };
                        scrollToId = typeToId[relatedPersonErrors[0].subType] || 'LegalRep';
                    }

                    // 构建分组错误显示
                    const renderErrorSection = (title, errors) => {
                        if (errors.length === 0) return null;
                        return (
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ fontWeight: 500, marginBottom: 4, color: '#262626' }}>{title}：</div>
                                <ul style={{ paddingLeft: 20, margin: 0, color: '#595959' }}>
                                    {errors.map((err, index) => (
                                        <li key={index}>{err.msg || `${err.label}未填写`}</li>
                                    ))}
                                </ul>
                            </div>
                        );
                    };

                    // 显示错误提示
                    Modal.warning({
                        title: '表单校验不完整',
                        content: (
                            <div>
                                <p style={{ marginBottom: 12, color: '#8c8c8c', fontSize: 13 }}>请完善以下必填信息：</p>
                                {renderErrorSection('客户基本信息', basicInfoErrors)}
                                {renderErrorSection('反洗钱特殊情况', fxqSpecialErrors)}
                                {renderErrorSection('关联人信息', relatedPersonErrors)}
                            </div>
                        ),
                        okText: '去完善',
                        onOk: () => {
                            // 滚动到第一个错误位置（使用带命名空间的全局函数）
                            const scrollToElementFn = window[`scrollToElement_${flowCode}`] || window.scrollToElement;
                            if (scrollToId && scrollToElementFn) {
                                scrollToElementFn(scrollToId);
                            }
                        }
                    });
                    return;
                }

                // 构建updateClient接口参数（与保存按钮相同的逻辑）
                const userInfo = store.getModelState('user');
                
                // 从表单数据中获取客户信息
                // clientName从BasicInfo表单绑定的client_name字段获取
                // clientStatus从selectBasicInfo接口获取
                let clientName = formValues.client_name || formValues.CLIENT_NAME;
                let clientStatus = formValues.CLIENT_STATUS || formValues.clientStatus || '0';
                try {
                    const clientInfoResult = await request({
                        url: 'thfxq/selectBasicInfo',
                        method: 'GET',
                        params: { clientId: clientId }
                    });
                    if (clientInfoResult && clientInfoResult.success && clientInfoResult.data) {
                        const clientInfoData = JSON.parse(clientInfoResult.data);
                        if (clientInfoData.length > 0) {
                            const basicInfo = clientInfoData[0];
                            // clientStatus优先使用接口返回的值
                            if (basicInfo.clientStatus !== undefined) {
                                clientStatus = basicInfo.clientStatus;
                            }
                        }
                    }
                } catch (error) {
                    console.warn("调用selectBasicInfo接口获取客户信息失败，使用表单数据:", error);
                }
                
                let updateParams = {
                    clientId: clientId,
                    clientName: clientName,
                    organFlag: organFlag,
                    clientBelong: formValues.CLIENT_BELONG || formValues.clientBelong,
                    clientStatus: clientStatus,
                    workType: '1', // 0创建 1更新 2确认
                    dataStatus: '1', // 0草稿 1正式
                    updateUser: userInfo.userId
                };

                // 使用与clickSave方法相同的字段映射逻辑
                const fieldMapping = {
                    'id_type': 'idType',
                    'id_no': 'idNo',
                    'id_begindate': 'idBegindate',
                    'id_enddate': 'idEnddate',
                    'nationality': 'nationality',
                    'birthday': 'birthday',
                    'industry_type': 'industryType',
                    'industry_name': 'industryName',
                    'tel': 'tel',
                    'gender': 'gender',
                    'income': 'income',
                    'profession_code': 'professionCode',
                    'id_address': 'idAddress',
                    'address': 'address',
                    'office_address': 'officeAddress',
                    'register_country': 'registerCountry',
                    'register_money_type': 'registerMoneyType',
                    'register_fund': 'registerFund',
                    'setup_date': 'setupDate',
                    'busi_scope': 'busiScope',
                    // 地址相关字段
                    'province': 'province',
                    'city': 'city',
                    'district': 'district',
                    'contact_province': 'province2',
                    'contact_city': 'city2',
                    'contact_district': 'district2',
                    'id_province': 'province1',
                    'id_city': 'city1',
                    'id_district': 'district1',
                    // 其他字段的映射
                    'is_object_report': 'isObjectReport',
                    'associated_date': 'associatedDate',
                    'remark': 'remark',
                    'is_special': 'isSpecial',
                    'client_type': 'clientType',
                    'client_type_other': 'clientTypeOther',
                    'missing_information': 'missingInformation',
                    'missing_draft': 'missingDraft',
                    'special_matters': 'specialMatters',
                    'special_matters_other': 'specialMattersOther',
                    'special_reason': 'specialReason',
                    'completed_cdd': 'completedCdd',
                    'low_risk_explanation': 'lowRiskExplanation',
                    'take_measures': 'takeMeasures',
                    // 大写下划线 -> 小驼峰
                    'CLIENT_NAME': 'clientName',
                    'ID_TYPE': 'idType',
                    'ID_NO': 'idNo',
                    'ID_BEGINDATE': 'idBegindate',
                    'ID_ENDDATE': 'idEnddate',
                    'NATIONALITY': 'nationality',
                    'BIRTHDAY': 'birthday',
                    'INDUSTRY_TYPE': 'industryType',
                    'INDUSTRY_NAME': 'industryName',
                    'TEL': 'tel',
                    'GENDER': 'gender',
                    'INCOME': 'income',
                    'PROFESSION_CODE': 'professionCode',
                    'ID_ADDRESS': 'idAddress',
                    'ADDRESS': 'address',
                    'OFFICE_ADDRESS': 'officeAddress',
                    'REGISTER_COUNTRY': 'registerCountry',
                    'REGISTER_MONEY_TYPE': 'registerMoneyType',
                    'REGISTER_FUND': 'registerFund',
                    'SETUP_DATE': 'setupDate',
                    'BUSI_SCOPE': 'busiScope',
                    'PROVINCE': 'province',
                    'CITY': 'city',
                    'DISTRICT': 'district',
                    'CONTACT_PROVINCE': 'province2',
                    'CONTACT_CITY': 'city2',
                    'CONTACT_DISTRICT': 'district2',
                    'ID_PROVince': 'province1',
                    'ID_CITY': 'city1',
                    'ID_DISTRICT': 'district1',
                    // 其他可能需要映射的字段
                    'IS_OBJECT_REPORT': 'isObjectReport',
                    'ASSOCIATED_DATE': 'associatedDate',
                    'REMARK': 'remark',
                    'IS_SPECIAL': 'isSpecial',
                    'CLIENT_TYPE': 'clientType',
                    'CLIENT_TYPE_OTHER': 'clientTypeOther',
                    'MISSING_INFORMATION': 'missingInformation',
                    'MISSING_DRAFT': 'missingDraft',
                    'SPECIAL_MATTERS': 'specialMatters',
                    'SPECIAL_MATTERS_OTHER': 'specialMattersOther',
                    'SPECIAL_REASON': 'specialReason',
                    'COMPLETED_CDD': 'completedCdd',
                    'LOW_RISK_EXPLANATION': 'lowRiskExplanation',
                    'TAKE_MEASURES': 'takeMeasures',
                    // 业务关系模块字段映射 - business_remark映射到remark
                    'business_remark': 'remark',
                    'BUSINESS_REMARK': 'remark'
                };

                // 首先尝试直接匹配小驼峰字段
                const formFields = [
                    'idType', 'idNo', 'idBegindate', 'idEnddate',
                    'nationality', 'birthday', 'industryType', 'tel',
                    'gender', 'income', 'professionCode', 'idAddress',
                    'address', 'officeAddress', 'registerCountry',
                    'registerMoneyType', 'registerFund', 'setupDate',
                    'busiScope', 'isObjectReport', 'associatedDate', 'remark',
                    'isSpecial', 'clientType', 'clientTypeOther', 'specialMatters',
                    'missingInformation', 'missingDraft', 'specialMattersOther',
                    'specialReason', 'completedCdd', 'lowRiskExplanation', 'takeMeasures',
                    'province', 'city', 'district', 'province2', 'city2',
                    'district2', 'province1', 'city1', 'district1',
                    // 业务关系模块字段
                    'business_remark'
                ];

                formFields.forEach(field => {
                    if (formValues[field] !== undefined) {
                        updateParams[field] = formValues[field];
                    }
                });

                // 然后尝试通过字段映射获取其他格式字段的值
                Object.entries(fieldMapping).forEach(([sourceField, targetField]) => {
                    if (formValues[sourceField] !== undefined && updateParams[targetField] === undefined) {
                        updateParams[targetField] = formValues[sourceField];
                    }
                });

                // 最后，尝试通用的字段名转换：尝试不同格式的字段名
                formFields.forEach(field => {
                    if (updateParams[field] === undefined) {
                        // 尝试小写下划线版本
                        const snakeCaseField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
                        if (formValues[snakeCaseField] !== undefined) {
                            updateParams[field] = formValues[snakeCaseField];
                        }
                    }
                });

                // 处理日期字段格式
                const dateFields = ['idBegindate', 'idEnddate', 'birthday', 'setupDate', 'associatedDate'];
                dateFields.forEach(field => {
                    if (updateParams[field] && updateParams[field].format) {
                        updateParams[field] = updateParams[field].format('YYYY-MM-DD');
                    } else if (updateParams[field] && typeof updateParams[field] === 'object' && updateParams[field]._isAMomentObject) {
                        updateParams[field] = moment(updateParams[field]).format('YYYY-MM-DD');
                    }
                });

                // 处理多选字段
                if (updateParams.clientType && Array.isArray(updateParams.clientType)) {
                    updateParams.clientType = updateParams.clientType.join(',');
                }
                if (updateParams.specialMatters && Array.isArray(updateParams.specialMatters)) {
                    updateParams.specialMatters = updateParams.specialMatters.join(',');
                }

                // 处理注册资本金字段：去掉千分位逗号，只保留数字
                if (updateParams.registerFund !== undefined && updateParams.registerFund !== null && updateParams.registerFund !== '') {
                    // 转换为字符串后去掉所有逗号，再转回数字格式
                    const fundStr = String(updateParams.registerFund).replace(/,/g, '');
                    updateParams.registerFund = fundStr;
                }

                // 处理地址字段：将区域代码转换为中文名称
                if (window.getAddressNames) {
                    const addressNames = window.getAddressNames();
                    // 机构户办公地址
                    if (addressNames.provinceName) {
                        updateParams.province = addressNames.provinceName;
                    }
                    if (addressNames.cityName) {
                        updateParams.city = addressNames.cityName;
                    }
                    if (addressNames.districtName) {
                        updateParams.district = addressNames.districtName;
                    }
                    // 个人户联系地址
                    if (addressNames.contactProvinceName) {
                        updateParams.province2 = addressNames.contactProvinceName;
                    }
                    if (addressNames.contactCityName) {
                        updateParams.city2 = addressNames.contactCityName;
                    }
                    if (addressNames.contactDistrictName) {
                        updateParams.district2 = addressNames.contactDistrictName;
                    }
                    // 个人户证件地址
                    if (addressNames.idProvinceName) {
                        updateParams.province1 = addressNames.idProvinceName;
                    }
                    if (addressNames.idCityName) {
                        updateParams.city1 = addressNames.idCityName;
                    }
                    if (addressNames.idDistrictName) {
                        updateParams.district1 = addressNames.idDistrictName;
                    }
                }

                // 调用updateClient接口
                const updateResult = await request({
                    url: 'thfxq/updateClient',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: updateParams
                });

                if (updateResult && updateResult.success) {
                    message.success('客户信息更新成功');
                } else {
                    const errorMsg = updateResult ? updateResult.ErrMsg || '更新失败' : '网络错误';
                    message.warn(`客户信息更新失败: ${errorMsg}`);
                    return; // 接口调用失败，不继续流程
                }

            } catch (error) {
                message.error(`反洗钱流程校验出错: ${error.message || '未知错误'}`);
                return;
            }
        } else if ((flowCode === 'IBCM001' && curNode.nodeCode === 'hgrysh') || (flowCode === 'IBCM004' && curNode.nodeCode === 'fxqkhdy')) {
            // 使用带命名空间的全局函数获取审核记录数据
            const getReviewRecordDataFn = window[`getReviewRecordData_${flowCode}`] || window.getReviewRecordData;
            const reviewRecordData = getReviewRecordDataFn ? getReviewRecordDataFn() : null;

            if (!reviewRecordData) {
                message.error('无法获取审核记录数据，请确保审核意见组件已加载');
                return;
            }

            const { tableData, remark, clientId } = reviewRecordData;

            // 检查是否有审核问题行（空行需用户手动点击"移除"删除后，才视为不录入审核问题）
            const hasReviewData = tableData.length > 0;

            if (!hasReviewData) {
                // 没有审核数据，弹窗提示
                Modal.confirm({
                    title: '提示',
                    content: '若要送项目组确认请先录入审核问题；若确认无误可直接送结束，无需再录入审核问题',
                    okText: '确认',
                    cancelText: '取消',
                    onOk: async () => {
                        // 用户点击确认后，显示选择路径弹窗
                        await dispatch({
                            type: 'togglePathSelectModal',
                        });
                    }
                });
                return;
            }


            if (!clientId) {
                message.error('无法获取客户ID，无法进行审核校验');
                return;
            }

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
        }

        // 显示选择路径弹窗
        await dispatch({
            type: 'togglePathSelectModal',
        });
    },

    async clickSendBack({ payload }, { getState, setState, dispatch, setStateSilence }) {
        setStateSilence({ isSendBack: true });
        const checkMsg = await dispatch({
            type: 'checkBeforeSubmit',
        });
        if (typeof checkMsg === 'string') {
            if (checkMsg) message.warn(checkMsg);
            return;
        } else if (_.isArray(checkMsg)) {
            if (checkMsg.length > 0) message.warn(<div>{checkMsg.map(msg => <div>{msg}</div>)}</div>);
            return;
        }

        // 显示选择路径弹窗
        await dispatch({
            type: 'togglePathSelectModal',
        });
    },

    async getCompleteTaskParams({ payload }, { getState, setState, dispatch }) {
        const {
            piid,
            tiid,
            nextPathList,
            selectFlag,
            selectedPathIds,
            selectedPathNames,
            selectedPaths,
            selectedNodesHandlers,
            groupSelectId,
            nodesHandlers,
            nodeChooseTypes,
            todoTitle,
            instancyLv,
            secrecyLv,
            // serialNum,
            smartCommitModalVisible,
            smartCommitParams,
        } = getState();

        const completeTaskPathList = [];
        const data = {
            piid,
            tiid,
            todoTitle,
            instancyLv,
            secrecyLv,
            completeTaskPathList,   // 提交路径集合
        };

        if (smartCommitModalVisible) {
            // 智能提交
            data.completeTaskPathList = smartCommitParams.candidateInfo;
        } else {
            // 正常提交
            selectedPaths.forEach(path => {
                const { id, pathCode, pathName, beginNodeCode, endNodeCode, pathType, approveType } = path;
                const chooseType = nodeChooseTypes[endNodeCode];
                let handlerInfoList;
                if (chooseType === 2) {
                    // 环节候选人设置为全选时，将所有候选人加入处理人
                    handlerInfoList = nodesHandlers[endNodeCode];
                } else {
                    // 否则将所选择的候选人加入处理人
                    handlerInfoList = selectedNodesHandlers[endNodeCode];
                }
                const completeTaskPath = {
                    id,
                    pathCode,
                    pathName,
                    beginNodeCode,
                    endNodeCode,
                    pathType,
                    approveType,
                    handlerInfoList
                };
                completeTaskPathList.push(completeTaskPath);
            });
        }

        if (selectFlag === '1' && selectedPathIds.length > 0) {
            const selectedOriginalPath = nextPathList.find(path => path.selectId === selectedPathIds[0]);
            if (selectedOriginalPath.group) {
                // 当路径选择配置为单选、且选中的路径为合并路径时，将合并路径的名称传入
                data.selectedPathName = selectedPathNames[0];
            }
        }

        // 如选择合并路径时，记录该合并路径的id
        if (groupSelectId) data.groupSelectId = groupSelectId;

        return data;
    },

    /**
     * 完成任务，提交至下一环节
     */
    async completeTask({ payload }, { getState, setState, dispatch }) {
        const data = await dispatch('getCompleteTaskParams');
        const { curNode, flowCode } = getState();
        const result = await flowServices.completeTask(data);
        if (result.success) {
            message.success('提交成功');
            // 接机构同事需求，6-16新增提交成功后事件，可以在此加入自己的方法（例如弹出是否跳转到其它功能）
            const flag = await dispatch({
                type: 'completeTaskAfter',
                payload: data,
            });
            // 隐藏所有弹窗
            setState({
                opinionModalVisible: false,
                pathSelectModalVisible: false,
                handlerSelectModalVisible: false,
                submitConfirmModalVisible: false,

            });
            if (flag === false) {
                return result;
            }

            if ((flowCode == 'IBCM001' && curNode.nodeCode === 'hgrysh') || (flowCode == 'IBCM004' && curNode.nodeCode === 'fxqkhdy')) {
                try {

                    // 使用带命名空间的全局函数获取审核记录数据
                    const getReviewRecordDataFn = window[`getReviewRecordData_${flowCode}`] || window.getReviewRecordData;
                    const reviewRecordData = getReviewRecordDataFn ? getReviewRecordDataFn() : null;

                    if (!reviewRecordData) {
                        console.warn("无法获取审核记录数据，请确保审核意见组件已加载");
                        return result;
                    }

                    const { tableData, remark, clientId } = reviewRecordData;

                    if (!clientId) {
                        console.warn("无法获取CLIENT_ID，跳过审核数据保存");
                        return result;
                    }

                    // 是否存在审核明细行（空行需用户手动点击"移除"删除，以此表示无需填写审核问题）
                    const hasDetailRows = Array.isArray(tableData) && tableData.length > 0;

                    if (hasDetailRows) {
                        // 有明细行时逐行严格校验：错误类型和问题描述必填，任一行不完整则整批数据（含备注）都不保存
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
                            console.warn("审核数据验证失败，跳过保存:", errors);
                            message.error(errors.join('\n'));
                            return result;
                        }
                    } else if (!(remark || '').trim()) {
                        // 无明细行（用户已手动删除空行）且备注也为空：未录入任何审核内容，跳过保存
                        return result;
                    }

                    const auditId = Date.now().toString();
                    const userInfo = store.getModelState('user');

                    // 1. 先保存审核列表 - 根据接口文档saveApprList接口
                    // 手动删除全部明细行后仅填写备注时，也要创建批次，否则批次/备注会丢失
                    const apprListParams = {
                        clientId: clientId,
                        auditId: auditId,
                        remark: remark || '',
                        createUser: userInfo.userId
                    };

                    const apprListResult = await request({
                        url: '/thfxq/saveApprList',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: apprListParams
                    });

                    if (apprListResult && apprListResult.success) {

                        if (!hasDetailRows) {
                            // 用户手动删除了全部明细行，仅保存了批次和备注
                            message.success('审核备注保存成功');
                        } else {
                            // 2. 批量保存审核详情 - 根据接口文档，参数应为小驼峰格式
                            const batchList = tableData.map((item, index) => {
                                let auditDescValue = item.errorType || '';

                                if (window.errorTypeOptions && Array.isArray(window.errorTypeOptions)) {
                                    const errorTypeOption = window.errorTypeOptions.find(opt => opt.errType === item.errorType);
                                    if (errorTypeOption) {
                                        auditDescValue = errorTypeOption.errDesc || item.errorType;
                                    }
                                }

                                return {
                                    clientId: clientId,
                                    auditId: auditId,
                                    auditSeq: (index + 1).toString(),
                                    auditDesc: auditDescValue,
                                    disposeDesc: item.problemDesc || ''
                                };
                            });

                            const apprDetailsParams = {
                                batchList: batchList,
                                createUser: userInfo.userId
                            };

                            const apprDetailsResult = await request({
                                url: '/thfxq/saveApprDetails',
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                data: apprDetailsParams
                            });

                            if (apprDetailsResult && apprDetailsResult.success) {
                                message.success('审核数据保存成功');
                            } else {
                                console.warn("saveApprDetails接口调用失败:", apprDetailsResult);
                                message.warn('审核详情保存失败，但流程已提交成功');
                            }
                        }
                    } else {
                        console.warn("saveApprList接口调用失败:", apprListResult);
                        message.warn('审核列表保存失败，但流程已提交成功');
                    }
                } catch (error) {
                    console.error("调用审核保存接口时出错:", error);
                    message.warn('审核数据保存失败: ' + (error.message || '未知错误'));
                }
            }
            // 11-23唐老师反馈说需要改为可以根据之前选择的自动关闭来进行操作
            let autoClose = utils.getCookie("autoclose");
            if (!autoClose || autoClose == "close") {
                if (window.opener === null) {
                    window.location = window.location; // 如果没有父页面，chrome会屏蔽关闭，所以使用重定向
                } else {
                    window.close();
                }
            }
            else window.location = window.location;
        } else {
            message.warn(`提交失败：${result.ErrMsg}`);
        }
        return result;
    },
    /**
     * 查询流程跟踪的列表数据
     */
    async fetchFlowTrackList({ payload }, { getState, setState, dispatch }) {

        const { piid } = getState();
        const result = await flowServices.getFlowTrackList(piid);
        if (result.success) {
            const flowTrackList = (result.Data || []).sort((a, b) => (a.taskOrder || 0) - (b.taskOrder || 0));  // 按照taskOrder正序排列
            setState({
                flowTrackList
            });
        }
    },
    // 附件相关接口
    /**
     * 获取附件域权限配置
     */
    async fetchAttachmentPer({ payload }, { getState, setState, dispatch }) {
        const { flowCode } = payload === undefined ? getState() : payload;
        const { flowVer } = payload === undefined ? getState() : payload;
        const nodeCode = getState('curNode.nodeCode') || 'draft';
        const result = await flowServices.getAttachmentPer({ flowCode, flowVer, nodeCode });
        if (result.success) {
            const attachmentPer = result.Data;
            if (attachmentPer) {
                setState({
                    attachmentPer,
                });
            } else {
                message.warn(result.ErrMsg);
            }
        } else {
            // message.error('附件域配置获取失败!')
            console.warn(`附件域配置获取失败:${result.ErrMsg}`);
        }
    },
    /**
     * 获取附件列表信息
     */
    async fetchAttachmentList({ payload }, { getState, setState, dispatch }) {
        const { piid, tiid } = getState();
        const { flowCode } = payload === undefined ? getState() : payload;
        const { flowVer } = payload === undefined ? getState() : payload;
        if (!piid) {
            return;
        }
        const listResult = await flowServices.getAttachmentList({ piid, tiid });
        const typeResult = await flowServices.getAttachmentTypeOrdList({ flowCode, flowVer });
        const result = [];
        if (listResult.success) {
            if (typeResult && typeResult.success && typeResult.Data.length >= 1) {
                for (let j = 0; j < typeResult.Data.length; j++) {
                    for (let i = 0; i < listResult.Data.length; i++) {
                        if (_.lowerCase(listResult.Data[i].fileTypeCode) === _.lowerCase(typeResult.Data[j].FILE_TYPE_CODE)) {
                            result.push(listResult.Data[i])
                        }
                    }
                }
            }
            let attachmentList = result.length >= 1 ? result : listResult.Data;
            // 在上传区域的文件不要放在已上传区域里
            const uploadFileList = getState('uploadFileList');
            if (uploadFileList && uploadFileList.length > 0) {
                attachmentList = attachmentList.filter(a => uploadFileList.findIndex(u => u.id === a.id) < 0);
            }
            await setState({
                attachmentList,
                fileTotal: attachmentList.length,
                attachmentSortList: typeResult.Data
            });
        }



    },

    /**
     * 获取附件类型列表信息
     */
    async fetchAttachmentTypeList({ payload }, { getState, setState, dispatch }) {
        const { flowCode } = payload === undefined ? getState() : payload;
        const { flowVer } = payload === undefined ? getState() : payload;
        const nodeCode = getState('curNode.nodeCode') || 'draft';
        const result = await flowServices.getAttachmentTypeList({ flowCode, flowVer, nodeCode });
        if (result.success) {
            const attachmentTypeList = result.Data;
            await setState({
                attachmentTypeList,
            });
        }
        return true
    },

    /**
     * 点击打印
     */
    clickPrint({ payload }, { getState }) {
        // 或者加入link
        const { systemId, flowCode } = getState();
        const url = `${location.origin}${window.URL_CONTEXT_PATH}print/${systemId}/${flowCode}${location.search}`;
        let newWindow = window.open(url);
        newWindow.focus();
    },

    /**
     * 点击文件作废
     */
    clickDelete({ payload }, { getState, setState, dispatch }) {
        dispatch('toggleFileDeleteModal');
    },

    /***
     * 点击附件上传
     */
    clickAttachmentUpload({ payload }, { getState, setState, dispatch }) {
        const uploadFileList = payload === undefined ? !getState('uploadFileList') : !!payload;
        return setState({
            uploadFileList,
        });
    },

    /***
     * 保存附件基本信息到
     */
    saveAttachmentFileList({ payload }, { getState, setState, dispatch }) {
        const uploadFileList = payload === undefined ? getState('uploadFileList') : payload;
        return setState({
            uploadFileList: uploadFileList,
        });
    },
    /***
     * 添加一条附件基本信息
     */
    pushAttachmentFileItem({ payload }, { getState, setState, dispatch }) {
        const uploadFileList = getState('uploadFileList')
        const { fileItem } = payload
        return setState({
            uploadFileList: [...uploadFileList, fileItem]
        });
    },

    /***
     * 批量保存附件信息
     */
    async fetchSaveAttachmentList({ payload }, { getState, setState, dispatch }) {
        const { piid, tiid } = getState();
        const { fileList } = payload
        const result = await flowServices.saveAttachmentList({ piid, tiid, fileList });
        const { Data } = result;
        if (Data && Data.insertRows > 0) {
            message.success(`成功保存${Data.insertRows}条信息`);
            // 获取附件列表信息
            await dispatch({
                type: `fetchAttachmentList`,
            });
            // 清空我的上传附件列表
            // uploadFileList
            await dispatch({
                type: `saveAttachmentFileList`,
                payload: []
            });
        } else {
            message.warn(`${result.ErrMsg}`);
        }
    },

    /***
     * 更新流程的总部/分支路径
     */
    async updateDraftDepart({ payload }, { getState, setState, dispatch }) {
        const { piid, tiid } = getState();
        const { draftDeptCode, draftDeptName } = payload;
        if (piid) { // 如果已经起草，就去更新
            const result = await flowServices.updateDraftDepart({ piid, tiid, draftDeptCode, draftDeptName });
        } else { // 没有起草，就先更新
            setState({ draftDeptCode, draftDeptName })
        }
    },

    /**
     * 发出全连接格式的请求
     * payload为字符串，格式为 funcId,stateKey1,stateKey2...
     * funcId为方法号
     * stateKey是需要加入传参的flowState的key值
     */
    async sendLinkRequest({ payload }, { getState }) {
        if (!payload || typeof payload !== 'string') return null;
        const [funcId, ...paramKeys] = payload.split(',');
        const params = {};
        if (Array.isArray(paramKeys)) {
            const state = getState();
            paramKeys.forEach(key => {
                let parsedKey = key;
                let value;
                const index = key.indexOf('=');
                if (index > 0) {
                    parsedKey = key.slice(0, index);
                    value = key.slice(index + 1);
                } else {
                    value = _.get(state, key);
                }
                _.set(params, parsedKey, value);
            });
        }

        const result = await linkRequest(funcId, params);
        if (result.success) {
            message.success('执行成功');
        } else {
            message.warn(`执行失败：${result.ErrMsg}`);
        }
        return result;
    },

    /**
     * 查询智能提交参数
     */
    async fetchSmartCommitParams({ payload }, { getState, setState, dispatch }) {
        const { piid, tiid } = getState();
        if (!piid || !tiid) return;
        const result = await flowServices.getSmartCommitParams({ piid, tiid });
        if (result.success) {
            const smartCommitParams = result.Data;
            setState({ smartCommitParams });
        } else {
            console.warn(`获取智能提交参数失败：${result.ErrMsg}`);
        }
    },

    /**
     * 隐藏智能提交弹窗
     */
    async hideSmartCommitModel({ payload }, { getState, setState, dispatch }) {
        const { showPathSelect } = payload || {};
        if (showPathSelect) {
            await dispatch({
                type: 'togglePathSelectModal',
                payload: true,
            });
        }
        setState({ smartCommitModalVisible: false });
    },

    /**
     * 记录用户在智能提交弹窗中的操作，以优化推荐算法
     */
    async recordSmartCommit({ payload }, { getState, setState, dispatch }) {
        const chooseType = payload;
        const {
            piid,
            tiid,
            smartCommitParams,
        } = getState();
        const params = {
            piid, tiid,
            pathCandidateId: smartCommitParams.pathCandidateId,
            chooseType,
        };
        await flowServices.recordSmartCommit(params);
    },
};

export default baseActions;
