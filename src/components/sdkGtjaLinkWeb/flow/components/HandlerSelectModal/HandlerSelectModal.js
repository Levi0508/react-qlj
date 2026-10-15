import React from 'react';
import {
    Modal,
    Tabs,
    Row,
    Col,
    Typography,
    message,
    Badge,
    Spin,
    Switch,
    Checkbox,
    Button,
} from 'antd';
import _ from 'lodash';

import DraggableModal from '../../../components/DraggableModal';
import ItemNodeHandlerSelect from './ItemNodeHandlerSelect';
import TreeTransfer from '../TreeTransfer/TreeTransfer';
import TreeTransfer2 from '../TreeTransfer/TreeTransfer2';
import { withFlowContext } from '../../LinkFlowContext';
import treeUtils from '../../../utils/treeUtils';
import utils from '../../../utils/utils';
import '../../styles.less';

const cookieAutoClose = utils.getCookie("autoclose");
class PathHandlerSelectModal extends React.PureComponent {

    static getDerivedStateFromProps(nextProps, prevState) {
        const { selectedPaths } = nextProps;
        if (Array.isArray(selectedPaths) && selectedPaths.length > 0 && selectedPaths !== prevState.lastSelectedPaths) {
            const path = selectedPaths[0];
            return {
                lastSelectedPaths: selectedPaths,
                activeKey: `${path.id}`,
            };
        }
        return null;
    }

    state = {
        lastSelectedPaths: null,
        activeKey: null,

        useNewTransfer: localStorage.getItem('useNewTransfer'),

        autoClose: (!cookieAutoClose || cookieAutoClose == "close"),    // 提交完成后是否自动关闭
    }

    changeAutoClose = (e) => {
        utils.setCookie("autoclose", e.target.checked ? "close" : "notclose");
        this.setState({
            autoClose: e.target.checked,
        });
    }

    handleChangeTransfer = () => {
        const { useNewTransfer } = this.state;
        localStorage.setItem('useNewTransfer', !useNewTransfer);
        this.setState({ useNewTransfer: !useNewTransfer });
    }

    handleCancel = () => {
        const { dispatch } = this.props;
        dispatch({
            type: 'toggleHandlerSelectModal',
            payload: false,
        });
    }

    handleOk = () => {
        const {
            dispatch,
            selectedPaths,
            selectedNodesHandlers,
        } = this.props;
        // TODO: 按照模板配置检测选人情况
        for (let i = 0; i < selectedPaths.length; i += 1) {
            const path = selectedPaths[i];
            const handlers = selectedNodesHandlers[path.endNodeCode];
            const checked = Array.isArray(handlers) && handlers.length > 0; // 检测每个环节的选人数量大于0
            // TODO: 更多检测条件
            if (!checked) {
                this.setState({ activeKey: `${path.id}` });
                message.warn(`【${path.pathName}】请至少选择一个候选人`);
                return;
            }
        }

        dispatch({
            type: 'toggleSubmitConfirmModal',
            payload: true,
        });
    }

    renderSwitcher = () => {
        const { useNewTransfer } = this.state;
        return <Switch checked={useNewTransfer} onChange={this.handleChangeTransfer} />;
    }

    renderItemTab = (path) => {
        const {
            selectedNodesHandlers,
        } = this.props;
        const {
            id,
            pathName,
            endNodeCode,
        } = path;
        const count = (_.get(selectedNodesHandlers, endNodeCode) || []).length;
        return (
            <span>
                {pathName}
                <Badge
                    className={utils.getClassName('countBadge', this.props)}
                    count={count}
                    showZero
                />
            </span>
        )
    }

    renderItem = (path, renderTabPane = true) => {
        const { nodesHandlerTree } = this.props;
        const { useNewTransfer } = this.state;
        const {
            id,
            pathName,
            endNodeCode,
        } = path;

        // 判断初始展开至哪个节点
        // 2020-12-17 有总部时展开到总部，没有总部时全部展开
        const extraProps = {};
        const handlerTree = _.get(nodesHandlerTree, endNodeCode) || [];
        let expandedKeys;
        const zongbuIdtack = treeUtils.findIdStack(handlerTree, item => item.orgName === '总部', 'children', '_id');
        if (Array.isArray(zongbuIdtack) && zongbuIdtack.length > 0) {
            expandedKeys = zongbuIdtack;
        }
        if (Array.isArray(expandedKeys) && expandedKeys.length > 0) {
            // 有expandedKeys时，默认不全部展开
            extraProps.defaultExpandedKeys = expandedKeys;
            extraProps.defaultExpandAll = false;
        } else {
            // 全部展开
            extraProps.defaultExpandAll = true;
        }

        if (!renderTabPane) {
            return (
                <>
                    <div style={{ float: 'right' }}>{this.renderSwitcher()}</div>
                    <ItemNodeHandlerSelect nodeCode={endNodeCode} useNewTransfer={useNewTransfer} {...extraProps} />
                </>
            );
        }
        return (
            <Tabs.TabPane tab={this.renderItemTab(path)} key={`${id}`} forceRender>
                <ItemNodeHandlerSelect nodeCode={endNodeCode} useNewTransfer={useNewTransfer} {...extraProps} />
            </Tabs.TabPane>
        );
    }

    render() {
        const {
            handlerSelectModalVisible,
            selectedPaths,
            loadings,
        } = this.props;
        const {
            activeKey,
            useNewTransfer,
            autoClose,
        } = this.state;

        const TransferComponent = useNewTransfer ? TreeTransfer2 : TreeTransfer;

        return (
            <DraggableModal
                draggable
                title='选择处理人'
                visible={handlerSelectModalVisible}
                onCancel={this.handleCancel}
                onOk={this.handleOk}
                okText='提交'
                width={TransferComponent.styleValues.width + 48}
                destroyOnClose
                centered
                className={utils.getClassName('modal', this.props)}
                bodyStyle={{ paddingTop: 0 }}
                zIndex={1001}
                footer={[
                    <Checkbox checked={autoClose} onChange={this.changeAutoClose}>提交后自动关闭</Checkbox>,
                    <Button key="back" onClick={this.handleCancel}>
                        取消
                    </Button>,
                    <Button key="submit" type="primary" onClick={this.handleOk} loading={loadings['completeTask']}>
                        提交
                    </Button>,
                ]}
            >
                <Spin spinning={loadings['fetchAllNodeHandlerList']}>
                    {
                        selectedPaths.length === 1 ?
                            this.renderItem(selectedPaths[0], false)
                            :
                            <Tabs
                                activeKey={activeKey}
                                size='small'
                                className={utils.getClassName('tabs', this.props)}
                                tabBarStyle={{ marginBottom: 0 }}
                                onChange={key => this.setState({ activeKey: key })}
                                tabBarExtraContent={this.renderSwitcher()}
                            >
                                {selectedPaths.map((item, i) => this.renderItem(item, true))}
                            </Tabs>
                    }
                </Spin>
            </DraggableModal>
        );
    }

}

export default withFlowContext(PathHandlerSelectModal, [
    'handlerSelectModalVisible',
    'selectedPaths',
    'selectedNodesHandlers',
    'nodesHandlerTree',
    'loadings',
]);
