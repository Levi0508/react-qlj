package com.gtja.dts.oaflow.utils;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.util.DigestUtils;
import org.springframework.util.StringUtils;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static com.gtja.dts.oaflow.models.FlowConstant.*;

/**
 * @author wxx
 * @date 2023-04-18 16:14
 */
public class SendKafkaUtils {

    public static String getKafkaRecord(String nodeCode, String clientId, String piid, String tiid,
                                        String msgType, String opinion) {
        String uuid = UUID.randomUUID().toString();
        LocalDateTime dt = LocalDateTime.now();
        String sendDate = dt.format(DateTimeFormatter.BASIC_ISO_DATE);
        String sendTime = dt.format(DateTimeFormatter.ofPattern("HHmmss"));
        String clientidPiid = clientId + piid;
        String msgId = DigestUtils.md5DigestAsHex(clientidPiid.getBytes());
        JsonObject kafkaData = new JsonObject();
        kafkaData.addProperty("MSG_ID", uuid);
        kafkaData.addProperty("MSG_TYPE", msgType);
        kafkaData.addProperty("MSG_SUB_TYPE", msgType+"_SEND_MSG");
        kafkaData.addProperty("SRC", "");
        kafkaData.addProperty("SEND_TIME", sendTime);
        kafkaData.addProperty("SEND_DATE", sendDate);

        JsonObject baseInfo = new JsonObject();
        baseInfo.addProperty("piid", piid);
        baseInfo.addProperty("tiid", tiid);
        baseInfo.addProperty("userId", FLOW_CMP_USER_ID);
        baseInfo.addProperty("nodeCode", nodeCode);
        baseInfo.addProperty("msgId", msgId);
        baseInfo.addProperty("type", "COMMON_NODE_JUMP");

        JsonObject content = new JsonObject();
        content.add("baseInfo", baseInfo);
        if(!StringUtils.isEmpty(opinion)){
            JsonObject opinionInfo = new JsonObject();
            opinionInfo.addProperty("opnContent",opinion);
            content.add("opinionInfo",opinionInfo);
        }
        kafkaData.add("CONTENT", content);

        return kafkaData.toString();
    }

    public static HttpHeaders getFlowHeader(String systemId, String logId, String userId, String userName) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        //所属系统号，不能为空
        headers.set("x-flow-systemId", systemId);
        //日志id,guid,用于日志跟踪，可为空
        headers.set("x-logId", logId);
        //起草人工号，不能为空
        headers.set("x-userId", userId);
        //起草人姓名，不能为空，UTF-8格式中文姓名，url编码后传递
        headers.set("x-userName", userName);
        return headers;
    }

    public static JsonObject getFlowParams(String flowCode, String systemId, String todoTitle,
                                           String applyTable, String udf1, String udf2,
                                           JsonObject formData) {
        JsonObject param = new JsonObject();
        //文种编码
        param.addProperty("flowCode", flowCode);
        //系统编码
        param.addProperty("systemId", systemId);
        //起草标题，如果不传，默认标题为流程
        param.addProperty("todoTitle", todoTitle);
        //流程主表单
        param.addProperty("applyTable", applyTable);
        param.addProperty("udf1", udf1);
        param.addProperty("udf2", udf2);
        //起草部门代码，为空，默取EHR部门
        param.addProperty("draftDeptCode", formData.get("DEPT_ID").getAsString());
        //起草部门名称，为空，默认取EHR部门
        param.addProperty("draftDeptName", formData.get("DEPT_NAME").getAsString());
        //表单初始化数据，object对象，如果不传，则只起草流程，不初始化表单数据，只支持主表表单数据填充，可为空，表示无需更新表单
        //字段名必须与具体的流程表单字段名一致，并且起草环节有编辑权限的字段才支持更新
        param.add("formData", formData);
        //附件初始化数，数组对象，附件可为空，如果不为空，需要先上传ftp，然后提供附件名，及具体路径信息
        // param.add("fileList", fileList);
        JsonObject jsonParam = new JsonObject();
        jsonParam.add("Param", param);
        //起草流程 功能号
        jsonParam.addProperty("Type", "FLOW_CREATE_I0001");

        return jsonParam;
    }

    public static JsonObject getFlowParamsOfZgs(String flowCode, String systemId, String todoTitle,
                                           String applyTable, String udf1, String udf2,
                                           JsonObject formData) {
        JsonObject param = new JsonObject();
        //文种编码
        param.addProperty("flowCode", flowCode);
        //系统编码
        param.addProperty("systemId", systemId);
        //起草标题，如果不传，默认标题为流程
        param.addProperty("todoTitle", todoTitle);
        //流程主表单
        param.addProperty("applyTable", applyTable);
        param.addProperty("udf1", udf1);
        param.addProperty("udf2", udf2);
        //起草部门代码，为空，默取EHR部门
        param.addProperty("draftDeptCode", formData.get("DRAFT_DEPT_CODE").getAsString());
        //起草部门名称，为空，默认取EHR部门
        param.addProperty("draftDeptName", formData.get("DRAFT_DEPT_NAME").getAsString());
        //表单初始化数据，object对象，如果不传，则只起草流程，不初始化表单数据，只支持主表表单数据填充，可为空，表示无需更新表单
        //字段名必须与具体的流程表单字段名一致，并且起草环节有编辑权限的字段才支持更新
        param.add("formData", formData);
        //附件初始化数，数组对象，附件可为空，如果不为空，需要先上传ftp，然后提供附件名，及具体路径信息
        // param.add("fileList", fileList);
        JsonObject jsonParam = new JsonObject();
        jsonParam.add("Param", param);
        //起草流程 功能号
        jsonParam.addProperty("Type", "FLOW_CREATE_I0001");

        return jsonParam;
    }

    public static Map<String,String> getSubmitBodyParams(String flowCode, String applyTitle, String todoTitle,
                                                         String applyTable, JsonObject formData, String flowVer, String candidates) {
        Map<String, String> param = new HashMap<>(10);

        //文种编码
        param.put("flowCode", flowCode);
        //起草标题，如果不传，默认标题为流程
        param.put("todoTitle", todoTitle);
        //流程主表单
        param.put("applyTable", applyTable);
        //模板名称
        param.put("templateName", applyTitle);
        //模板名称
        param.put("flowVer", flowVer);
        //节点名称
        param.put("nodeCode", FLOW_CMP_ZQPLDYJ_NODE_CODE);
        //候选人，逗号分隔
        param.put("candidates", candidates);
        //字段名必须与具体的流程表单字段名一致，并且起草环节有编辑权限的字段才支持更新
        param.put("formData", formData.toString());

        return param;
    }

    public static Map<String,String> submitHeader(String systemId, String userId, String userName) {
        Map<String, String> headers = new HashMap<>(5);
        //所属系统号，不能为空
        headers.put("x-flow-systemId", systemId);
        //起草人工号，不能为空
        headers.put("x-userId", userId);
        //起草人姓名，不能为空，UTF-8格式中文姓名，url编码后传递
        try {
            headers.put("x-userName", URLEncoder.encode(userName,"UTF-8"));
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        return headers;
    }
}
