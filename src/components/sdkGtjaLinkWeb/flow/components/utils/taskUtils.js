import nodeUtils from './nodeUtils';

/**
 * 任务环节相关工具
 */
const taskUtils = {

    /**
     * 判断传入环节是不是起草环节
     */
    isDraftNode: (curTask) => {
        try {
            return nodeUtils.isDraftNode(curTask.nodeObject);
        } catch(e) {
            return false;
        }
    },

    /**
     * 判断传入环节是不是结束环节
     */
    isEnd: (curTask) => {
        try {
            return nodeUtils.isEndNode(curTask.nodeObject);
        } catch(e) {
            return false;
        }
    }
};

export default taskUtils;
