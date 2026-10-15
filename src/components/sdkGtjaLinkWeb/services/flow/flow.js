/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
/**
* 流程引擎相关service
* @author mashaowei
*/
import qs from 'querystring';

import request from '../../utils/request';
import linkRequest from '../../utils/linkRequest';

const prefix = '/api/link/flowsampledev/flowCommon/flowApi';
const comparePrefix = '/api/eoafilegw/fileCompare';

/**
 * 查询流程模板信息
 * 姜杉杉
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020235
 */
export async function getFlowTemplateInfo({ flowCode, flowVer = '0', nodeCode, taskType }) {
    return linkRequest('FLOW_MODEL_Q0001', {
        flowCode,
        flowVer,
        source: !!nodeCode ? '1' : '0',
        nodeCode,
        taskType,
    });
}

/**
 * 获取操作按钮配置
 * 姜杉杉
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020235
 */
export async function getFlowOperators({ flowCode, flowVer, source, nodeCode, taskType, piid, tiid }) {
    return linkRequest('FLOW_OPERATOR_Q0001', { flowCode, flowVer, source, nodeCode, taskType, piid, tiid })
}

/**
 * 流程起草
 * 李剑
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020259
 */
export async function draft(flowCode, todoTitle, applyTable, udf1, udf2, draftDeptCode, draftDeptName) {
    return linkRequest('FLOW_MAIN_I0001', { flowCode, todoTitle, applyTable, udf1, udf2, draftDeptCode, draftDeptName });
}

/**
 * 获取流程全量信息
 * 李剑
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020259
 */
export async function getAllByPiid({ piid, flowCode }) {
    return linkRequest('FLOW_MAIN_Q0001', { piid, flowCode });
}

/**
 * 查询提交路径列表
 * 李剑
 * { flowCode, flowVer, nodeCode, piid, tiid, groupFlag }
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020259
 */
export async function getNodeList(params) {
    return linkRequest('FLOW_MAIN_Q0002', params);
}

/**
 * 获取环节审批人员接口
 * 李晓亮
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020130
 * piid, tiid, nodeCode, pathCode
 */
export async function getNodeHandlerList(params) {
    return linkRequest('FLOW_OUM_Q0001', params);
}

/**
 * 查询智能提交的参数
 * 李晓亮
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020355
 * piid, tiid
 */
export async function getSmartCommitParams(params) {
    return linkRequest('FLOW_OUM_Q0003', params);
}

/**
 * 记录智能提交使用情况
 * 李晓亮
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020355
 * piid, tiid, pathCandidateId, chooseType
 */
export async function recordSmartCommit(params) {
    return linkRequest('FLOW_OUM_U0001', params);
}

/**
 * 提交智能提交意见反馈
 * 李晓亮
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020355
 * piid, tiid, title, content, pathCandidateId
 */
export async function reportSmartCommitFeedback(params) {
    return linkRequest('FLOW_OUM_I0001', params);
}

/**
 * 获取环节意见域配置
 * 凌宏健
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020130
 */
export async function getOpinionConfig({ flowCode, flowVer, nodeCode }) {
    return linkRequest('FLOW_OPINION_Q0002', { flowCode, flowVer, nodeCode });
}

/**
 * 填写意见：获取结论性意见列表
 * 李晓亮
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020130
 */
export async function getDecisionConfigList({ flowCode, flowVer, nodeCode }) {
    return linkRequest('FLOW_OPINION_Q0003', { flowCode, flowVer, nodeCode });
}

/**
 * 填写意见：获取当前环节可用的常用意见列表，用于填写意见
 * 李晓亮
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020130
 */
export async function getUserOpinionList({ flowCode, flowVer, nodeCode }) {
    return linkRequest('FLOW_OPINION_Q0004', { flowCode, flowVer, nodeCode });
}

/**
 * 查询用户所有常用意见（常用意见管理）
 * 李晓亮
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020130
 */
export async function getUserSelfOpinionList({ }) {
    return linkRequest('FLOW_OPINION_Q0005', {});
}

/**
 * 查询流程列表（常用意见管理）
 * 李晓亮
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020130
 */
export async function fetchFlowCodeList({ }) {
    return linkRequest('FLOW_OPINION_Q0007', {});
}

/**
 * 添加用户常用意见（常用意见管理）
 * 李晓亮
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020130
 */
export async function editUserSelfOpinion({ flowCodes, flowVers, opinions }) {
    return linkRequest('FLOW_OPINION_I0003', { flowCodes, flowVers, opinions });
}

/**
 * 添加用户常用意见（常用意见管理）
 * 李晓亮
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020130
 */
export async function deleteUserSelfOpinion({ ids }) {
    return linkRequest('FLOW_OPINION_D0001', { ids });
}

/**
 * 查询审批意见列表
 * 凌宏健
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020130
 */
export async function getOpinionList({ piid, tiid }) {
    return linkRequest('FLOW_OPINION_Q0001', { piid, tiid });
}

/**
 * 填写意见：提交审批意见
 * 凌宏健
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020130
 */
export async function submitOpinion(data) {
    return linkRequest('FLOW_OPINION_I0002', data);
}

/**
 * 完成任务
 * 李剑
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020259
 */
// export async function completeTask(data) {
//     return linkRequest('FLOW_MAIN_I0002', data);
// }

/**
 * 完成任务
 * 李剑
 * http://conf.gtja.net/pages/viewpage.action?pageId=60020259
 */
export function completeTask(data) {
    return linkRequest('FLOW_MAIN_I0003', data);
}

/**
 * 查询错误报告接口
 * 凌宏健
 * http://conf.gtja.net/pages/viewpage.action?pageId=66180497
 */
export async function getErrorReportReview({ piid, tiid }) {
    return linkRequest('FLOW_ERROR_REPORT_Q0001', { piid, tiid });
}

/**
 * 提交错误报告接口
 * 凌宏健
 * http://conf.gtja.net/pages/viewpage.action?pageId=66180497
 */
export async function submitErrorReport({ piid, tiid, mailSubject, mailDesc, fileList }) {
    return linkRequest('FLOW_ERROR_REPORT_I0002', { piid, tiid, mailSubject, mailDesc, fileList });
}

/**
 * 提交错误报告(该接口不用了？)
 * http://conf.gtja.net/pages/viewpage.action?pageId=54003431
 */
export async function reportError(data) {
    return
    /**return request.put(`${prefix}/instance/errorReport`, {
        data,
    });*/
}


/**
 * 提交表单
 *
 */
export async function submitFlowForm(urltype, data) {
    return linkRequest(urltype, data);
}

/**
 * 流程跟踪：获取流程跟踪列表
 */

export async function getFlowTrackList(piid) {
    return linkRequest('FLOW_TRACE_Q0001', { piid });
}

/**
 * 流程跟踪：设置待办/待阅任务已读
 */
export async function setTaskRead({ piid, tiid, userId }) {
    return linkRequest('FLOW_TRACE_I0003', { piid, tiid, userId });
}

// 附件相关接口

/**
 * 获取附件域权限配置
 */
export async function getAttachmentPer({ flowCode, flowVer, nodeCode }) {
    return linkRequest('FLOW_FILE_Q0001', { flowCode, flowVer, nodeCode });
}

/**
 * 获取附件列表
 */
export async function getAttachmentList({ piid, tiid }) {
    return linkRequest('FLOW_FILE_Q0002', { piid, tiid });
}
/**
 * 顺序展示附件类型
 */
export async function getAttachmentTypeOrdList({ flowCode, flowVer }) {
    return linkRequest('FLOW_FILE_Q0004', { flowCode, flowVer });
}


/**
 * 批量保存附件信息
 */
export async function saveAttachmentList({ piid, tiid, fileList }) {
    return linkRequest('FLOW_FILE_I0004', { piid, tiid, fileList });
}

/**
 * 获取附件类型列表
 */
export async function getAttachmentTypeList({ flowCode, flowVer, nodeCode }) {
    return linkRequest('FLOW_FILE_Q0003', { flowCode, flowVer, nodeCode });
}

/**
 * 删除附件
 */
export async function deleteAttachmentFile({ piid, tiid, id }) {
    return linkRequest('FLOW_FILE_D0003', { piid, tiid, id });
}

/**
 * 附件信息修改
 */
export async function updateAttachment({ piid, tiid, file }) {
    return linkRequest('FLOW_FILE_U0001', { piid, tiid, file });
}

/**
 * 附件信息单个保存
 */
export async function saveAttachment({ piid, tiid, file }) {
    return linkRequest('FLOW_FILE_I0001', { piid, tiid, file });
}

/**
 * 待阅转已阅
 */
export async function setReadTaskDone(tiid) {
    return linkRequest('FLOW_MAIN_I0005', { tiid });
}

/**
 * 获取正文列表
 */
export async function queryVersionHisList({ piid, tiid }) {
    return linkRequest('FLOW_MAINFORMBODY_Q0001', { piid, tiid });
}

/**
 * 获取正文内容
 */
export async function getVersionHis({ piid, tiid, id }) {
    return linkRequest('FLOW_MAINFORMBODY_Q0002', { piid, tiid, id });
}

/**
 * 提交文件作废
 * piid, tiid, retrieveSerialNumFlag, deleteMsgFlag, deleteApplyTableFlag
 */
export async function submitFileDelete(data) {
    return linkRequest('FLOW_MAIN_I0004', data);
}

/**
 * 查询指定系统下所有部门
 * http://conf.gtja.net/pages/viewpage.action?pageId=66169618#id-1.12%E5%AD%97%E5%85%B8%E7%B1%BB%E6%8E%A5%E5%8F%A3%EF%BC%8C%E7%BC%96%E5%8F%B7%EF%BC%9AFLOW_DICT_xxx-1.12.2%E6%9F%A5%E8%AF%A2%E6%8C%87%E5%AE%9A%E7%B3%BB%E7%BB%9F%E4%B8%8B%E6%89%80%E6%9C%89%E9%83%A8%E9%97%A8
 */
export async function getDeptTree() {
    return linkRequest('FLOW_DICT_Q0002');
}

/**
 * 提交下发
 * tiid, todoTitle, deptCodes, userType
 */
export async function submitDistribute(data) {
    return linkRequest('FLOW_MAIN_I0007', data);
}

/**
 * 更新流程的总部/分支路径
 * piid, tiid, drafeDeptCode, draftDeptName
 */
export async function updateDraftDepart(data) {
    return linkRequest('FLOW_MAIN_U0012', data);
}

/**
 * 提醒接口
 * 凌宏健
 * http://conf.gtja.net/pages/viewpage.action?pageId=72986781
 */
export async function submitNoticeReport({ piid, tiid, subject, content, msgType, toUserInfoList }) {
    return linkRequest('FLOW_NOTICE_I0003', { piid, tiid, subject, content, msgType, toUserInfoList });
}

/**
 * 文件对比接口
 * 张铭明
 * https://link.gtjadev.net/api/eoafilegw/fileCompare/compareFile?filterPunc=true&filterHeaderFooter=true&filterOtherChar=true
 */
export async function submitFileCompare(data) {
    return request.post(`${comparePrefix}/compareFile?filterPunc=true&filterHeaderFooter=true&filterOtherChar=true`, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }, data:  qs.stringify({
            data: JSON.stringify(data) 
        })
    });
}
