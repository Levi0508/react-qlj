package com.gtja.dts.oaflow.service.impl;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.gtja.dts.oaflow.mapper.FlowDocCmpBranchYearSumMapper;
import com.gtja.dts.oaflow.models.FlowConstant;
import com.gtja.dts.oaflow.pojo.po.nbhz.FlowDocCmpBranchYearSum;
import com.gtja.dts.oaflow.service.FlowDocCmpBranchYearSumService;
import com.gtja.dts.oaflow.utils.DateTimeUtil;
import com.gtja.dts.oaflow.utils.SendKafkaUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * @author wxx
 * @date 2023-04-27 14:03
 */

@RequiredArgsConstructor
@Service
@Slf4j
public class FlowDocCmpBranchYearSumServiceImpl extends ServiceImpl<FlowDocCmpBranchYearSumMapper, FlowDocCmpBranchYearSum> implements FlowDocCmpBranchYearSumService {
    private final Logger logger = LoggerFactory.getLogger(FlowDocCmpBranchYearSumServiceImpl.class);

    private final FlowDocCmpBranchYearSumMapper flowDocCmpBranchYearSumMapper;

    private final RestTemplate restTemplate = new RestTemplate();



    @Override
    public List<FlowDocCmpBranchYearSum> findYearSumInfoByPiid(String piid) {
        return flowDocCmpBranchYearSumMapper.findYearSumInfoByPiid(piid);
    }

    @Override
    public String draft(String reportYear,String deptId,String applyTitle,String creator,String ishalfyear,String udf1){
        String piid = "";
        JsonObject formData  = new JsonObject();
        String reportName=flowDocCmpBranchYearSumMapper.findUserNameByEhrId(creator);
        formData.addProperty("FILLING_DATE", DateTimeUtil.getCurrentDateStr());
        formData.addProperty("REPORT_YEAR", reportYear);
        formData.addProperty("DEPT_NAME", flowDocCmpBranchYearSumMapper.findDeptNameByDeptId(deptId));
        formData.addProperty("DEPT_ID", deptId);
        formData.addProperty("CREATOR", creator);
        formData.addProperty("ISHALFYEAR", ishalfyear);
        formData.addProperty("REPORT_PERSON", reportName);
        formData.addProperty("APPLY_TITLE", applyTitle);
        formData.addProperty("SYS_TENANT_CODE", FlowConstant.FLOW_SYSTEM_TENANT_ID_GTJA);
        formData.addProperty("SYS_SYSTEM_ID", FlowConstant.FLOW_SYSTEM_ID_CMP);
        formData.addProperty("SYS_FLOW_CODE", FlowConstant.FLOW_CMP_NBHZ_FLOW_CODE);

        JsonObject flowParams = SendKafkaUtils.getFlowParams(FlowConstant.FLOW_CMP_NBHZ_FLOW_CODE, FlowConstant.FLOW_SYSTEM_ID_CMP,
                applyTitle, FlowConstant.FLOW_CMP_NBHZ_TABLE, udf1, "0", formData);
        HttpHeaders flowHeader = SendKafkaUtils.getFlowHeader(FlowConstant.FLOW_SYSTEM_ID_CMP, "",
                formData.get("CREATOR").getAsString(),formData.get("REPORT_PERSON").getAsString());
        String url = "http://localhost:8094/flowCommon/serviceFlowApi";
        logger.info("--------------------------\r\n调用流程接口：{}，\r\n参数：{}", url, flowParams.toString());

        String flowResult = restTemplate.postForObject(url, new HttpEntity<>(flowParams.toString(), flowHeader), String.class);

        logger.info("{}调用流程接口成功，返回结果为：{}", FlowConstant.FLOW_CMP_NBHZ_FLOW_CODE , flowResult);

        if (StrUtil.isNotBlank(flowResult)) {
            JsonObject data = JsonParser.parseString(flowResult).getAsJsonObject().getAsJsonObject("Data");
            piid = data.get("piid").getAsString();
        }
        return piid;
    }

   
}
