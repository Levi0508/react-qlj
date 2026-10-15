import React, { useState } from 'react'
import { Modal, message } from 'antd'
import AttachmentFormContant from './AttachmentFormContant'
import { withFlowContext } from '../../LinkFlowContext';
import utils from '../../../utils/utils';
import './style.less'
import '../../styles.less';
import classNames from 'classnames';


const AttachmentModal = props => {
    const titleName = '上传附件'
    const dispatch = props.dispatch
    const attachmentModalVisible = props.attachmentModalVisible
    const [uploadFileName1, setUploadFileName1] = useState()
    const [uploadFileName2, setUploadFileName2] = useState()
    const [uploadFileName3, setUploadFileName3] = useState()

    const [description1, setDescription1] = useState()
    const [description2, setDescription2] = useState()
    const [description3, setDescription3] = useState()

    const [attachmentType1, setAttachmentType1] = useState('普通附件')
    const [attachmentType2, setAttachmentType2] = useState('普通附件')
    const [attachmentType3, setAttachmentType3] = useState('普通附件')
    const uploadProps1 = {
        name: 'file',
        action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
        headers: {
            authorization: 'authorization-text',
        },
        showUploadList: false
    }
    const uploadProps2 = {
        name: 'file',
        action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
        headers: {
            authorization: 'authorization-text',
        },
        showUploadList: false
    }
    const uploadProps3 = {
        name: 'file',
        action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
        headers: {
            authorization: 'authorization-text',
        },
        showUploadList: false
    }
    /***
     * 表单元素值changhe事件的包
     * 将需要修改的值和使用的方法作为参数包裹onChange事件
     * @params values 修改的值
     * @params setStateName useState的方法
     */
    const onChangeForm = (values, setStateName) => {
        setStateName(values)
    }
    const handleOk = () => {
        message.info(`${uploadFileName1},${uploadFileName2},${uploadFileName3}`)
    }
    const handleCancel = () => {
        dispatch({
            type: 'toggleAttachmentModal',
            payload: false
        })
    }
    return (
        <>
            <Modal
                title={titleName}
                visible={attachmentModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                width='740px'
                destroyOnClose={true}
                className={classNames(
                    utils.getClassName('attachment_modal', props),
                    utils.getClassName('modal', props)
                )}
            >
                <AttachmentFormContant
                    formData={{
                        uploadFileName: uploadFileName1,
                        setUploadFileName: setUploadFileName1,
                        description: description1,
                        setDescription: setDescription1,
                        attachmentType: attachmentType1,
                        setAttachmentType: setAttachmentType1
                    }}
                    // 更新表单的的方法  接受参数为改变的值和更新值的方法
                    onChangeForm={onChangeForm}
                    uploadProps={uploadProps1}>
                </AttachmentFormContant>
                <AttachmentFormContant
                    formData={{
                        uploadFileName: uploadFileName2,
                        setUploadFileName: setUploadFileName2,
                        description: description2,
                        setDescription: setDescription2,
                        attachmentType: attachmentType2,
                        setAttachmentType: setAttachmentType2
                    }}
                    onChangeForm={onChangeForm}
                    uploadProps={uploadProps2}
                    >
                </AttachmentFormContant>
                <AttachmentFormContant
                    formData={{
                        uploadFileName: uploadFileName3,
                        setUploadFileName: setUploadFileName3,
                        description: description3,
                        setDescription: setDescription3,
                        attachmentType: attachmentType3,
                        setAttachmentType: setAttachmentType3
                    }}
                    onChangeForm={onChangeForm}
                    uploadProps={uploadProps3}
                    isDivider={false}
                >
                </AttachmentFormContant>
            </Modal>
        </>
    )
}

export default withFlowContext(AttachmentModal,['attachmentModalVisible'])
