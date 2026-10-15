import React from 'react';
import {
    // Modal,
    Form,
    message,
    Input,
} from 'antd';

import Modal from '../../../components/DraggableModal';
import QueryOnePage from '../../../form/reactframework/QueryOnePage';

import '../../styles.less';

import { withFlowContext } from '../../LinkFlowContext';
import _ from 'lodash';

import utils from '../../../utils/utils';

class LinkFlowFormModal extends React.Component {

    state = {
        ref: null,
    }

    render() {
        const {
            customConfig,
            formRef,
            visible,
        } = this.props;

        if(!customConfig || !visible) return null;

        // 尝试处理自定义操作
        const {
            operType,   // 操作类型，0-弹窗 1-请求全连接接口 2-标准配置生成界面
            operValue,  // 操作值，类型为弹窗时，操作指是弹窗地址，标准配置是
        } = customConfig;

        if(operType !== 2 || !operValue) return null;

        const page = _.get(formRef, "current.state.page.page." + operValue, null);
        if(!page) return null;

        const title = _.get(page, 'window.title', <div />);

        const width = _.get(page, 'window.width', 776);
        const height = _.get(page, "window.height", null);

        const config = {
            visible : visible,
            destroyOnClose : true,
            title : title,
            width : width,
        };

        if(height) config.height = height;

        if(formRef && formRef.current)
            formRef.current.close = this.__handleCancel;

        let content = <QueryOnePage parent={formRef.current || null} page={page} onRef={this.__onRef} />

        return (
            <Modal
                {...config}
                centered
                className={utils.getClassName('modal', this.props)}
                onCancel={this.__handleCancel}
                onOk={this.__handleOk}
            >
                {content}
            </Modal>
        );
    }

    __onRef = (ref) => {
        this.state.ref = ref;
    }

    __handleCancel = () => {
        if(this.props.handleClose) this.props.handleClose(false);
    }

    __handleOk = (e) => {
        const {
            ref,
        } = this.state;

        if (ref && ref.form && ref.form.callSync) {
            try{
                ref.form.callSync.call(ref.form, "submit")
                .then(() => {
                    if(this.props.handleClose) this.props.handleClose(false);
                })
                .catch(() => {
                });
            } catch(ex) { console.log(ex); }
        }
    }
}

export default LinkFlowFormModal;
