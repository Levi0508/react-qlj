import React, {useState} from 'react'

import {
    // Modal,
    // Button,
    Table
} from 'antd';
import { withFlowContext } from '../../LinkFlowContext';

import Modal from '../../../components/DraggableModal';
import utils from '../../../utils/utils';
import './style.less'
import '../../styles.less';
import classNames from 'classnames';

const VersionHis = props => {
    const versionHisModalVisible = props.versionHisModalVisible
    const dispatch = props.dispatch
    const titleName = '历史版本'
    const pagination = false
    const columns = [
        {
            title: '环节名称',
            dataIndex: 'nodeName',
            key: 'nodeName',
            align: 'center',
            render: (text, row) => {
                return <a onClick={() => handleLink(row)}>{text}</a>
            },
        },
        {
            title: '处理人',
            dataIndex: 'userName',
            key: 'userName',
            align: 'center',
            render: (text, row) => {
                return <a onClick={() => handleLink(row)}>{text}</a>
            },
        }
    ]
    const handleLink = (row) => {
        setNodeName(row.nodeName);
        setUserName(row.userName);
        dispatch({
            type: 'toggleVersionHisOneModal',
            payload: {
                versionHisOneModalVisible: true,
                id: row.id
            }
        })
    }
    const [nodeName, setNodeName] = useState(
        ''
    );
    const [userName, setUserName] = useState(
        ''
    );
    const handleOk = () => { }
    const handleCancel = () => {
        dispatch({
            type: 'toggleVersionHisModal',
            payload: false
        })
    }
    const handleOneCancel = () => {
        dispatch({
            type: 'toggleVersionHisOneModal',
            payload: false
        })
    }
    return (
        <div>
            <Modal
                className={classNames(
                    utils.getClassName('version_his', props),
                    utils.getClassName('modal', props)
                )}
                title={titleName}
                visible={versionHisModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                width='500px'
                footer={null}
            >
                <Table columns={columns} dataSource={props.versionHisList} bordered='true' pagination={pagination} />
            </Modal>
            <Modal
                className={classNames(
                    utils.getClassName('version_his'),
                    utils.getClassName('modal')
                )}
                title={titleName}
                visible={props.versionHisOneModalVisible}
                onCancel={handleOneCancel}
                width='800px'
                footer={null}
            >
                <div style={{marginBottom: "50px", textAlign: "center", fontWeight: "600"}}>{`以下为 ${userName} 在 ${nodeName} 环节保留的正文域:`}</div>
                <div style={{overflowX: "auto"}} dangerouslySetInnerHTML={{__html: props.versionHisOne}}></div>
            </Modal>
        </div>
    )
}

export default withFlowContext(VersionHis,['versionHisModalVisible','versionHisList','versionHisOneModalVisible','versionHisOne'])
