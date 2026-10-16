package com.gtja.dts.oaflow.config;

import cn.hutool.core.util.CharsetUtil;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.gtja.dts.common.exception.BusinessException;
import com.gtja.dts.common.utils.WebUtil;
import com.gtja.flow.helper.service.CustomFlowHandlerService;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * @author wxx
 * @date 2023-10-24 14:30
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CmpFlowHandlerServiceImpl implements CustomFlowHandlerService {


    @Value("${server.port:8080}")
    private String port;

    @Value("${server.servlet.context-path}")
    private String contextPath;

    @Value("${server.servlet.context-path}")
    private String getTokenApi;



    @Override
    public void draftBefore(OkHttpClient okHttpClient, Map<String, String> map) {

    }

    @Override
    public void draftAfter(OkHttpClient okHttpClient, Map<String, String> map, Response response) {

    }

    @SneakyThrows
    @Override
    public String saveAndVerifyBefore(OkHttpClient okHttpClient, String formDataStr, Map<String, String> flowVariable) {
        if (!"CMP000".equals(flowVariable.get("flowCode"))) {
            return formDataStr;
        }
//        String token = getToken(okHttpClient,formDataStr);
        String token = getWebToken();

        String localFileName = "资产托管部关联交易月度报送模板.xlsx";
        String localFileUrl = "D:\\zork\\TemporaryFile\\20231017\\关联交易月度报送模板V1.4\\";
        // 添加请求类型
        MultipartBody.Builder builder = new MultipartBody.Builder();
        builder.setType(Objects.requireNonNull(MediaType.parse("multipart/form-data")));
        File file = new File(localFileUrl+localFileName);
        // 追加表单信息
        builder.addFormDataPart("file", file.getName(), RequestBody.create(null, file));
        builder.addFormDataPart("type","FLOW_ATTACH_UPLOAD_U0001");
        builder.addFormDataPart("storeType","arch");
        builder.addFormDataPart("systemCode","CMP");
        builder.addFormDataPart("flowCode","CMP060");
        /**
         * 调用上传文件接口，获取文件信息
         */
        String url = "http://10.187.65.3:8099/open_api/fileHandle/uploadFile/gljy-oa-flow?access_token=" + token + "&fileName=" + URLEncoder.encode(localFileName, CharsetUtil.UTF_8);
        Request saveRequest = new Request.Builder()
                .url(url)
                .post(builder.build())
                .build();
        Response response = okHttpClient.newCall(saveRequest).execute();
        ResponseBody responseBody = response.body();
        assert responseBody != null;
        JSONObject jsonObject = JSONObject.parseObject(responseBody.string());
        JSONObject data = jsonObject.getJSONObject("data");
        String fileDisplayName = data.get("fileDisplayName").toString();
        String fileId = data.get("fileName").toString();
        String fileSize = data.get("fileSize").toString();


        Map<String, String> fileForm = new HashMap<>();
        /**
         * {
         * 	"businessCode": "",
         * 	"searchKey": "",
         * 	"fileName": "关联交易操作手册V1.1--user.pdf",
         * 	"fileType": "1--user",
         * 	"storeType": "arch",
         * 	"fileSize": 5408451,
         * 	"filepath": "/open_api/fileHandle/downloadFile/gljy-oa-flow?fileId=65047c51652b4ed9a4a08e8b88e53b99.1--user&fileName=关联交易操作手册V1.1--user.pdf",
         * 	"fileGroupFlag": "ptfjy",
         * 	"fileGroupDescription": "普通附件域",
         * 	"fileTypeCode": "ptfj"
         * }
         */
        String buckets = "gljy-oa-flow";
        String fileType = fileId.substring(fileId.lastIndexOf("."));
        String filepath = "/open_api/fileHandle/downloadFile/"+buckets+"?fileId="+fileId+"&fileName="+fileDisplayName;

        fileForm.put("businessCode", "");
        fileForm.put("searchKey", "");
        fileForm.put("storeType", "arch");
        fileForm.put("fileName", fileDisplayName);
        fileForm.put("fileType", fileType);
        fileForm.put("fileSize", fileSize);
        fileForm.put("filepath", filepath);
        fileForm.put("fileGroupFlag", "default");
        fileForm.put("fileGroupDescription", "附件");
        fileForm.put("fileTypeCode", "default");

        save(okHttpClient, flowVariable, fileForm);
        return formDataStr;
    }

    @Override
    public void saveAndVerifyAfter(OkHttpClient okHttpClient, String s, Map<String, String> map, Response response) {

    }

    @Override
    public void queryFlowPathBefore(OkHttpClient okHttpClient, Map<String, String> map) {

    }

    @Override
    public void queryFlowPathAfter(OkHttpClient okHttpClient, Map<String, String> map, Response response) {

    }

    @Override
    public void completeBefore(OkHttpClient okHttpClient, Map<String, String> map, JSONObject jsonObject, JSONArray jsonArray) {

    }

    @Override
    public void completeAfter(OkHttpClient okHttpClient, Map<String, String> map, JSONObject jsonObject, JSONArray jsonArray, Response response) {

    }

    public String getWebToken() {
        RequestAttributes requestAttributes = RequestContextHolder.currentRequestAttributes();
        //设置子线程共享
        RequestContextHolder.setRequestAttributes(requestAttributes,true);
        HttpServletRequest request = ((ServletRequestAttributes) requestAttributes).getRequest();
        String token = request.getHeader("Authorization");
        if (StringUtils.isNotBlank(token)) {
            String bearerToken = request.getHeader("Authorization");
            return bearerToken.substring(6).trim();
        }
        token = request.getParameter("access_token");
        if (StringUtils.isNotBlank(token)) {
            return token;
        }
        throw new BusinessException("token不存在！");
    }

    public String getToken(OkHttpClient okHttpClient, String formDataStr) throws IOException {
        // 添加请求类型
        MultipartBody.Builder builder = new MultipartBody.Builder();
        builder.setType(Objects.requireNonNull(MediaType.parse("multipart/form-data")));
        // 追加表单信息
        builder.addFormDataPart("client_id","97e2abcb0b02d763");
        builder.addFormDataPart("client_secret","14b8c37c4e1b4c6d83174ee1c6092d1d");
        builder.addFormDataPart("grant_type","'certificate'");
        builder.addFormDataPart("scope","read");
        builder.addFormDataPart("username","read");
        builder.addFormDataPart("certificate","1qaz@WSX080831");
        /**
         * 调用上传文件接口，获取文件信息
         */
        String url = "http://10.181.114.83:8002/oauth/token";
        Request saveRequest = new Request.Builder()
                .url(url)
                .post(builder.build())
                .build();
        Response response = okHttpClient.newCall(saveRequest).execute();
        ResponseBody responseBody = response.body();
        assert responseBody != null;
        JSONObject jsonObject = JSONObject.parseObject(responseBody.string());
        JSONObject data = jsonObject.getJSONObject("data");

        return data.get("access_token").toString();
    }

    public Response save(OkHttpClient okHttpClient, Map<String, String> flowVariable, Map<String, String> fileForm) throws IOException {
        // TODO Auto-generated method stub
        Map<String, Object> newForm = new HashMap<>();
        newForm.put("piid", flowVariable.get("piid"));
        newForm.put("tiid", flowVariable.get("tiid"));
        newForm.put("file", fileForm);
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("Param", newForm);
        jsonObject.put("Type", "FLOW_FILE_I0001");
        FormBody formBody = new FormBody.Builder()
                .add("data", jsonObject.toString())
                .build();
        /** 保存文件参数请求 */
        String address = "localhost";
        Request saveRequest = new Request.Builder()
                .url("http://"+ address +":"+ port + contextPath + "/flowCommon/flowApi?FLOW_MAINFORM_U0007&funcId=FLOW_MAINFORM_U0007")
                .post(formBody)
                .build();
        return okHttpClient.newCall(saveRequest).execute();
    }
}
