import _ from 'lodash';
import { message } from 'antd';
import * as flowServices from '../../services/flow/flow';

const actions = {

    /**
     * 点击下发
     */
    async clickDistribute({ payload }, { getState, setState, dispatch }) {
        const checkMsg = await dispatch('checkBeforeSubmit');
        if (typeof checkMsg === 'string') {
            if (checkMsg) message.warn(checkMsg);
            return;
        }

        return dispatch({
            type: 'toggleDistributeModal',
            payload: true,
        });
    },

    /**
     * 切换下发弹窗状态
     * payload传入bool值时，显隐状态以payload为准
     * 否则切换到当前状态的反状态
     */
    toggleDistributeModal({ payload }, { getState, setState, dispatch }) {
        const distributeModalVisible = payload === undefined ? !getState('distributeModalVisible') : !!payload;
        if (distributeModalVisible) {
            dispatch('fetchDistributeDeptTree');
        }
        return setState({
            distributeModalVisible,
        });
    },

    /**
     * 查询部门树
     */
    async fetchDistributeDeptTree({ payload }, { getState, setState, dispatch }) {
        const distributeDeptTree = getState('distributeDeptTree');
        if (Array.isArray(distributeDeptTree) && distributeDeptTree.length > 0) return;
        const result = await flowServices.getDeptTree();
        if (result.success) {
            const deptList = result.Data;
            const deptTree = [];
            const childrenMap = {}; // deptCode: children
            deptList.forEach(dept => {
                const { deptCode, parentId } = dept;
                if (parentId === '-1') {
                    deptTree.push(dept);
                }
                if (!childrenMap[parentId]) childrenMap[parentId] = [];
                childrenMap[parentId].push(dept);

                if (!childrenMap[deptCode]) childrenMap[deptCode] = [];
                dept.children = childrenMap[deptCode];
            });
            deptList.forEach(dept => {
                if (_.get(dept, 'children.length') === 0) {
                    delete dept.children;
                }
            });
            setState({
                distributeDeptTree: deptTree,
                distributeDeptList: deptList,
            });
        } else {
            message.warn(`查询部门失败：${result.ErrMsg}`);
        }
    },

    async submitDistribute({ payload }, { getState, setState, dispatch }) {
        const { tiid, todoTitle, distributeSelectedIds, distributeUserType } = getState();

        const data = {
            tiid,
            todoTitle,
            deptCodes: distributeSelectedIds.join(','),
            userType: distributeUserType,
        };
        const result = await flowServices.submitDistribute(data);
        if (result.success) {
            message.success('下发成功');
            // 隐藏所有弹窗
            setState({
                distributeModalVisible: false,
            });
            // 刷新页面
            window.location = window.location;
        } else {
            message.warn(`下发失败：${result.ErrMsg}`);
        }
    },
};

export default actions;
