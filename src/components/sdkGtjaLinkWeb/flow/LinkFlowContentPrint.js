import React from 'react';
import DocumentTitle from 'react-document-title';

import {
    Row,
    Typography,
    Badge,
    Spin,
    Form,
    Button
} from 'antd';
import 'antd/dist/antd.less';

import TaskSelectModal from './components/TaskSelectModal';
import HandlerInfo from './components/HandlerInfo';
import SerialNum from './components/SerialNum';

import OpinionModal from './components/OpinionModal';
import PathSelectModal from './components/PathSelectModal';
import HandlerSelectModal from './components/HandlerSelectModal';
import SendBackConfirmModal from './components/SendBackConfirmModal';
import SubmitConfirmModal from './components/SubmitConfirmModal';
import FeedbackModal from './components/FeedbackModal';
import FileDeleteModal from './components/FileDeleteModal';

import OpinionList from './components/OpinionList';
import AttachmentNew from './components/AttachmentNew'

import FlowTrackModal from './components/FlowTrackModal';
import HelpModal from './components/HelpModal'
import ErrorReportModal from './components/ErrorReportModal'
import VersionHis from './components/VersionHis'
import AttachmentModal from './components/AttachmentModal'

import SlotContent from '../components/Slot/SlotContent';


import { withFlowContext } from './LinkFlowContext';

import LinkFlowForm from '../form/LinkFlowForm';

import LinkFlowEditor from '../form/LinkFlowEditor';

import utils from '../utils/utils';
import colors from '../utils/colors';

import './styles.less';
import RightList from './components/UserListTransfer/RightList';

const { Title } = Typography;

const ContentTab = (props) => (
    <div
        className={props.className}
        style={{
            backgroundColor: colors.background,
            // paddingBottom: 96,
            ...props.style
        }}
    >
        {props.children}
    </div>
)


@Form.create()
class LinkFlowContentPrint extends React.Component {

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
        setTimeout(()=>{
            if(gwm) gwm.cancel();
            let divs = document.getElementsByTagName('div');
            for(let i = 0;i<divs.length;i++){
                if(divs[i].id && (new RegExp(/^__gwm_/)).test(divs[i].id)){
                divs[i].style.display = "none" ;
                break;
                }
            }
            window.print();
        },2000) ;
    }
    pagePrint=()=>{
        window.print();
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
            isInit,

            title,

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
                    style={{
                        marginBottom: 0,
                        maxWidth: '1069px',//1220px
                        width: '1069px',
                        margin: 'auto',
                        backgroundColor: colors.background
                    }}
                >
                    <div className={utils.getClassName('noprint', this.props)} style={{textAlign:'right',position:"fixed",right: "50px",top: "10px"}}>
                        <Button type="primary" onClick={this.pagePrint}>打印</Button>
                    </div>
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
                        <SlotContent name={SlotContent.slotNames.TITLE}>
                            <div className={utils.getClassName('flowTitle', this.props)}>
                                <Title level={3}>{title}</Title>
                            </div>
                        </SlotContent>
                        <Row type='flex' justify='space-between' style={{ fontSize: 16 }}>
                            <SlotContent name={SlotContent.slotNames.SERIAL_NUM}>
                                <SerialNum {...flowProps.serialNumProps} />
                            </SlotContent>
                        </Row>
                    </div>
                    {/* 打印的模块组织 */}
                    <div>
                        {/* 审批单 */}
                        <div  key='form'>
                            <ContentTab>
                                <div style={{ backgroundColor: 'white' }}>
                                    <SlotContent name={SlotContent.slotNames.FORM}>
                                        <LinkFlowForm />
                                    </SlotContent>
                                    <SlotContent name={SlotContent.slotNames.FORM_AFTER} />
                                </div>
                                <OpinionList style={{ marginTop: 16 }} {...flowProps.opinionListProps} />
                            </ContentTab>
                        </div>
                        {/* 正文 */}
                        <div key="richText">
                            {
                            showRichText &&
                            <ContentTab>
                                <div style={{ backgroundColor: 'white' }}>
                                    <LinkFlowEditor />
                                </div>
                            </ContentTab>
                            }
                        </div>
                        {/* 附件 */}
                        <div key='attachment'>
                            {/* 附件<AttachmentNew/>组件 外层无法使用card组件包裹，内部是一个card list  */}
                            {/* 外层的card会影响内部ui */}
                            {
                            showAttachmentTab &&
                                <ContentTab className={utils.getClassName('tabs_attachment', this.props)}>
                                    {/* 附件<AttachmentNew/>组件 外层无法使用card组件包裹，内部是一个card list  */}
                                    {/* 外层的card会影响内部ui */}
                                    <SlotContent name={SlotContent.slotNames.ATTACHMENT}>
                                        <AttachmentNew bodyStyle={{ padding: "24px" }} style={{ width: "1069px", margin: "0px auto" }} />
                                    </SlotContent>
                                </ContentTab>
                            }
                        </div>
                    </div>
                </div>
            </Spin>
        );
    }

    render() {
        const {
            flowProps,
            title,
            className,
            piid,
            curTaskLoaded,
            children,
        } = this.props;
        let windowTitle = title;
        if (typeof flowProps.getWindowTitle === 'function') {
            windowTitle = flowProps.getWindowTitle(title) || title;
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

                                {/* <Bottom />*/}

                                <OpinionModal />
                                <PathSelectModal />
                                <HandlerSelectModal />
                                <SendBackConfirmModal />
                                <SubmitConfirmModal />
                                <FeedbackModal />
                                <FileDeleteModal />

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

export default withFlowContext(LinkFlowContentPrint, [
    'flowProps',
    'curTaskLoaded',
    'piid',
    'tiid',
    'title',
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
