package com.gtja.dts.oaflow.service.impl.tyglryj;


import com.alibaba.fastjson.JSONObject;
import com.google.gson.JsonObject;
import com.gtja.dts.oaflow.mapper.tyglryj.FlowDocCmpTyglryjMapper;
import com.gtja.dts.oaflow.mapper.zpqld.TbWarningInfoBondMapper;
import com.gtja.dts.oaflow.models.FlowConstant;
import com.gtja.dts.oaflow.pojo.po.tyglryj.tbManagerMatchInfo;
import com.gtja.dts.oaflow.pojo.po.tyglryj.tbWarningOneManager;
import com.gtja.dts.oaflow.pojo.po.zqpld.TbWarningInfoBond;
import com.gtja.dts.oaflow.service.tyglryj.FlowDocCmpTyglryjService;
import com.gtja.dts.oaflow.utils.DateTimeUtil;
import com.gtja.dts.oaflow.utils.SendKafkaUtils;
import com.gtja.flow.helper.service.AutoFlowService;
import com.gtja.framework.util.common.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.text.ParseException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * @author wxx
 * @date 2023-06-14 17:15
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FlowDocCmpTyglryjServiceImpl implements FlowDocCmpTyglryjService {
    private final Logger logger = LoggerFactory.getLogger(FlowDocCmpTyglryjServiceImpl.class);

    private final FlowDocCmpTyglryjMapper tyglryjMapper;

    private final AutoFlowService autoFlowService;

    @Override
    public String submitSdk(String id, String applyTitle, String creator, String flowVer) throws IOException {
        String piid = "";
        tbWarningOneManager obj = tyglryjMapper.findYjByPkId(id);
        if(Optional.ofNullable(obj).isPresent()){
            JsonObject formData = new JsonObject();
            formData.addProperty("OCCUR_DATE", obj.getOccurDate());
            formData.addProperty("OCCUR_TIME", obj.getOccurTime());
            formData.addProperty("RULE_ID", obj.getRuleId());
            formData.addProperty("RULE_NAME", obj.getRuleName());
            formData.addProperty("BRANCH_NO", obj.getBranchNo());
            formData.addProperty("BRANCH_NAME", obj.getBranchName());
            formData.addProperty("MANAGER_NAME", obj.getManagerName());
            formData.addProperty("MARKET_ID", obj.getMarketId());
            formData.addProperty("MARKET_NAME", obj.getMarketName());
            formData.addProperty("WARNING_TYPE", obj.getWarningType());
            formData.addProperty("WARNING_WEIGHT", obj.getWarningWeight());
            formData.addProperty("DETAILS", obj.getDetails());
            formData.addProperty("ID_NO", obj.getIdNo());
            formData.addProperty("END_TIME", obj.getEndTime());
            formData.addProperty("PK_ID", obj.getPkId());

            /**
             * 待办标题
             */
            String todoTitle = applyTitle + "(" +obj.getManagerName()+")";
            /**
             * String flowCode, String applyTitle, String todoTitle,
             * String applyTable, JsonObject formData, String flowVer, String candidates
             */
            Map<String, String> flowParams = SendKafkaUtils.getSubmitBodyParams(FlowConstant.FLOW_CMP_TYGLRYJ_FLOW_CODE,
                    applyTitle,todoTitle, FlowConstant.FLOW_CMP_TYGLRYJ_TABLE, formData, flowVer, obj.getBranchNo()+",CMP090");

            Map<String, String> flowHeader = SendKafkaUtils.submitHeader(FlowConstant.FLOW_SYSTEM_ID_CMP,
                    creator, tyglryjMapper.findUserNameByUserId(creator));
            logger.info("--------------------------参数：{}", flowParams.toString());
            JSONObject submitResult = autoFlowService.submit(flowHeader, null, flowParams);
            logger.info("{}调用流程接口成功，返回结果为：{}", FlowConstant.FLOW_CMP_TYGLRYJ_FLOW_CODE, submitResult);
            piid = submitResult.getJSONObject("Data").getJSONObject("instFlowBase").getString("piid");
            if (StringUtils.isNotEmpty(piid)) {
                tyglryjMapper.updateSubmitStatusByPkId(obj.getPkId(), piid);
            }
        }
        return piid;
    }

    @Override
    public List<tbManagerMatchInfo> findTradeDetailsPage(String pid, Integer page, Integer pageSize) {
        int pageCount = (page - 1) * pageSize;
        pageSize = page * pageSize;
        return tyglryjMapper.findTradeDetailsPage(pid,pageCount,pageSize);
    }
}
