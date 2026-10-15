import React, { Component } from 'react';
import {
    // Modal,
    Input,
    Form,
    Descriptions,
    Select,
    Checkbox,
} from 'antd';

import Modal from '../../../components/DraggableModal';
import utils from '../../../utils/utils';
import '../../styles.less';

import { withFlowContext } from '../../LinkFlowContext';

import _ from 'lodash';

const options = [
    { label: '邮件', value: '1' },
];

class NoticeModal extends Component {

    state = { toUserInfoList: null, seledtedList: [] }

    handleOk = () => {
        const {
            dispatch,
            form,
            piid,
            tiid,
        } = this.props;

        const {
            toUserInfoList,
            seledtedList,
        } = this.state;
        //toUserInfoList = [{toUserId:"",toUserName:""}]

        form.validateFieldsAndScroll((err, values) => {
            if (err || !toUserInfoList) return;
            const { msgType, subject, content } = values;
            dispatch({
                type: `submitNoticeReport`,
                payload: {
                    msgType: msgType.join(),
                    subject,
                    content,
                    toUserInfoList: _.uniqBy(toUserInfoList.filter(item => seledtedList.findIndex(sitem => sitem.key === item.key ) >=0 ), "toUserId"),
                },
            });
        });
    }

    handleCancel = () => {
        const {
            dispatch,
        } = this.props;
        dispatch({
            type: `toggleNoticeModal`,
            payload: false,
        });
    }

    handleChange = value => {
        this.setState({
            seledtedList: value
        });
    };

    handleChangeAll = e => {
        this.setState({toUserInfoList: null, checkedAll: e.target.checked});
    }

    renderUserList = () => {
        const {
            instFlowTodoPersonList,
            instFlowAllPersonList,
            tiid,
        } = this.props;

        let {
            toUserInfoList,
            checkedAll,
        } = this.state;

        let users = [];
        if(!checkedAll) {
            let users = instFlowTodoPersonList
                        .filter(item => ['0', '1', '2'].indexOf(item.personType) >= 0);    // 只显示起草、待办、已办，不显示待阅
            if(toUserInfoList === null) {
                toUserInfoList = users.map(u=>{ return { key: u.userId, text: u.userName, toUserId: u.userId, toUserName: u.userName}; });

                toUserInfoList = _.uniqBy(toUserInfoList, "key");
                this.state.toUserInfoList = toUserInfoList;
                // 默认全部选中
                this.state.seledtedList = toUserInfoList.map(u=> { return { key : u.toUserId}});
            }
        } else {
            users = instFlowAllPersonList;
            if(toUserInfoList === null && users && users.length > 0) {
                toUserInfoList = users.sort((a,b) => b.createTime - a.createTime).map(u=>{ return { key: u.nodeCode + '-' + u.userId, text: u.nodeName + '-' + u.userName, toUserId: u.userId, toUserName: u.userName}; });

                toUserInfoList = _.uniqBy(toUserInfoList, "key");
                this.state.toUserInfoList = toUserInfoList;
                // 默认补选中
                this.state.seledtedList = [];
            }
        }

        return <><Select
                    mode="tags"
                    placeholder="请选择提醒人员"
                    value={this.state.seledtedList}
                    style={{ width: '80%', marginRight: '10px' }}
                    labelInValue
                    onChange={this.handleChange }
                >
                    {
                        toUserInfoList.map(user => {
                            return <Select.Option key={user.key} value={user.key}>{user.text}</Select.Option>;
                        })
                    }
                </Select>
                <Checkbox
                    checked={checkedAll}
                    onChange={this.handleChangeAll}>
                    所有人员
                </Checkbox>
                </>;
    }

    render() {
        const {
            noticeModalVisible,
            loadings,
            instFlowTodoPersonList,
            todoTitle,
            form: { getFieldDecorator },
            ...restProps
        } = this.props;

        return (
            <Modal
                title='提醒'
                width={800}
                {...restProps}
                visible={noticeModalVisible}
                confirmLoading={loadings['notice']}
                onOk={this.handleOk}
                onCancel={this.handleCancel}
                centered
                className={utils.getClassName('modal', this.props)}
            >
                <Form>
                    <Descriptions bordered size={"small"} column={1}>
                        <Descriptions.Item label='通知对象'>{this.renderUserList()}</Descriptions.Item>
                        <Descriptions.Item label='提醒方式'>
                            <Form.Item style={{ margin: 0 }}>
                                {
                                    getFieldDecorator('msgType', {
                                        initialValue: ['1'],
                                        rules: [{ required: true, message: '请选择提醒方式' }],
                                    })(
                                        <Checkbox.Group options={options} defaultValue={['1']} />
                                    )
                                }
                            </Form.Item>
                        </Descriptions.Item>
                        <Descriptions.Item label='标题'>
                            <Form.Item style={{ margin: 0 }}>
                                {
                                    getFieldDecorator('subject', {
                                        initialValue: `请尽快处理文件：${todoTitle}`,
                                        rules: [{ required: true, message: '请输入标题' }],
                                    })(<Input maxLength={100} />)
                                }
                            </Form.Item>
                        </Descriptions.Item>
                        <Descriptions.Item label='内容'>
                            <Form.Item style={{ margin: 0 }}>
                                {
                                    getFieldDecorator('content', {
                                        rules: [{ required: true, message: '请输入内容' }],
                                    })(<Input.TextArea maxLength={500} rows={4} />)
                                }
                            </Form.Item>
                        </Descriptions.Item>
                    </Descriptions>
                </Form>
            </Modal>
        );
    }
}

export default Form.create()(withFlowContext(NoticeModal, [
    'noticeModalVisible',
    'piid',
    'tiid',
    'instFlowTodoPersonList',
    'instFlowAllPersonList',
    'loadings',
    'todoTitle',
]));
