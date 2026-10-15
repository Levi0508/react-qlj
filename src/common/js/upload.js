import store from '@/store';

/**
 * 获取网盘用户信息
 */
import { request } from 'ice';
import common from './common';

const yunpanLogin = async () => {
    //TODO
    //判定是否没值 X-LENOVO-SESS-ID
    const flag = document.cookie.indexOf("X-LENOVO-SESS-ID=");
    if (flag == -1) {
        const wpUserInfo = await request({
            url: '/custom-interfaces/user/login',
            instanceName: 'yunpan',
            method: 'post',
            params: {
                user_slug: 'cbms',
                password: 'cbms@990818'
            }
        });
    }
}

/**
* 附件上传网盘设置
*/
const fileUpdate = (response, flowCode) => {
    const body = response.data;
    let rs = [];
    const result = {};
    result['State'] = 0;
    result['ErrMsg'] = "附件上传成功";
    // result['DataDifferTime'] = "21";
    let rdata = {};
    let filename = body.fileName;
    const userInfo = store.getModelState('user');
    const params = new URLSearchParams();
    params.append('fileId', body.fileName);
    params.append('fileName', body.fileDisplayName);
    params.append('uploadUser', userInfo.userId);
    params.append('bucket', 'gljy-oa-flow');
    params.append('piid', sessionStorage.getItem("piid"));
    params.append('systemId', 'IBCM');
    params.append('flowCode', flowCode);

    const fileInfoSave = request({
        url: '/flowDocGljyFileInfo/createFile',
        method: 'post',
        data: params
    });

    filename = filename.substring(filename.lastIndexOf("/") + 1)
    let fileType = filename.substring(filename.lastIndexOf(".") + 1)
    rdata['fileSize'] = body.fileSize;
    let host = window.location.host

    rdata['filePath'] = '/open_api/fileHandle/downloadFile/gljy-oa-flow?fileId=' + filename + '&fileName=' + body.fileDisplayName;
    rdata['FileName'] = body.fileDisplayName;
    rdata['fileType'] = fileType;
    rs.push(rdata);
    result['Data'] = rs;
    return result;
}

/**
* 附件上传路径设置
*/
const fileAction = (file) => {
    //const actionPath = '/open_api/fileUpload/uploadFile/cbms-file?access_token='+ getToken('access_token') + '&fileName='+ file.name;
    const actionPath = '/open_api/fileHandle/uploadFile/gljy-oa-flow?access_token=' + sessionStorage.getItem("token") + '&fileName=' + file.name;
    return actionPath;
}
const upLoad = () => {

}
upLoad.fileUpdate = fileUpdate
upLoad.fileAction = fileAction
export default upLoad;
