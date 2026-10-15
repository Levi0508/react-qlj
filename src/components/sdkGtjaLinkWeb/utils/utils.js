import { parse } from 'qs';
import classnames from 'classnames';

import _ from 'lodash';

const utils = {

    PREFIX_CLS: 'gtja-link',

    getPrefixCls: (
        suffixCls,
        customizePrefixCls,
    ) => {
        if (customizePrefixCls) return customizePrefixCls;

        return suffixCls ? `${utils.PREFIX_CLS}-${suffixCls}` : utils.PREFIX_CLS;
    },

    getClassName: (suffixCls, props) => {
        const {className, prefixCls} = props || {};
        return classnames(utils.getPrefixCls(suffixCls, prefixCls), className);
    },

    /**
     * 获取url传参
     */
    getPageQuery: () => {
        return parse(window.location.href.split('?')[1]);
    },

    getCookie: (a) => {
        a = a.toLowerCase();
        for (var b = document.cookie.split(";"), e, c, g = 0; g < b.length; g++) {
            if (e = b[g].split("="), c = _.trim(e[0]), c === a)
                return decodeURIComponent(1 < e.length ? e[1] : "");
        }
        return null
    },
    setCookie: (a, b) => {
        document.cookie = encodeURIComponent(a) + "=" + encodeURIComponent(b) + ";path=/"
    },
};

export default utils;
