import React from 'react';
import pathToRegexp from 'path-to-regexp';
import moment from 'moment';
import 'moment/locale/zh-cn';

import {
    FlowEvent,
} from './constants';
import { LinkFlowContext } from './LinkFlowContext';
import Dispatcher from './actions/Dispatcher';

import LinkFlowContentPrint from './LinkFlowContentPrint';

import utils from '../utils/utils';
import linkRequest from '../utils/linkRequest';
import linkInterceptor from '../utils/interceptors/linkInterceptor';

moment.locale('zh-cn');

/**
 * 流程页面路由组成为`print/${routerPrefix}/${flowType}?piid=${piid}`
 */
class LinkFlowPrint extends React.Component {
    // static setTrackable(trackable) {
    //     global.trackable = trackable;
    // }

    static defaultProps = {
        [FlowEvent.onBeforeDispatch]: null, // (action) => newAction,
        [FlowEvent.onAfterDispatch]: null, // (action, result) => newResult,
        routerPrefix: '/flow',  // 流程页面路由前缀地址，根据前缀地址来确定flowType
        getWindowTitle: null,   // (title) => newTitle 获取页面标题的方法
        // currentUser: {},        // 当前登录用户
        // formConfig: {},
        currentUser: null,        // 当前登录用户
        formConfig: null,

        systemId: 'OA',     // 系统id，默认为OA
        apiPrefix: null,    // 默认为/api/eoagw/eoaflow/flowCommon/flowApi
        customActions: null,    // 外部自定义的操作方法，将会覆盖内部的同名方法

        serialNumProps: {style: {display: 'none'}}, // 08-28 会上蒋老师说隐藏流水号显示
        opinionListProps: {bordered: true}, // 传给意见域组件的属性
    };

    dispatcher = null;

    constructor(props) {
        super(props);
        const {systemId} = props;
        linkInterceptor.setSystemId(systemId);

        const { flowVer, piid, tiid } = utils.getPageQuery();
        const flowCode = this.getFlowCode(props);

        this.dispatcher = new Dispatcher(
            this.getFlowState,
            this.setFlowState,
            this.setFlowStateSilence,
            this.onDispatchError,
            this.onBeforeDispatch,
            this.onAfterDispatch,
        );
        window.flowDispatcher = this.dispatcher;

        const {
            routerPrefix,
            currentUser,
            formConfig,
            apiPrefix,
        } = props;

        const flowProps = _.pick(props, Object.keys(LinkFlowPrint.defaultProps));

        if (apiPrefix) {
            linkRequest.prefix = apiPrefix;
        }

        const isBeforeDraft = !piid;

        this.state = {

            // 外部传入的属性
            systemId,
            routerPrefix,   // 流程页面路由前缀地址，根据前缀地址来确定flowType
            currentUser: {  // 当前登录人信息
                userCode: '',
                userName: '',
                orgCode: '',
                orgName: '',
                ...currentUser,
            },     // 当前登录用户
            formConfig,       // TODO: 动态表单的表单配置

            // 初始化状态相关属性
            isBeforeDraft, // 是否起草，没有传入piid的认定为起草
            isLogin: false, // 是否已登录，TODO: 暂时没有做判断
            isInit: false,  // 是否已初始化好流程信息，执行了getFlowTemplateInfo或getAllByPiid后设置为true

            // 来源地址栏的属性
            flowCode,   // 流程类型，从页面地址中截取
            flowVer,    // 流程类型版本，可从页面传参，默认为1，通过piid查询实例后覆盖
            piid,           // 流程实例id，页面传参
            tiid,           // 当前任务id，页面传参

            // 来源于fetchFlowTemplateInfo的属性
            template: {},   // 流程模板信息，通过FlowCode获取
            buttonList: [], // 操作按钮配置
            title: '',    // 流程标题，来源于flowTemplateInfo.templateName

            // 表单相关
            isEdit: !piid,       // 是否允许当前用户编辑表单，初始值取决于是否有piid，后续由表单控制
            formRef: React.createRef(),      // LinkFlowForm的ref实例 check getValue setValue submit
            editorRef: React.createRef(),   // 正文控件
            editorArg: {},      // 正文编辑框属性
            todoTitle: '待办标题',  // 待办标题
            groupFlag: null,

            contentType: "print",   // 当前控件类型，用于内部控件根据不同方式控制自己

            taskSelectModalVisible: false,  // 任务选择弹窗
            curTaskLoaded: false,           // 是否已加载任务
            // 当前加载的任务，从instFlowCurrentPersonList中选择，匹配顺序为待办-待阅-已办，如存在多条时让用户选择
            curTask: null,  // 包含tiid、环节信息、处理人信息等等
            personType: !piid ? '0' : '2', // 人员任务类型 0-起草，1-待办，2-已办，3-待阅，4-已阅  初始时根据是否传入piid判断，传入则为起草，否则为已办

            // 当前环节信息，从curTask中获取
            curNode: null,
            // {
            //     nodeName: '',
            //     nodeCode: '',
            // },

            // 意见填写配置
            opinionConfig: {
                allowWrite: 1,  // 是否允许填写意见 1-可选 2-必填 3-不可填
                useOpinionDefId: null,  // 本环节使用的意见域
                useOpinionDefName: null,
                viewOpinionDefId: null, // 本环节显示的意见域,逗号分隔
                viewOpinionDefName: null,
                opinionSaveType: 3, // 意见保存方式 1-当前环节覆盖 2-当前任务覆盖 3-总是追加
                showDecisionOpinion: 0, // 结论性意见是否显示
                useDecisionOpinion: 0, // 结论性意见是否使用 0-否 1-是
            },
            decisionOpinionList: [],    // 结论性意见列表

            userOpinionList: [],        // 常用意见(含流程及用户自定义配置)
            userSelfOpinionList: [],    // 用户自己的常用意见

            // 当前环节展示的操作按钮列表
            operators: [],
            // 全局操作按钮配置列表
            operatorConfigs: [],    // TODO: 没有全部用上，只使用了操作标识

            // 意见域相关
            showOpinionList: false, // 是否显示意见域
            opinionList: [],        // 审批意见列表，及审批意见配置列表
            originOpinionList: [],  // 审批意见源数据

            // 当前环节可选路径列表
            nextPathList: [],
            pathConfig: { min: 0, max: 0 },   // 路径选择限制，0为不限制

            // 路径选择相关
            selectFlag: null,       // 路径选择限制，1-单选，其他-多选
            selectedPathIds: [],    // 被选中的环节id
            selectedPathNames: [],  // 被选中的环节的名称数组
            selectedPaths: [],      // 被选中的所有子环节
            groupSelectId: null,    // 如选择合并路径时，记录该合并路径的id，在completeTask时传参

            // 后继节点处理人相关
            nodesHandlerTree: {},   // 后继节点可选处理人的树
            nodesHandlers: {},      // 后继节点可选处理人
            nodeChooseTypes: {},    // 后继节点处理人的选择限制 0-单选 1-多选 2-全选

            // 被选中的后继节点处理人
            selectedNodesHandlerIds: {},
            selectedNodesHandlers: {},


            // 页签相关
            selectedTabId: 'form', // 当前选择的分页，form-申请单 richText-正文 attachment-附件

            // 审批意见弹窗
            opinionModalVisible: false,
            opinionModalData: {
                decision: '',
                option: '',
            },
            submitAfterOpinion: false,  // 保存审批意见之后是否执行提交

            // 流程跟踪弹窗显隐
            flowTrackModalVisible: false,

            // 帮助弹窗显隐
            helpModalVisible: false,

            // 正文历史版本弹窗显隐
            versionHisVisible: false,

            // 附件上传弹窗的显隐
            attachmentModalVisible: false,

            // 错误报告弹窗显隐
            errorReportModalVisible: false,

            // 错误报告预览内容
            errorReportMsg: "",

            // 选择路径弹窗
            pathSelectModalVisible: false,

            // 选择处理人弹窗
            handlerSelectModalVisible: false,

            // 退回确认弹窗
            sendBackConfirmModalVisible: false,

            // 提交确认弹窗
            submitConfirmModalVisible: false,

            // 填写反馈弹窗
            feedbackModalVisible: false,

            // 文件作废弹窗
            fileDeleteModalVisible: false,

            ////////////////////////
            // 来源于getAllByPiid接口的属性
            authStatus: false,          // 授权查询，为false时无影响，为true时表示非本人但有授权关系，instFlowCurrentPersonList会返回符合授权关系所有单子（包括，待办，已办，待阅，已阅，不包括草稿状态的）
            processObject: {},
            drafterInfo: {},            // 起草人信息，包含userCode、userName
            instFlowTodoPersonList: [], // 当前流程实例的当前所有待办信息
            instFlowCurrentPersonList: [], // 当前用户在当前实例的所有任务，包括待办、待阅、已阅

            // 其他来源的属性
            serialNum: null,              // 流程流水号，发起之后才有
            applyTitle: '',             // 待办标题，来源于processObject.process.applyTitle

            // 审批意见列表相关
            approvalProgressList: [],       // 审批进度列表

            reportErrorModalVisible: false, // 错误报告弹窗显隐

            showRichText: true,    // 是否显示正文
            // 附件页签相关
            showAttachmentTab: true,    // 是否显示附件页签
            fileTotal: 0,       // 附件域的总文件数
            fileList: [],       // 附件域的文件列表
            filePagination: {   // 附件域的分页属性
                current: 1,
                pageSize: 10,
            },
            fileTypeWhiteList: [ 'xls', 'xlsx','jpg', 'gif', 'png', 'txt', 'doc', 'docx','ppt', 'pptx', 'pdf', 'zip', 'rar', 'tif','mp3',],  // 附件域上传文件白名单，TODO 改为实时获取

            showAttachmentView: true, // 显示附件tabs页中的我的附件card
            showAttachmentUpload: true, // 显示附件tabs页中的我的上传card
            attachmentPer: {},  // 附件域权限配置
            attachmentList: [], // 附件列表
            uploadFileList: [], // 上传附件基本信息
            attachmentTypeList: [], // 附件类型列表
            attachmentSortList:[], //全部附件类型的顺序

            ////////////////////////////////////

            // 其他属性
            flowProps,      // 外部传入的属性
            loadings: {},    // 放置各种action的状态
            dispatch: this.dispatch,
            setState: this.dispatcher.setState,
            setStateSilence: this.dispatcher.setStateSilence,
            registerAction: this.dispatcher.registerAction,
            flowDispatcher: this.dispatcher,
            flowTrackList: [], // 流程跟踪列表数据
        };
    }

    getFlowCode(props) {
        const { routerPrefix } = props || this.props;
        const re = pathToRegexp(`${routerPrefix}/:flowCode`);
        const result = re.exec(window.location.pathname);
        return Array.isArray(result) && result.length > 1 ? result[1] : null;
    }

    dispatch = (action) => {
        const promise = this.dispatcher.dispatch(action);
        return promise;
    };

    getFlowState = (path) => {
        const flowState = this.state;
        if (!path) return flowState;
        return _.get(flowState, path);
    }

    setFlowState = (newFlowState) => {
        // const _this = this;
        // return new Promise((res, rej) => {
        //     _this.setState(newFlowState, () => res(newFlowState));
        // });
        this.setState(newFlowState);
        return newFlowState;
    }

    setFlowStateSilence = (newFlowState) => {
        if (typeof newFlowState === 'function') {
            newFlowState = newFlowState(this.state);
        }
        if (typeof newFlowState === 'object') {
            Object.keys(newFlowState).forEach(key => {
                this.state[key] = newFlowState[key];
            });
        }
        return newFlowState;
    }

    onDispatchError = (error, type, payload) => {
        console.error('onDispatchError of type =', type, error);
    }

    onBeforeDispatch = (...props) => {
        const {[FlowEvent.onBeforeDispatch]: onBeforeDispatch} = this.props;
        if(typeof onBeforeDispatch === 'function') return onBeforeDispatch(...props);
    }

    onAfterDispatch = (...props) => {
        const {[FlowEvent.onAfterDispatch]: onAfterDispatch} = this.props;
        if(typeof onAfterDispatch === 'function') return onAfterDispatch(...props);
    }

    render() {
        const { children } = this.props;
        let { className } = this.props;
        className = (className || "") +  " print";
        return (
            <LinkFlowContext.Provider
                value={this.state}
            >
                <LinkFlowContentPrint className={className}>
                    {children}
                </LinkFlowContentPrint>
            </LinkFlowContext.Provider>
        );
    }
}

export default LinkFlowPrint;
