import * as originGtjaLinkWeb from '@/components/sdkGtjaLinkWeb';

/**
 * 用于兼容本地直接使用了gtjaLinkWeb代码的开发模式
 * 如需使用本地的gtjaLinkWeb，请在import 'ibflowform' 之前请调用如下代码
 * import * as gtjaLinkWeb from '你的gtjaLinkWeb路径';
 * window.gtjaLinkWeb = gtjaLinkWeb;
 */

const {
    LinkFlow,
    LinkFlowPrint,
    LinkFlowDevop,

    LinkFlowForm,
    formStyles,

    components,
    services,
    utils,
} = window.gtjaLinkWeb || originGtjaLinkWeb;

export {
    LinkFlow,
    LinkFlowPrint,
    LinkFlowDevop,

    LinkFlowForm,
    formStyles,

    components,
    services,
    utils,
};
