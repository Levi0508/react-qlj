import React from 'react';
import DocumentTitle from 'react-document-title';

import {
    Card,
    Tabs,
    Divider,
    Row,
    Typography,
    Badge,
    Spin,
    Form,
    Input,
    message,
} from 'antd';
// import 'antd/dist/antd.less';     会覆盖接入系统的全局样式

import TaskSelectModal from './components/TaskSelectModal';
import HandlerInfo from './components/HandlerInfo';
import SerialNum from './components/SerialNum';
import Bottom from './components/Bottom';
import OpinionModal from './components/OpinionModal';
import SmartCommitModal from './components/SmartCommitModal';
import PathSelectModal from './components/PathSelectModal';
import HandlerSelectModal from './components/HandlerSelectModal';
import SendBackConfirmModal from './components/SendBackConfirmModal';
import SubmitConfirmModal from './components/SubmitConfirmModal';
import FeedbackModal from './components/FeedbackModal';
import FileDeleteModal from './components/FileDeleteModal';
import DistributeModal from './components/DistributeModal';

import OpinionList from './components/OpinionList';
import AttachmentNew from './components/AttachmentNew'
import ApprovalProgress from './components/ApprovalProgress';

import FlowTrackModal from './components/FlowTrackModal';
import HelpModal from './components/HelpModal'
import ErrorReportModal from './components/ErrorReportModal'
import VersionHis from './components/VersionHis'
import AttachmentModal from './components/AttachmentModal'

import NoticeModal from './components/NoticeModal';
import FileCompareModal from './components/FileCompareModal'

import SlotContent from '../components/Slot/SlotContent';


import { withFlowContext } from './LinkFlowContext';

import LinkFlowForm from '../form/LinkFlowForm';

import LinkFlowEditor from '../form/LinkFlowEditor';

import utils from '../utils/utils';
import colors from '../utils/colors';

import './styles.less';

const { Title } = Typography;

const ContentTab = (props) => (
    <div
        className={props.className}
        style={{
            backgroundColor: colors.background,
            paddingBottom: 96,
            ...props.style
        }}
    >
        {props.children}
    </div>
)


@Form.create()
class LinkFlowContent extends React.Component {


    componentDidMount() {
        // TODO:
        // const { dispatch, currentUser } = this.props;
        // const encryptionStr = Base64.encode(`MD.TH@auth,${currentUser.uid}`).replace(/=/g, '.');
        // request.post('/api/ib/login/userAuthMD', {
        //     data: {
        //         encryptionStr, //: encryptionStr || 'TUQuVEhAYXV0aCx6aGFuZ3FpbG9uZw..',
        //     },
        // }).then(res => {
        //     if (res.code === 0) {
        //         const currentUser = res.result;
        //         jwtInterceptor.setToken(currentUser.token);
        //         return dispatch({
        //             type: 'save',
        //             payload: {
        //                 currentUser,
        //             },
        //         });
        //     }
        //     throw new Error(`用户信息校验失败：${res.msg}`);
        // }).then(() => {
        this.afterLogin(true);
        // }).catch(err => {
        //     message.warn(err.message);
        // });
    }


    afterLogin = (login) => {
        if (login) {
            const {
                dispatch,
                piid,
            } = this.props;
            if (!piid) {
                // 起草，查询流程模板信息
                dispatch({
                    type: `fetchFlowTemplateInfo`,
                });
            } else {
                // 获取流程详情
                dispatch({
                    type: `initWindow`,
                });
            }
        }
    }

    handleTabChange = (selectedTabId) => {
        const {
            dispatch,
        } = this.props;

        dispatch({
            type: 'save',
            payload: { selectedTabId },
        });




    }

    renderFileTotal = () => {
        const {
            fileTotal,
        } = this.props;
        return (
            <Badge
                count={fileTotal || 0}
                className={utils.getClassName('countBadge', this.props)}
                showZero
            />
        );
    }

    renderLayout = () => {
        const {
            flowProps,
            isBeforeDraft,
            isLogin,


            title,
            isInit,
            selectedTabId,
            showRichText,
            showAttachmentTab,

        } = this.props;
        // if (!isLogin) {
        //     // TODO: 提示用户未登录
        //     return '用户未登录';
        // }

        return (
            <Spin
                spinning={!isInit}
            >
                <div
                    className={utils.getClassName('flowContent', this.props)}
                    style={{
                        backgroundColor: colors.background,
                    }}
                >
                    <div
                        style={{
                            paddingTop: 16,
                            paddingLeft: 16,
                            paddingRight: 16,
                            paddingBottom: 8,
                            background: 'white',
                            borderBottom: '1px solid #d9d9d9',
                        }}
                    >
                        <SlotContent name={SlotContent.slotNames.TITLE} content={flowProps.slots.title}>
                            <div className={utils.getClassName('flowTitle', this.props)}>
                                <Title level={3}>{title}</Title>
                            </div>
                        </SlotContent>
                        <Row type='flex' justify='space-between' style={{ fontSize: 16 }}>
                            <HandlerInfo />
                            <SlotContent name={SlotContent.slotNames.SERIAL_NUM} content={flowProps.slots.serialNum}>
                                <SerialNum {...flowProps.serialNumProps} />
                            </SlotContent>
                        </Row>
                    </div>
                    <SlotContent name={SlotContent.slotNames.TABS} content={flowProps.slots.tabs}>
                        <Tabs
                            size='large'
                            tabBarStyle={{ backgroundColor: 'white' }}
                            style={{ backgroundColor: colors.background, minHeight: '80vh' }}
                            // activeKey={selectedTabId}
                            activeKey='form'
                            onChange={this.handleTabChange}
                            animated={false}
                            tabBarExtraContent={<SlotContent name={SlotContent.slotNames.TAB_BAR_EXTRA_CONTENT} content={flowProps.slots.tabBarExtraContent} />}
                        >
                            <Tabs.TabPane tab='审批单' key='form'>
                                <ContentTab>
                                    <div style={{ backgroundColor: 'white' }}>
                                        <SlotContent name={SlotContent.slotNames.FORM} content={flowProps.slots.form}>
                                            <LinkFlowForm />
                                        </SlotContent>
                                        <SlotContent name={SlotContent.slotNames.FORM_AFTER} content={flowProps.slots.formAfter} />
                                    </div>
                                    <OpinionList style={{ marginTop: 16 }} {...flowProps.opinionListProps} />
                                </ContentTab>
                            </Tabs.TabPane>
                            {/* {
                                showRichText &&
                                <Tabs.TabPane tab='正文' key='richText'>
                                    <ContentTab>
                                        <div style={{ backgroundColor: 'white' }}>
                                            <LinkFlowEditor />
                                        </div>
                                    </ContentTab>
                                </Tabs.TabPane>
                            } */}
                            {
                                showAttachmentTab &&
                                <Tabs.TabPane forceRender={true} tab={<div>附件{this.renderFileTotal()}</div>} key='attachment'>
                                    <ContentTab className={utils.getClassName('tabs_attachment', this.props)}>
                                        {/* 附件<AttachmentNew/>组件 外层无法使用card组件包裹，内部是一个card list  */}
                                        {/* 外层的card会影响内部ui */}
                                        <SlotContent name={SlotContent.slotNames.ATTACHMENT} content={flowProps.slots.attachment}>
                                            <AttachmentNew bodyStyle={{ padding: "24px" }} style={{ margin: "0px auto" }} />
                                        </SlotContent>
                                    </ContentTab>

                                </Tabs.TabPane>
                            }
                            {/* {
                        !isBeforeDraft &&
                        <Tabs.TabPane tab='审批进度' key='3'>
                            <ContentTabCard>
                                <ApprovalProgress />
                            </ContentTabCard>
                        </Tabs.TabPane>
                    } */}
                        </Tabs>
                    </SlotContent>
                </div>
            </Spin>
        );
    }

    render() {
        const {
            flowProps,
            className,
            piid,
            curTaskLoaded,
            children,
            FORMCONFIG_ID,
            PROCESS_ID
        } = this.props;
        let { title, windowTitle } = this.props;
        
        if (typeof flowProps.getWindowTitle === 'function') {
            windowTitle = flowProps.getWindowTitle(windowTitle) || windowTitle;
        }
        return (
            <React.Fragment>
                <DocumentTitle title={windowTitle}>
                    {
                        piid && !curTaskLoaded ?
                            <TaskSelectModal />
                            :
                            <div
                                style={{ height: '100%' }}
                                className={className}
                            >
                                {this.renderLayout()}

                                <Bottom />

                                <OpinionModal />
                                <SmartCommitModal />
                                <PathSelectModal />
                                <HandlerSelectModal />
                                <SendBackConfirmModal />
                                <SubmitConfirmModal FORMCONFIG_ID={FORMCONFIG_ID} PROCESS_ID={PROCESS_ID}/>
                                <FeedbackModal />
                                <FileDeleteModal />
                                <DistributeModal />
                                <NoticeModal />
                                {/* 文件对比 */}
                                <FileCompareModal />
                                <FlowTrackModal {...this.props} />
                                <HelpModal {...this.props} />
                                <ErrorReportModal {...this.props} />
                                <VersionHis {...this.props} />
                                <AttachmentModal {...this.props} />

                                <div style={{ display: 'none' }}>
                                    {children}
                                </div>
                            </div>
                    }
                </DocumentTitle>
            </React.Fragment>
        );
    }
}

export default withFlowContext(LinkFlowContent, [
    'flowProps',
    'curTaskLoaded',
    'piid',
    'tiid',
    'title',
    'windowTitle',
    'fileTotal',
    'formRef',
    'editorRef',
    'flowCode',
    'formConfig',
    'isBeforeDraft',
    'isLogin',
    'isInit',
    'selectedTabId',
    'showRichText',
    'showAttachmentTab'
]);
