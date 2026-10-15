import React from 'react';
import {
    // Modal,
    Checkbox,
    Radio,
    Card,
    Row,
    Col,
    message,
} from 'antd';

import Modal from '../../../components/DraggableModal';
import { withFlowContext } from '../../LinkFlowContext';
import utils from '../../../utils/utils';
import '../../styles.less';
import classNames from 'classnames';

const idKey = 'selectId';

class PathSelectModal extends React.PureComponent {

    state = {
    }

    componentDidMount() {
        // TODO: 查询路径
    }

    isItemDisable = (item) => {
        const {
            selectedPathIds,
            pathConfig: { max },
        } = this.props;

        // 选中项超出max限制后，禁用没有被勾选的选项
        const disabled = max > 0
            && selectedPathIds.length >= max
            && selectedPathIds.indexOf(item[idKey]) < 0;

        return disabled;
    }

    handleItemSelect = (e) => {
        const { dispatch } = this.props;
        dispatch({
            type: 'updateSelectedPaths',
            payload: [e.target.value],
        });
    }

    handleItemsSelect = (selectedPathIds) => {
        const { dispatch } = this.props;
        dispatch({
            type: 'updateSelectedPaths',
            payload: selectedPathIds,
        });
    }

    handleSelectAll = () => {
        const { dispatch, nextPathList } = this.props;
        const selectedPathIds = nextPathList.map(item => item[idKey]);
        dispatch({
            type: 'updateSelectedPaths',
            payload: selectedPathIds,
        });
    }

    handleCancel = () => {
        const { dispatch } = this.props;
        dispatch({
            type: 'togglePathSelectModal',
            payload: false,
        });
    }

    handleOk = () => {
        const { dispatch, selectedPathIds, pathConfig } = this.props;
        const { min, max } = pathConfig;
        if (min && selectedPathIds.length < min) {
            message.warn(`请选择至少${min}条路径`);
            return
        }
        if (max && selectedPathIds.length > max) {
            message.warn(`请选择最多${max}条路径`);
            return
        }
        dispatch({
            type: 'ensurePathSelect',
        });
    }

    render() {
        const {
            handlerSelectModalVisible,
            pathSelectModalVisible,
            nextPathList,
            pathConfig: { max },
            selectedPathIds,
        } = this.props;

        return (
            <Modal
                visible={pathSelectModalVisible && !handlerSelectModalVisible}
                title='选择路径'
                onCancel={this.handleCancel}
                onOk={this.handleOk}
                okText='下一步'
                width={476}
                centered
                className={utils.getClassName('modal', this.props)}
            >
                <Card size='small' bodyStyle={{ padding: 8 }}>
                    {
                        max === 1 ?
                            <Radio.Group
                                value={selectedPathIds[0]}
                                onChange={this.handleItemSelect}
                                style={{
                                    width: '100%',
                                    height: 250,
                                    overflowY: 'auto',
                                    overflowX: 'hidden',
                                }}
                            >
                                <Row>
                                    {nextPathList.map(item => (
                                        <Col span={24} key={item[idKey]}>
                                            <Radio
                                                value={item[idKey]}
                                                style={{ padding: 8, width: '100%' }}
                                            >
                                                {item.selectPathName}
                                            </Radio>
                                        </Col>
                                    ))}
                                </Row>
                            </Radio.Group>
                            :
                            <Checkbox.Group
                                value={selectedPathIds}
                                onChange={this.handleItemsSelect}
                                style={{ height: 250, overflow: 'auto' }}
                            >
                                <Row>
                                    {nextPathList.map(item => (
                                        <Col span={24} key={item[idKey]}>
                                            <Checkbox
                                                disabled={this.isItemDisable(item)}
                                                value={item[idKey]}
                                                style={{ padding: 8, width: '100%' }}
                                            >
                                                {item.selectPathName}
                                            </Checkbox>
                                        </Col>
                                    ))}
                                </Row>
                            </Checkbox.Group>
                    }

                </Card>
            </Modal>
        );
    }

}

export default withFlowContext(PathSelectModal, [
    'handlerSelectModalVisible',
    'pathSelectModalVisible',
    'nextPathList',
    'selectedPathIds',
    'pathConfig',
]);
