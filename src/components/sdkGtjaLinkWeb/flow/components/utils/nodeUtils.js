const draftNodeId = 'draft';
const endNodeId = '_EOF';

const isNodeOf = (node, nodeId) => {
    if(node === nodeId){
        return true;
    }
    try{
        if(node.nodeId === nodeId){
            return true;
        }
    } catch(e) {/** */}
    try{
        if(node.taskFlowObject.nodeId !== nodeId) {
            return true;
        }
    } catch(e) {/** */}
    return false;
};

const nodeUtils = {

    draftNodeId,
    endNodeId,

    isNodeOf,

    isDraftNode: (node) => {
        return isNodeOf(node, draftNodeId);
    },

    isEndNode: (node) => {
        return isNodeOf(node, endNodeId);
    },
};

export default nodeUtils;
