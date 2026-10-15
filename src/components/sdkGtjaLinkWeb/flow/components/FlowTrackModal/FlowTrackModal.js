import React, { useState, useEffect } from 'react'
import { Modal, Button, Table } from 'antd';
// import DraggableAntdModal from 'draggable-antd-modal';
import DraggableModal from '../../../components/DraggableModal';
import { withFlowContext } from '../../LinkFlowContext';
import utils from '../../../utils/utils';
import './styles.less'
import '../../styles.less';
import classNames from 'classnames';

const render = (text, record, render2) => (
    <span style={{color: record.sendTime ? 'inherit' : 'red'}}>
        {typeof render2 === 'function' ? render2(text, record) : text}
    </span>
);
const renderAs = (render2) => (text, record) => render(text, record, render2);

const columns = [
    {
        title: '处理环节',
        dataIndex: 'nodeName',
        width: '20%',
        key: 'nodeName',
        align: 'center',
        render,
    },
    {
        title: '处理人',
        dataIndex: 'userName',
        width: '10%',
        key: 'userName',
        align: 'center',
        render: renderAs((userName, {readTag, sendTime}) => {
            if(sendTime) return userName;
            const readTagMap = {'0': '未读', '1': '已读'};
            return <span>{userName}<br />({readTagMap[readTag||'0']})</span>;
        }),
    },
    {
        title: '到达时间',
        dataIndex: 'receiveTime',
        width: '15%',
        key: 'receiveTime',
        align: 'center',
        render: renderAs(text => renderTime(text)),
    },
    {
        title: '处理时间',
        dataIndex: 'sendTime',
        width: '15%',
        key: 'sendTime',
        align: 'center',
        render: renderAs(text => renderTime(text, '未结束')),
    },
    {
        title: '提交路径',
        dataIndex: 'pathName',
        width: '20%',
        key: 'pathName',
        align: 'center',
        render: renderAs(text => text || '未提交'),
    },
    {
        title: '后续处理人',
        dataIndex: 'nextUserName',
        width: '20%',
        key: 'nextUserName',
        align: 'center',
        render: renderAs(text => text || '无'),
    }]
const renderTime = (time, empty = '') => {
    if (!time) return empty;
    return `${time.slice(0, 4)}-${time.slice(4, 6)}-${time.slice(6, 8)} ${time.slice(8, 10)}:${time.slice(10, 12)}:${time.slice(12, 14)}`
}
const FlowTrackModal = props => {

    const flowTrackModalVisible = props.flowTrackModalVisible
    const data = props.flowTrackList
    const dispatch = props.dispatch
    const [titleName, setTitleName] = useState('流程跟踪');
    const pagination = false

    const handleOk = () => {
        dispatch({
            type: "toggleFlowTrackModal",
            payload: false
        });
    }
    const handleCancel = () => {
        dispatch({
            type: "toggleFlowTrackModal",
            payload: false
        });
    }
    // 获取流程列表数据 ，改从点击流程跟踪时获取
    // const getFlowTrackList = () => {
    //     dispatch({
    //         type: `fetchFlowTrackList`,
    //     });
    // }
    // useEffect(() => {
    //     getFlowTrackList();
    // }, [])

    return (
        <div>
            <DraggableModal
                className={classNames(
                    utils.getClassName('flow_track_modal', props),
                    utils.getClassName('globalStyles.modal', props)
                )}
                title={titleName}
                visible={flowTrackModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                width='969px'
                footer={<Button type="primary" onClick={handleCancel}>关闭</Button>}
                draggable
            >
                <Table size='small' columns={columns} dataSource={data} bordered={true} pagination={pagination} />
            </DraggableModal>
        </div>

    )
}
export default withFlowContext(FlowTrackModal, ['flowTrackModalVisible', 'piid', 'flowTrackList'])
