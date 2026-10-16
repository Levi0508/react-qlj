package com.gtja.dts.oaflow.service.thfxq;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.gtja.dts.common.exception.BusinessException;
import com.gtja.flow.helper.domain.Candidate;
import com.gtja.flow.helper.service.AutoFlowService;
import com.gtja.flow.helper.service.CandidateService;
import com.gtja.flow.helper.service.CustomFlowHandlerService;

import java.io.IOException;
import java.net.InetAddress;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import lombok.extern.log4j.Log4j2;
import okhttp3.FormBody;
import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

@Service
@Primary
public class AutoFlowSelfServiceImpl implements AutoFlowService {
    private static final Logger log = LoggerFactory.getLogger(com.gtja.flow.helper.service.impl.AutoFlowServiceImpl.class);
    @Value("${server.address:null}")
    private String address;
    @Value("${server.port: 80}")
    private String port;
    @Value("${server.servlet.context-path}")
    private String contextPath;
    @Autowired(required = false)
    private CandidateService candidateService;
    @Autowired
    private CustomFlowHandlerService customFlowHandlerService;

    public JSONObject submit(Map<String, String> header, Map<String, String> param, Map<String, String> body) throws IOException {
        OkHttpClient okHttpClient = (new OkHttpClient()).newBuilder().retryOnConnectionFailure(false).readTimeout(3000L, TimeUnit.SECONDS).addInterceptor(new com.gtja.flow.helper.service.impl.AutoFlowServiceImpl.HeaderIntercepter(header)).build();
        Map<String, String> flowVariable = new HashMap();
        Assert.notNull(body.get("flowCode"), "流程模板编号，必填");
        flowVariable.put("flowCode", (String) body.get("flowCode"));
        Assert.notNull(body.get("applyTable"), "表单名，必填");
        flowVariable.put("applyTable", (String) body.get("applyTable"));
        flowVariable.put("flowVer", (String) body.get("flowVer"));
        flowVariable.put("nodeCode", (String) body.get("nodeCode"));
        flowVariable.put("candidates", (String) body.get("candidates"));
        this.customFlowHandlerService.draftBefore(okHttpClient, body);
        Response draftResponse = this.draft(okHttpClient, body);
        this.customFlowHandlerService.draftAfter(okHttpClient, body, draftResponse);
        log.info("起草返回值：{}", draftResponse);
        if (draftResponse.code() != 200) {
            log.info("起草失败,判断CODE,draftResponse：{}", JSONObject.toJSON(draftResponse));
            throw new BusinessException("起草失败");
        } else {
            JSONObject jsonObject = JSONObject.parseObject(draftResponse.body().string());
            if (!"0".equals(jsonObject.getString("State"))) {
                log.info("起草失败,判断状态,jsonObject：{}", jsonObject);
                throw new BusinessException("起草失败");
            } else {
                JSONObject data = jsonObject.getJSONObject("Data");
                String piid = data.getString("piid");
                flowVariable.put("piid", piid);
                String tiid = data.getJSONArray("instFlowPersonList").getJSONObject(0).getString("tiid");
                flowVariable.put("tiid", tiid);
                flowVariable.put("groupFlag", (String) body.get("applyTable"));
                flowVariable.put("todoTitle", (String) body.get("todoTitle"));
                String formData = (String) body.get("formData");
                formData = this.customFlowHandlerService.saveAndVerifyBefore(okHttpClient, formData, flowVariable);
                Response saveAndVerifyResponse = this.saveAndVerify(okHttpClient, formData, flowVariable);
                this.customFlowHandlerService.saveAndVerifyAfter(okHttpClient, formData, flowVariable, saveAndVerifyResponse);
                if (saveAndVerifyResponse.code() != 200) {

                    throw new BusinessException("保存并校验失败");
                } else {
                    jsonObject = JSONObject.parseObject(saveAndVerifyResponse.body().string());
                    if (!"0".equals(jsonObject.getString("State"))) {
                        throw new BusinessException("保存并校验失败");
                    } else {
                        this.customFlowHandlerService.queryFlowPathBefore(okHttpClient, flowVariable);
                        Response flowPathResponse = this.queryFlowPath(okHttpClient, flowVariable);
                        this.customFlowHandlerService.queryFlowPathAfter(okHttpClient, flowVariable, flowPathResponse);
                        if (flowPathResponse.code() != 200) {
                            throw new BusinessException("查询流程节点失败");
                        } else {
                            jsonObject = JSONObject.parseObject(flowPathResponse.body().string());
                            if (!"0".equals(jsonObject.getString("State"))) {
                                throw new BusinessException("查询流程节点失败");
                            } else {
                                JSONArray completeTaskPathList = jsonObject.getJSONObject("Data").getJSONArray("pathSelectEntityList");
                                JSONObject pathSelect = completeTaskPathList.getJSONObject(0);
                                this.customFlowHandlerService.completeBefore(okHttpClient, flowVariable, pathSelect, completeTaskPathList);
                                Response completeResponse = this.complete(okHttpClient, flowVariable, pathSelect);
                                this.customFlowHandlerService.completeAfter(okHttpClient, flowVariable, pathSelect, completeTaskPathList, completeResponse);
                                if (completeResponse.code() != 200) {
                                    throw new BusinessException("提交节点失败");
                                } else {
                                    jsonObject = JSONObject.parseObject(completeResponse.body().string());
                                    if (!"0".equals(jsonObject.getString("State"))) {
                                        throw new BusinessException("提交节点失败");
                                    } else {
                                        return jsonObject;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    protected Response complete(OkHttpClient okHttpClient, Map<String, String> flowVariable, JSONObject pathSelect) throws IOException {
        JSONObject formDataJson = new JSONObject();
        formDataJson.put("piid", flowVariable.get("piid"));
        formDataJson.put("tiid", flowVariable.get("tiid"));
        formDataJson.put("todoTitle", flowVariable.get("todoTitle"));
        formDataJson.put("instancyLv", "0");
        formDataJson.put("secrecyLv", "0");
        JSONObject completeTaskPathList = pathSelect.getJSONObject("simpleEntity");
        if (this.candidateService == null) {
            throw new BusinessException("请开发人员实现候选人查询接口");
        } else {
            List<Candidate> candidates = this.candidateService.list((String) flowVariable.get("candidates"));
            if (candidates != null && !candidates.isEmpty()) {
                completeTaskPathList.put("handlerInfoList", candidates);
                formDataJson.put("completeTaskPathList", completeTaskPathList);
                log.info("提交数据{}", formDataJson.toJSONString());
                JSONObject formData = new JSONObject();
                formData.put("Param", formDataJson.toJSONString());
                formData.put("Type", "FLOW_MAIN_I0003");
                FormBody formBody = (new FormBody.Builder()).add("data", formData.toJSONString()).build();
                if (StringUtils.isBlank(this.address) || "null".equals(this.address.trim())) {
                    this.address = InetAddress.getLocalHost().getHostAddress();
                }

                Request saveRequest = (new Request.Builder()).url("http://" + this.address + ":" + this.port + this.contextPath + "/flowCommon/flowApi?FLOW_MAIN_I0003&funcId=FLOW_MAIN_I0003").post(formBody).build();
                return okHttpClient.newCall(saveRequest).execute();
            } else {
                throw new BusinessException("候选人不能为空");
            }
        }
    }

    protected Response queryFlowPath(OkHttpClient okHttpClient, Map<String, String> flowVariable) throws IOException {
        JSONObject formDataJson = new JSONObject();
        formDataJson.put("flowCode", flowVariable.get("flowCode"));
        formDataJson.put("piid", flowVariable.get("piid"));
        formDataJson.put("tiid", flowVariable.get("tiid"));
        formDataJson.put("groupFlag", flowVariable.get("groupFlag"));
        formDataJson.put("flowVer", flowVariable.get("flowVer"));
        formDataJson.put("nodeCode", flowVariable.get("nodeCode"));
        JSONObject formData = new JSONObject();
        formData.put("Param", formDataJson.toJSONString());
        formData.put("Type", "FLOW_MAIN_Q0002");
        FormBody formBody = (new FormBody.Builder()).add("data", formData.toJSONString()).build();
        if (StringUtils.isBlank(this.address) || "null".equals(this.address)) {
            this.address = InetAddress.getLocalHost().getHostAddress();
        }

        Request saveRequest = (new Request.Builder()).url("http://" + this.address + ":" + this.port + this.contextPath + "/flowCommon/flowApi?FLOW_MAIN_Q0002&funcId=FLOW_MAIN_Q0002").post(formBody).build();
        return okHttpClient.newCall(saveRequest).execute();
    }

    protected Response saveAndVerify(OkHttpClient okHttpClient, String formDataStr, Map<String, String> flowVariable) throws IOException {
        JSONObject formDataJson = JSONObject.parseObject(formDataStr);
        formDataJson.put("piid", flowVariable.get("piid"));
        formDataJson.put("tiid", flowVariable.get("tiid"));
        formDataJson.put("groupFlag", flowVariable.get("groupFlag"));
        formDataJson.put("SYS_GUID", flowVariable.get("sysGuid"));
        formDataJson.put("todoTitle", flowVariable.get("todoTitle"));
        JSONObject formData = new JSONObject();
        formData.put("Param", formDataJson.toJSONString());
        formData.put("Type", "FLOW_MAINFORM_U0007");
        FormBody formBody = (new FormBody.Builder()).add("data", formData.toJSONString()).build();
        if (StringUtils.isBlank(this.address) || "null".equals(this.address)) {
            this.address = InetAddress.getLocalHost().getHostAddress();
        }

        Request saveRequest = (new Request.Builder()).url("http://" + this.address + ":" + this.port + this.contextPath + "/flowCommon/flowApi?FLOW_MAINFORM_U0007&funcId=FLOW_MAINFORM_U0007").post(formBody).build();
        return okHttpClient.newCall(saveRequest).execute();
    }

    protected Response draft(OkHttpClient okHttpClient, Map<String, String> body) throws IOException {
        JSONObject formDataJson = new JSONObject();
        formDataJson.put("flowCode", body.get("flowCode"));
        formDataJson.put("applyTable", body.get("applyTable"));
        formDataJson.put("todoTitle", body.get("todoTitle"));
        formDataJson.put("udf1", body.get("templateName"));
        formDataJson.put("udf2", "0");
        formDataJson.put("draftDeptCode", "");
        formDataJson.put("draftDeptName", "");
        JSONObject formData = new JSONObject();
        formData.put("Param", formDataJson.toJSONString());
        formData.put("Type", "FLOW_MAIN_I0001");
        FormBody formBody = (new FormBody.Builder()).add("data", formData.toJSONString()).build();
        if (StringUtils.isBlank(this.address) || "null".equals(this.address)) {
            this.address = InetAddress.getLocalHost().getHostAddress();
        }

        Request draftRequest = (new Request.Builder()).url("http://" + this.address + ":" + this.port + this.contextPath + "/flowCommon/flowApi?FLOW_MAIN_I0001&funcId=FLOW_MAIN_I0001").post(formBody).build();
        log.info("请求入参:{},参数：{}", draftRequest, JSONObject.toJSON(formBody));
        return okHttpClient.newCall(draftRequest).execute();
    }

    public static class HeaderIntercepter implements Interceptor {
        private Map<String, String> headers;

        public HeaderIntercepter(Map<String, String> headers) {
            this.headers = headers;
        }

        public Response intercept(Interceptor.Chain chain) throws IOException {
            Request originalRequest = chain.request();
            Request.Builder builder = originalRequest.newBuilder();

            for (Map.Entry<String, String> entry : this.headers.entrySet()) {
                builder.addHeader((String) entry.getKey(), (String) entry.getValue());
            }

            Request request = builder.build();
            return chain.proceed(request);
        }
    }
}
