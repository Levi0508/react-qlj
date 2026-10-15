import utils from '../utils';

let systemId = "EOA";

function setSystemId(id) {
    systemId = id;
}

function getSystemId() {
    return systemId;
}

const systemIdInterceptor = (url, options) => {
    const parsedOptions = options;

    let { headers } = parsedOptions;
    if (!headers) headers = {};
    headers['x-flow-systemId'] = getSystemId();
    const { signature } = utils.getPageQuery();
    if(signature) {
        headers['x-flow-signature'] = signature;
    }

    parsedOptions.headers = headers;

    return {
        url,
        options: parsedOptions,
    };
};

export default {
    setSystemId,
    getSystemId,
    systemIdInterceptor,
};
