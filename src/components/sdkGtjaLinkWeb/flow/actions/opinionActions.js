import { message } from 'antd';
import * as flowServices from '../../services/flow/flow';

const opinionActions = {

    /**
     * 查询意见填写配置
     */
    async fetchOpinionConfig({ payload }, { getState, setState, dispatch }) {
        const {
            flowCode,
            flowVer,
            curNode,
        } = getState();
        if (!curNode) return; // TODO: 等凌宏健更新接口，应当不需要传当前节点信息
        const result = await flowServices.getOpinionConfig({ flowCode, flowVer, nodeCode: curNode.nodeCode });
        if (result.success) {
            let opinionConfig = getState('opinionConfig');
            opinionConfig = {
                ...opinionConfig,
                ...result.Data
            };
            if(typeof opinionConfig.showDecisionOpinion !== 'number') {
                // 2021-03-30 添加showDecisionOpinion参数来单独控制是否显示结论性意见
                // 如果没有配置的话则跟随原useDecisionOpinion的值
                opinionConfig.showDecisionOpinion = opinionConfig.useDecisionOpinion;
            }
            setState({ opinionConfig });
        }
        return result;
    },

    /**
     * 查询决策性意见列表
     */
    async fetchDecisionOpinionList({ payload }, { getState, setState, dispatch }) {
        const {
            flowCode,
            flowVer,
            curNode,
        } = getState();
        if (!curNode) return;
        const result = await flowServices.getDecisionConfigList({ flowCode, flowVer, nodeCode: curNode.nodeCode });
        if (result.success) {
            const decisionOpinionList = result.Data;
            setState({ decisionOpinionList });
        }
        return result;
    },

    /**
     * 查询用户的常用意见列表(含该文种)
     */
    async fetchUserOpinionList({ payload }, { getState, setState, dispatch }) {
        const {
            flowCode,
            flowVer,
            curNode,
        } = getState();
        if (!curNode) return;
        const result = await flowServices.getUserOpinionList({ flowCode, flowVer, nodeCode: curNode.nodeCode });
        if (result.success) {
            const userOpinionList = result.Data;
            setState({ userOpinionList });
        }
        return result;
    },

    /**
     * 查询用户的常用意见列表（仅包括自己）
     */
    async fetchUserSelfOpinionList({ payload }, { getState, setState, dispatch }) {
        const {
            flowCode,
            flowVer,
            curNode,
        } = getState();
        if (!curNode) return;
        const result = await flowServices.getUserSelfOpinionList({ flowCode, flowVer, nodeCode: curNode.nodeCode });
        if (result.success) {
            const userSelfOpinionList = result.Data;
            setState({ userSelfOpinionList });
        }
        return result;
    },

    /**
     * 添加用户常用意见（常用意见管理）
     */
    async editUserSelfOpinion({ payload }, { getState, setState, dispatch }) {
        const {
            flowCodes,
            flowVers,
            opinions,
        } = payload;

        const result = await flowServices.editUserSelfOpinion({ flowCodes, flowVers, opinions });
        return dispatch({
            type: 'fetchUserOpinionList',
        });
    },

    /**
     * 删除用户常用意见（常用意见管理）
     */
    async deleteUserSelfOpinion({ payload }, { getState, setState, dispatch }) {
        const {
            ids
        } = payload;

        const result = await flowServices.deleteUserSelfOpinion({ ids });
        if (result.success) {
            message.success("删除成功");
            return dispatch({
                type: 'fetchUserOpinionList',
            });
        }
        return result;
    },

    /**
     * 查询意见列表
     */
    async fetchOpinionList({ payload }, { getState, setState, dispatch }) {
        const {
            piid,
            tiid,
        } = getState();
        const result = await flowServices.getOpinionList({ piid, tiid });
        if (result.success) {
            const originOpinionList = result.Data || [];
            const opinionModalData = originOpinionList.find(item => item.tiid === tiid);    // 找到当前任务
            // 将意见列表构建为意见域组件能接受的数据格式
            const opinionList = originOpinionList.reduce((r, opinionItem) => {
                const {
                    opnDefId, opnDefName,
                    orgCode, orgName,
                    userId, userName,
                    opnContent,
                    opnSource,
                    decisionOpinionCode,
                    decisionOpinionName,    // TODO:
                    updateTime,
                    createTime,
                } = opinionItem;
                // 第一层，按照opnDefId分组
                let opinion = r.find(opinionItem => opinionItem.id === opnDefId);
                if (!opinion) {
                    opinion = { id: opnDefId, name: opnDefName, children: [] };
                    r.push(opinion);
                }
                // 第二层，按照orgCode分组
                if (orgCode) {
                    const orgs = opinion.children;
                    let org = orgs.find(orgItem => orgItem.id === orgCode);
                    if (!org) {
                        org = { id: orgCode, name: orgName || orgCode, children: [] }; // TODO 目前没有orgName，使用orgCode代替
                        orgs.push(org);
                    }
                    // 第三层，按照userId分组
                    if (userId) {
                        const users = org.children;
                        const user = {
                            id: userId, name: userName,
                            /**其他意见类属性 */
                            decision: decisionOpinionName,  // 决策性意见
                            decisionCode: decisionOpinionCode,
                            content: opnContent,    // 意见详情
                            time: updateTime || createTime,       // 填写意见时间
                            opnSource,
                            isCurrent: tiid === opinionItem.tiid,
                        };
                        users.push(user);
                    }
                }
                return r;
            }, []);
            // 保存
            setState({
                showOpinionList: true,
                opinionList,
                originOpinionList,
                opinionModalData,
            });
        } else {
            // message.warn(`查询意见列表失败：${result.ErrMsg}`);
            // 有可能有人忘了配置意见域，此时会查询失败，先不提示
            console.warn(`查询意见列表失败：${result.ErrMsg}`);
        }
        return result;
    },

    /**
     * 查询流程列表
     */
    async fetchFlowCodeList({ payload }, { getState, setState, dispatch }) {

        const result = await flowServices.fetchFlowCodeList({ });
        if (result.success) {
            const flowCodeList = result.Data;
            setState({ flowCodeList });
        }
        return result;
    },

    /**
     * 切换意见弹窗的显隐状态
     * payload传入bool值时，显隐状态以payload为准
     * 否则切换到当前状态的反状态
     */
    toggleOpinionModal({ payload }, { getState, setState, dispatch }) {
        const opinionModalVisible = payload === undefined ? !getState('opinionModalVisible') : !!payload;
        return setState({
            opinionModalVisible,
        });
    },

    /**
     * 校验意见
     * 通过返回true,不通过返回错误信息字符串
     */
    checkOpinion({ payload }, { getState, setState, dispatch, setStateSilence }) {
        const originOpinionList = getState('originOpinionList');
        const { allowWrite, showDecisionOpinion, useDecisionOpinion } = getState('opinionConfig') || {};
        const { opnContent, decisionOpinionCode } = getState('opinionModalData') || {};

        // 判断当前用户是否在本环节填写过意见，已填过意见则不校验
        if (originOpinionList.some(opinion => opinion.belongCurrentUser)) {
            return true;
        }

        if (showDecisionOpinion - 1 === 0 && useDecisionOpinion - 1 === 0 && !decisionOpinionCode) {
            // 结论性意见必填校验
            // 并弹出弹窗
            dispatch({
                type: 'toggleOpinionModal',
                payload: true,
            });
            setStateSilence({ submitAfterOpinion: true });   // 设置保存意见后继续提交
            return '请选择结论性意见';
        }

        if (allowWrite - 3 === 0 && opnContent) {
            // 配置为不可填时，如果填写了意见则返回不通过
            return '当前环节的意见详情配置为不可填';
        }
        if (allowWrite - 2 === 0 && (!opnContent || opnContent.length === 0)) {
            // 意见详情必填校验
            // 并弹出弹窗
            dispatch({
                type: 'toggleOpinionModal',
                payload: true,
            });
            setStateSilence({ submitAfterOpinion: true });   // 设置保存意见后继续提交
            return '请填写意见详情';
        }

        return true;
    },

    fetchCommonOpinionList() {

    },
};

export default opinionActions;
