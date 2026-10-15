import qs from 'querystring';
import request from './request';

const linkRequest = (funcId, params, prefix, Page, ColOrder, requestType, options) => {
    prefix = (prefix || linkRequest.prefix) + ((prefix || linkRequest.prefix).indexOf('?') >= 0 ? '&' : '?') + funcId + '&funcId=' + funcId;
    if (requestType === 'GET') {
        return request.get(prefix, {
            params: params,
        }).then(res => {
            if (typeof res === 'object') {
                res.success = res.state === 0 || res.State === 0;
            }
            return res;
        });
    } else if (requestType === 'PUT') {
        return request.put(prefix, {
            data: params,
        }).then(res => {
            if (typeof res === 'object') {
                res.success = res.state === 0 || res.State === 0;
            }
            return res;
        });
    }
    if (options) {
        return request.post(prefix, options).then(res => {
            if (typeof res === 'object') {
                res.success = res.state === 0 || res.State === 0;
            }
            return res;
        })
    }
    return request.post(prefix, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: qs.stringify({
            data: JSON.stringify({
                Param: JSON.stringify(params),
                Type: funcId,
                Page,
                ColOrder,
            }),
        }),
    }).then(res => {
        if (typeof res === 'object') {
            res.success = res.state === 0 || res.State === 0;
        }
        return res;
    });
};

linkRequest.prefix = '/api/eoagw/eoaflow/flowCommon/flowApi';
window.linkRequest = linkRequest;
export default linkRequest;
