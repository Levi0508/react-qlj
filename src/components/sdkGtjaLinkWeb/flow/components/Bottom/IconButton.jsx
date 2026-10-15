import React from 'react';
import { Spin, Icon, Modal } from 'antd';

import { withFlowContext } from '../../LinkFlowContext';
import utils from '../../../utils/utils';
import './styles.less';
import LinkFlowFormModal from './LinkFlowFormModal';
const {confirm} = Modal;
const buttonActionMap = {
    close: 'clickClose',                // 关闭
    decision: 'clickDecision',          // 填写意见
    save: 'clickSave',                  // 保存
    submit: 'clickSubmit',              // 提交
    sendBack: 'clickSendBack',          // 退回
    distribute: 'clickDistribute',      // 下发
    attachment: 'clickAttachment',      // 附件
    flowTrack: 'clickFlowTrack',        // 流程跟踪
    flowChart: 'clickFlowChart',        // 流程图
    print: 'clickPrint',                // 打印
    feedback: 'toggleFeedbackModal',    // 填写反馈
    history: 'clickVersionHis',         // 历史版本(正文)
    fileTrack: 'clickFileTrack',        // 文件跟踪
    // sendBack: 'toggleSendBackModal',    // 退回
    delete: 'clickDelete',              // 文件作废
    errorReport: 'clickErrorReport',    // 错误报告
    help: 'clickHelp',                  // 帮助
    publish: 'clickPublish',            // 发布
    notice: 'clickNotice',              // 提醒
    fileCompare:'clickFileCompare',     //文件对比
}

class IconButton extends React.Component {

    static defaultProps = {
        operator: null,
    }

    state = {
        loading: false,
        modalVisible: false,
    }

    handleClick = (buttonConfig) => {
        const {
            operator,
            dispatch,
            formRef,
        } = this.props;
        const {
            custom,
            customConfig,
            operatorName,
        } = buttonConfig;

        if(customConfig) {
            // 尝试处理自定义操作
            const {
                operType,   // 操作类型，0-弹窗 1-请求全连接接口 2-配置文件的界面 3-配置文件的方法
                operValue,  // 操作值，类型为弹窗时，操作指是弹窗地址，标准配置是
            } = customConfig;
            if(operType === 0) {
                let reg = new RegExp("\{(form.\\w+)\}","g");
                let params = operValue.match(reg);
                let url = operValue;

                if(formRef && formRef.current && params && params.length > 0) {
                    const formValue = formRef.current.call("getValue");
                    params.forEach(param => {
                        url = url.replace(param, formValue[_.replace(_.trim(param, "{}"),"form.","")] || "");
                    });
                }

                reg = new RegExp("\{(\\w+)\}","g");
                params = operValue.match(reg);
                if(params && params.length > 0) {
                    params.forEach(param => {
                        url = url.replace(param, this.props[_.trim(param, "{}")] || "");
                    })
                }

                window.open(url);
                return;
            }
            if(operType === 1) {
                this.setState({loading: true});
                confirm({
                    title: operatorName,
                    content: `您确定要${operatorName}吗？`,
                    okText: '确认',
                    okType: 'danger',
                    cancelText: '取消',
                    onOk(e) {
                        dispatch({
                            type: 'sendLinkRequest',
                            payload: operValue,
                        })
                        .then((result) => {
                            if(result && result.success) window.location = window.location;
                        })
                        .catch(() => this.setState({loading: false}));
                        e();
                    },
                    onCancel:()=>{
                        this.setState({loading: false})
                    }
                   
                });
             
                return;
            }
            if(operType === 2) { // 弹出标准界面
                this.setState({modalVisible: true});
                return;
            }
            if(operType === 3) {
                if(formRef && formRef.current) {
                    const func = _.get(formRef.current, "state.page.functions." + operValue, null);
                    if(func !== null && _.isFunction(func)) {
                        func.call(formRef.current);
                    }
                }
            }
        }

        // 实现默认操作
        const action = custom || buttonActionMap[operator];
        if (typeof action === 'function') {
            action();
        } else if (typeof action === 'string' || (typeof action === 'object' && typeof action.type === 'string')) {
            dispatch(action);
        }
    }

    render() {
        const {
            operator,
            buttonList,
            loadings,
            formRef,
        } = this.props;
        let {
            loading,
            modalVisible,
        } = this.state;
        if (!operator) return null;
        const buttonConfig = buttonList.find(item => item.operatorFlag === operator);
        if (!buttonConfig) return null;
        const {
            operatorName,
            operatorFlag,
            icon,
            custom,
            customConfig,
        } = buttonConfig;
        const action = custom || buttonActionMap[operator];

        if(!loading) {
            if(typeof action === 'string') {
                loading = !!loadings[action];
            } else if(action && typeof action.type === 'string') {
                loading = !!loadings[action.type];
            }
        }

        return (
            <Spin spinning={loading} key={operatorFlag}>
                <div
                    className={utils.getClassName('iconButton', this.props)}
                    key={operatorFlag}
                    onClick={() => this.handleClick(buttonConfig)}
                >
                    <Icon type={icon} />
                    <span>
                        {operatorName}
                    </span>
                </div>
                <LinkFlowFormModal visible={modalVisible} customConfig={customConfig} formRef={formRef} handleClose={(flag) => {this.setState({modalVisible: flag})}}></LinkFlowFormModal>
            </Spin>
        );
    }
}

export default withFlowContext(IconButton, [
    'loadings',
    'buttonList',
    'formRef',
    'piid',
    'tiid',
]);
