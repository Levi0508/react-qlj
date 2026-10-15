import React from 'react';
import {
    Modal,
    Form,
    Radio,
    Divider,
} from 'antd';
import _ from 'lodash';
import moment from 'moment';

import { withFlowContext } from '../../LinkFlowContext';

@Form.create()
class TaskSelectModal extends React.Component {

    handleOk = () => {
        const {
            form,
            dispatch,
            instFlowCurrentPersonList,
        } = this.props;
        form.validateFieldsAndScroll((err, values) => {
            if (err) return;
            const { curTiid } = values;
            const curTask = instFlowCurrentPersonList.find(item => item.tiid === curTiid);
            dispatch({
                type: 'loadTask',
                payload: curTask,
            });
        });
    }

    renderItemRadio = (item) => {
        const {
            tiid,
            nodeName,
            userName,
            deptName,
            createTime,
        } = item;
        const text = `${nodeName} / ${userName}(${deptName}) / ${moment(createTime).format('YYYY-MM-DD HH:mm:ss')}`;
        return <><Radio key={tiid} value={tiid} style={{}}>{text}</Radio><br /></>;
    }

    render() {
        const {
            form,
            todoTitle,
            instFlowCurrentPersonList,
            taskSelectModalVisible,
        } = this.props;

        let hint = '请选择一条待办任务进行处理';
        // 起草+待办任务
        let taskList = instFlowCurrentPersonList.filter(item => item.personType === '0' || item.personType === '1').sort((a, b) => b.createTime - a.createTime);

        if (taskList.length === 0) {
            // 待阅任务
            hint = '请选择一条待阅任务进行处理';
            taskList = instFlowCurrentPersonList.filter(item => item.personType === '3').sort((a, b) => b.createTime - a.createTime);
        }
        if (taskList.length === 0) {
            // 已办任务
            hint = '请选择一条已办任务进行查看';
            taskList = instFlowCurrentPersonList.filter(item => item.personType === '2').sort((a, b) => b.createTime - a.createTime);
        }

        const okDisabled = !form.getFieldValue('curTiid');

        return (
            <Modal
                title={todoTitle}
                visible={taskSelectModalVisible}
                bodyStyle={{ padding: 8, overflow: 'auto' }}
                onOk={this.handleOk}
                okButtonProps={{ disabled: okDisabled }}
                cancelButtonProps={{ style: { display: 'none' } }}
                width={600}
                centered
                closable={false}
                maskClosable={false}
            >
                <Form>
                    {
                        form.getFieldDecorator('curTiid', {
                            rules: [{ required: true, message: '请选择一条任务' }],
                        })(
                            <Radio.Group>
                                <Divider orientation='left' style={{ margin: 0 }}>{hint}</Divider>
                                {taskList.map(this.renderItemRadio)}
                            </Radio.Group>
                        )
                    }
                </Form>
            </Modal>
        );
    }
}

export default withFlowContext(TaskSelectModal, [
    'instFlowCurrentPersonList',
    'taskSelectModalVisible',
    'curTask',
    'todoTitle',
]);
