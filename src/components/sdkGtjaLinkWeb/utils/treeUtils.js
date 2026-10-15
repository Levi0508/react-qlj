/**
 * 树数据处理工具
 * @author mashaowei
 */
const treeUtils = {
    
    getNodeParam: (node, keyName) => {
        if (typeof keyName === 'function') {
            return keyName(node);
        }
        return node[keyName];
    },

    /**
     * 从指定树中递归查找符合目标条件的节点
     * @param {*} tree 需要查找的树
     * @param {*} matcher 匹配方法，传入节点对象，返回bool值，表示当前传入的节点对象是否为目标对象
     * @param {*} subListKey 下级列表的字段名称，默认为children，也可传入一个回调方法
     */
    find: (tree, matcher, subListKey = 'children') => {
        if (!Array.isArray(tree)) return null;
        for (let i = 0; i < tree.length; i += 1) {
            const node = tree[i];
            if (matcher(node)) {
                return node;
            }
            const target = treeUtils.find(treeUtils.getNodeParam(node, subListKey), matcher, subListKey);
            if (target) return target;
        }
        return null;
    },

    /**
     * 从指定树中递归查找符合目标条件的节点的位置信息position
     * position为目标节点的每一层索引的数组
     * @param {*} tree 需要查找的树
     * @param {*} matcher 匹配方法，传入节点对象，返回bool值，表示当前传入的节点对象是否为目标对象
     * @param {*} subListKey 下级列表的字段名称，默认为subList，也可传入一个回调方法
     */
    findPos: (tree, matcher, subListKey = 'subList', position = []) => {
        if (!Array.isArray(tree)) return null;
        for (let i = 0; i < tree.length; i += 1) {
            const node = tree[i];
            position.push(i);
            if (matcher(node)) {
                return position;
            }
            const childPosition = treeUtils.findPos(treeUtils.getNodeParam(node, subListKey), matcher, subListKey, position);
            if (childPosition) return childPosition;
            position.pop();
        }
        return null;
    },

    /**
     * 从指定树中递归查找符合目标条件的节点的id栈
     * @param {*} tree 需要查找的树
     * @param {*} matcher 匹配方法，传入节点对象，返回bool值，表示当前传入的节点对象是否为目标对象
     * @param {*} subListKey 下级列表的字段名称，默认为subList，也可传入一个回调方法
     */
    findIdStack: (tree, matcher, subListKey = 'subList', idKey = 'id', idStack = []) => {
        if (!Array.isArray(tree)) return null;
        for (let i = 0; i < tree.length; i += 1) {
            const node = tree[i];
            idStack.push(treeUtils.getNodeParam(node, idKey));
            if (matcher(node)) {
                return idStack;
            }
            const childIdStack = treeUtils.findIdStack(treeUtils.getNodeParam(node, subListKey), matcher, subListKey, idKey, idStack);
            if (childIdStack) return childIdStack;
            idStack.pop();
        }
        return null;
    },

    /**
     * 遍历树的每一个节点
     */
    forEach: (tree, subListKey = 'children', callback, parent) => {
        if (!Array.isArray(tree)) return;
        for (let i = 0; i < tree.length; i += 1) {
            const node = tree[i];
            callback(node, parent);
            treeUtils.forEach(treeUtils.getNodeParam(node, subListKey), subListKey, callback, node);
        }
    },

}

export default treeUtils;
