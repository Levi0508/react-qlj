import React, { useEffect } from 'react'
// import { Modal } from 'antd'
import WrapContent from './WrapContent'
import { withFlowContext } from '../../LinkFlowContext';
import utils from '../../../utils/utils';
import './style.less'
import '../../styles.less';
import classNames from 'classnames';
import Modal from '../../../components/DraggableModal';

const HelpModal = props => {
    const titleName = '帮助'
    const dispatch = props.dispatch
    const helpModalVisible = props.helpModalVisible
    let dataSource = [
        {
            title: '文件追踪功能',
            titleIcon: require("../../../assets/flow/fileTrack.png"),
            content: `文件追踪功能提供便捷的文件流转提醒方式，用户可以及时掌握文件流转情况。
            系统会自动以待阅或邮件的方式通知用户文件流转到的环节。设置文件追踪后，文件抵达相应环节，将以待阅或邮件方式提醒用户。
            单个文件设置：进入流转中文件，点击“文件追踪”按钮。
            您可按需要设置多种追踪方式，有两种提醒方式供您选择。
            批量设置：进入文件视图，选中一个或多个文件，点击视图菜单中的“文件追踪”按钮。进行批量设置时，仅提供两种追踪方式，您可根据需要设置。`
        },
        {
            title: '提醒处理人功能',
            titleIcon: require("../../../assets/flow/remind.png"),
            content: `使用“提醒”功能，用户可以选择待阅、邮件（可多选）方式提醒文件当前处理人尽快处理文件。
            进入流转中文件，点击操作“提醒”按钮。`
        },
        {
            title: '填写反馈功能',
            titleIcon: require("../../../assets/flow/feedback.png"),
            content: `使用“填写反馈”功能，您可以将文件处理情况等信息通过邮件方式及时反馈到其他处理人。
            进入流转中文件，点击操作“填写反馈”按钮。`
        },
    ]
    const handleOk = () => {
        dispatch({
            type: "toggleHelpModal",
            payload: false
        })
    }
    const handleCancel = () => {
        dispatch({
            type: "toggleHelpModal",
            payload: false
        })
    }
    useEffect(() => {
        // console.log(styles);
    })
    return (
        <div>
            <Modal
                className={classNames(
                    utils.getClassName('help_modal', props),
                    utils.getClassName('globalStyles.modal', props)
                )}
                title={titleName}
                visible={helpModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                width='705px'
                footer={null}
            >
                <WrapContent dataSource={dataSource} />
            </Modal>
        </div>
    )
}

export default withFlowContext(HelpModal,['helpModalVisible'])
