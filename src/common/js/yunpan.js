

/**
 * 获取网盘用户信息
 */
 import { request } from 'ice';
 const yunpanLogin = async () => {
    //TODO
    //判定是否没值 X-LENOVO-SESS-ID
   const flag = document.cookie.indexOf("X-LENOVO-SESS-ID=");
   if(flag == -1) {
       const wpUserInfo = await request({
           url: '/custom-interfaces/user/login',
           instanceName: 'yunpan',
           method: 'post',
           params: {
               user_slug: 'gljy',
               password: '1qaz@WSX080831'
           }
       }); 
   }
}

/**
 * 附件上传网盘设置
 */
const yunpanUpdate = (response)=> {
    const body = response;
    let rs = [];
    const result = {};
    result['State'] = 0;
    result['ErrMsg'] = "附件上传成功";
    // result['DataDifferTime'] = "21";
    let rdata = {};
    let filename = body.path;
    filename = filename.substring(filename.lastIndexOf("/")+1)
    let fileType = body.mimeType;
    fileType = fileType.substring(fileType.lastIndexOf(".")+1);
    rdata['fileSize'] = body.bytes;
    rdata['filePath'] = '/yunpan/custom-interfaces/file/content/?path_type=ent&path=' + body.path ;
    rdata['FileName'] = filename;
    rdata['fileType'] = console;
    console.log(rdata);
    rs.push(rdata);
    result['Data'] = rs;
    console.log(result)
    return result;
}

/**
 * 附件上传路径设置
 */
const yunpanAction = (file,type) => {
    const actionPath = '/yunpan/custom-interfaces/file/content/?path=/gljy-oa-flow/' + type + '/'+ file.name + '&path_type=ent';
    console.log(actionPath)
    return actionPath;
}
const yunpan = () => {

}
yunpan.yunpanLogin = yunpanLogin
yunpan.yunpanUpdate = yunpanUpdate
yunpan.yunpanAction = yunpanAction
export default yunpan;