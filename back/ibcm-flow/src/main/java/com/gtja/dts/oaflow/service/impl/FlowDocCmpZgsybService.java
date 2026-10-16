package com.gtja.dts.oaflow.service.impl;

import cn.hutool.core.util.StrUtil;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.gtja.dts.oaflow.mapper.FlowDocCmpBranchMonthSumMapper;
import com.gtja.dts.oaflow.models.FlowConstant;
import com.gtja.dts.oaflow.utils.DateTimeUtil;
import com.gtja.dts.oaflow.utils.SendKafkaUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static com.gtja.dts.oaflow.models.FlowConstant.FLOW_CMP_ZGSNB_TITLE_TEXT;
import static com.gtja.dts.oaflow.models.FlowConstant.FLOW_CMP_ZGSYB_TITLE_TEXT;

/**
 * @author wxx
 * @date 2023-04-27 14:03
 */

@RequiredArgsConstructor
@Service
@Slf4j
public class FlowDocCmpZgsybService {

    private final FlowDocCmpBranchMonthSumMapper flowDocCmpBranchMonthSumMapper;
    @Value("${link.flow.path}")
    private String flowUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String draft(String reportMonth,String deptCode,String reportCode,String reportName,String creator,String aduitUserId){
        String piid = "";

        String deptId = deptCode.replace("D","");
        JsonObject formData  = new JsonObject();
        formData.addProperty("CREATE_TIME", DateTimeUtil.getCurrentDateStr());
        formData.addProperty("PERIOD", reportMonth);
        formData.addProperty("DEPT_NAME", Optional.ofNullable(flowDocCmpBranchMonthSumMapper.getSubCompNameByDeptId(deptCode)).orElse(""));
        formData.addProperty("DEPT_CODE", deptCode);
        formData.addProperty("DEPT_ID", deptId);
        formData.addProperty("CREATOR", creator);
        formData.addProperty("REPORT_NAME", reportName);
        formData.addProperty("REPORT_CODE", reportCode);
        formData.addProperty("COMMENTATOR", Optional.ofNullable(flowDocCmpBranchMonthSumMapper.findUserNameByUserId(creator)).orElse(""));
        formData.addProperty("DRAFT_DEPT_CODE", "");
        formData.addProperty("DRAFT_DEPT_NAME", "");
        /**
         * 新增子公司月报处理人员ID
         */
        formData.addProperty("AUDIT_USER_ID", aduitUserId);
        /**
         * 起草部门id和name都为""时,全连接会默认去取起草人的部门id和name
         *
         * String draftDeptCode = Optional.ofNullable(flowDocCmpBranchMonthSumMapper.findDeptIdByUserId(creator)).orElse("").replace("D","")
         * String draftDeptName = Optional.ofNullable(flowDocCmpBranchMonthSumMapper.findDeptNameByUserId(creator)).orElse("")
         *
         */

        JsonObject flowParams = SendKafkaUtils.getFlowParamsOfZgs(FlowConstant.FLOW_CMP_ZGSYB_FLOW_CODE, FlowConstant.FLOW_SYSTEM_ID_CMP,
                reportName, FlowConstant.FLOW_CMP_ZGSYB_TABLE, FLOW_CMP_ZGSYB_TITLE_TEXT, "0", formData);

        HttpHeaders flowHeader = SendKafkaUtils.getFlowHeader(FlowConstant.FLOW_SYSTEM_ID_CMP, "",
                creator,Optional.ofNullable(flowDocCmpBranchMonthSumMapper.findUserNameByUserId(creator)).orElse(""));

        log.info("--------------------------\r\n调用流程接口：{}，\r\n参数：{}", flowUrl, flowParams.toString());

        String flowResult = restTemplate.postForObject(flowUrl, new HttpEntity<>(flowParams.toString(), flowHeader), String.class);

        log.info("{}调用流程接口成功，返回结果为：{}", FlowConstant.FLOW_CMP_ZGSYB_FLOW_CODE , flowResult);

        if (StrUtil.isNotBlank(flowResult)) {
            JsonObject data = JsonParser.parseString(flowResult).getAsJsonObject().getAsJsonObject("Data");
            piid = data.get("piid").getAsString();
        }
        return piid;
    }

    public String draftYear(String reportYear,String deptCode,String reportType,String reportCode,String reportName,String creatorId,String aduitUserId){
        String piid = "";
        String deptId = deptCode.replace("D","");
        JsonObject formData  = new JsonObject();
        formData.addProperty("CREATE_TIME", DateTimeUtil.getCurrentDateStr());
        formData.addProperty("PERIOD", reportYear);
        formData.addProperty("DEPT_NAME", Optional.ofNullable(flowDocCmpBranchMonthSumMapper.getSubCompNameByDeptId(deptCode)).orElse(""));
        formData.addProperty("DEPT_CODE", deptCode);
        formData.addProperty("DEPT_ID", deptId);
        formData.addProperty("CREATOR_ID", creatorId);
        formData.addProperty("CREATOR", Optional.ofNullable(flowDocCmpBranchMonthSumMapper.findUserNameByUserId(creatorId)).orElse(""));
        formData.addProperty("REPORT_NAME", reportName);
        formData.addProperty("REPORT_CODE", reportCode);
        formData.addProperty("REPORT_TYPE", reportType);
        formData.addProperty("CREATE_TIME", DateTimeUtil.getCurrentDateStr());
        formData.addProperty("DRAFT_DEPT_CODE", "");
        formData.addProperty("DRAFT_DEPT_NAME", "");

        /**
         * 新增子公司年报和半年报处理人员ID
         */
        formData.addProperty("AUDIT_USER_ID", aduitUserId);

        JsonObject flowParams = SendKafkaUtils.getFlowParamsOfZgs(FlowConstant.FLOW_CMP_ZGSNB_FLOW_CODE, FlowConstant.FLOW_SYSTEM_ID_CMP,
                reportName, FlowConstant.FLOW_CMP_ZGSNB_TABLE, FLOW_CMP_ZGSNB_TITLE_TEXT, "0", formData);

        HttpHeaders flowHeader = SendKafkaUtils.getFlowHeader(FlowConstant.FLOW_SYSTEM_ID_CMP, "",
                creatorId,Optional.ofNullable(flowDocCmpBranchMonthSumMapper.findUserNameByUserId(creatorId)).orElse(""));

        log.info("--------------------------\r\n调用流程接口：{}，\r\n参数：{}", flowUrl, flowParams.toString());

        String flowResult = restTemplate.postForObject(flowUrl, new HttpEntity<>(flowParams.toString(), flowHeader), String.class);

        log.info("{}调用流程接口成功，返回结果为：{}", FlowConstant.FLOW_CMP_ZGSNB_FLOW_CODE , flowResult);

        if (StrUtil.isNotBlank(flowResult)) {
            JsonObject data = JsonParser.parseString(flowResult).getAsJsonObject().getAsJsonObject("Data");
            piid = data.get("piid").getAsString();
        }
        return piid;
    }
}
