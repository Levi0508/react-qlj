import React from 'react';
import {
    // Modal,
    Spin,
    Checkbox,
    Radio,
    Row,
    Col,
    Form,
    message,
    Switch,
} from 'antd';
import _ from 'lodash';

import Modal from '../../../components/DraggableModal';
import { withFlowContext } from '../../LinkFlowContext';
import TreeTransfer from '../TreeTransfer/TreeTransfer';
import TreeTransfer2 from '../TreeTransfer/TreeTransfer2';
import utils from '../../../utils/utils';
import '../../styles.less';

const constantDepts = [
    {
        deptCode: 'a_01',
        deptName: '全公司所有部门',
    },
    {
        deptCode: 'a_02',
        deptName: '总部所有部门',
    },
    {
        deptCode: 'a_03',
        deptName: '所有分公司',
    },
    {
        deptCode: 'a_04',
        deptName: '所有营业部',
    },
    {
        deptCode: 'a_05',
        deptName: '所有子公司',
    },
];

const constantUserTypes = [
    {
        value: '0',
        label: '主负责人'
    },
    {
        value: '1',
        label: '辅负责人'
    },
    {
        value: '2',
        label: '秘书'
    },
    {
        value: '3',
        label: '主辅负责人'
    },
];

@Form.create()
class DistributeModal extends React.Component {

    state = {
        useNewTransfer: localStorage.getItem('useNewTransfer'),
    }

    handleSelectedDeptChanged = (distributeSelectedIds) => {
        const { dispatch } = this.props;
        dispatch({
            type: 'save',
            payload: {
                distributeSelectedIds,
            },
        });
    }

    handleCheckConstantDept = (item, checked) => {
        const {
            dispatch,
            distributeSelectedIds,
        } = this.props;
        const temp = [...distributeSelectedIds];
        if (checked) {
            temp.unshift(item.deptCode);
        } else {
            const index = temp.indexOf(item.deptCode);
            if (index >= 0) {
                temp.splice(index, 1);
            }
        }
        dispatch({
            type: 'save',
            payload: {
                distributeSelectedIds: temp,
            },
        });
    }

    handleCancel = () => {
        const { dispatch } = this.props;
        dispatch('toggleDistributeModal');
    }

    handleOk = () => {
        const {
            dispatch,
            distributeSelectedIds,
            form,
        } = this.props;
        form.validateFieldsAndScroll((err, values) => {
            if (err) return;
            const { userType } = values;
            dispatch({
                type: 'saveSilence',
                payload: { distributeUserType: userType },
            });
            if (!Array.isArray(distributeSelectedIds) || distributeSelectedIds.length === 0) {
                message.warn('请选择下发部门');
                return;
            }
            Modal.confirm({
                title: '是否确认下发？',
                onOk: () => {
                    return dispatch({
                        type: 'submitDistribute',
                    });
                },
                okText: '确认',
                cancelText: '取消',
            });
        });
    }

    handleChangeTransfer = () => {
        const { useNewTransfer } = this.state;
        localStorage.setItem('useNewTransfer', !useNewTransfer);
        this.setState({ useNewTransfer: !useNewTransfer });
    }

    searchFilter = (searchText, node) => {
        const { deptName, deptCode } = node;
        if ((deptName || '').indexOf(searchText) >= 0
            || (deptCode || '').indexOf(searchText) >= 0) {
            return true;
        }
        return false;
    }

    renderSwitcher = () => {
        const { useNewTransfer } = this.state;
        return <Switch checked={useNewTransfer} onChange={this.handleChangeTransfer} />;
    }

    render() {
        const {
            distributeModalVisible,
            distributeDeptTree,
            distributeDeptList,
            distributeSelectedIds,
            distributeUserType,
            loadings,
            form,
        } = this.props;
        const {
            useNewTransfer,
        } = this.state;

        const TransferComponent = useNewTransfer ? TreeTransfer2 : TreeTransfer;

        return (
            <Modal
                title='发送下行文'
                visible={distributeModalVisible}
                onOk={this.handleOk}
                onCancel={this.handleCancel}
                okText='提交'
                width={TransferComponent.styleValues.width + 48}
                centered
                className={utils.getClassName('modal', this.props)}
            >
                <Spin spinning={loadings['fetchDistributeDeptTree']}>
                    <div style={{ float: 'right' }}>{this.renderSwitcher()}</div>
                    <Form>
                        <Row type='flex' justify='space-between'>
                            <Col>
                                {constantDepts.map(item => (
                                    <Checkbox
                                        key={item.deptCode}
                                        checked={distributeSelectedIds.indexOf(item.deptCode) >= 0}
                                        onChange={(e) => this.handleCheckConstantDept(item, e.target.checked)}
                                    >
                                        {item.deptName}
                                    </Checkbox>
                                ))}
                            </Col>
                            <Col>
                                <Form.Item style={{ marginBottom: 0 }}>
                                    {form.getFieldDecorator('userType', {
                                        rules: [{ required: true, message: '请选择' }]
                                    })(<Radio.Group options={constantUserTypes} />)}
                                </Form.Item>
                            </Col>
                        </Row>
                        <TransferComponent
                            tree={distributeDeptTree}
                            list={[...constantDepts, ...distributeDeptList]}
                            value={distributeSelectedIds}
                            onChange={this.handleSelectedDeptChanged}
                            max={0}
                            leftTitle={'可选部门'}
                            rightTitle={'已选部门'}
                            getItemKey={(item) => _.get(item, 'deptCode')}
                            getItemLeftLabel={(item) => {
                                return _.get(item, 'deptName');
                            }}
                            getItemRightLabel={(item) => {
                                return _.get(item, 'deptName');
                            }}
                            getItemRightTip={(item) => null}
                            getChildren={(item) => _.get(item, 'children')}
                            searchPlaceholder={'输入部门名称搜索'}
                            searchFilter={this.searchFilter}
                            leftSearchPlaceholder={'输入部门名称搜索'}
                            leftSearchFilter={this.searchFilter}
                            midSearchPlaceholder={'输入部门名称搜索'}
                            midSearchFilter={this.searchFilter}
                            leftProps={{ checkStrictly: true }}
                        />

                    </Form>
                </Spin>
            </Modal>
        );
    }
}

export default withFlowContext(DistributeModal, [
    'distributeModalVisible',
    'distributeDeptTree',
    'distributeDeptList',
    'distributeSelectedIds',
    'distributeUserType',
    'loadings',
]);
