package com.gtja.dts.oaflow.service.impl.zqpld;


import com.alibaba.fastjson.JSONObject;
import com.google.gson.JsonObject;
import com.gtja.dts.oaflow.mapper.zpqld.FlowDocCmpZqpldyjMapper;
import com.gtja.dts.oaflow.mapper.zpqld.TbResult1808032230dOaNewMapper;
import com.gtja.dts.oaflow.mapper.zpqld.TbWarningInfoBondMapper;
import com.gtja.dts.oaflow.models.FlowConstant;
import com.gtja.dts.oaflow.pojo.po.zqpld.TbResult1808032230dOaNew;
import com.gtja.dts.oaflow.pojo.po.zqpld.TbWarningInfoBond;
import com.gtja.dts.oaflow.service.zqpld.FlowDocCmpZqpldyjService;
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
import java.util.Map;
import java.util.Optional;

/**
 * @author wxx
 * @date 2023-06-14 17:15
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FlowDocCmpZqpldyjServiceImpl implements FlowDocCmpZqpldyjService {
    private final Logger logger = LoggerFactory.getLogger(FlowDocCmpZqpldyjServiceImpl.class);

    private final FlowDocCmpZqpldyjMapper candidateMapper;
    private final TbWarningInfoBondMapper tbWarningInfoBondMapper;

    private final AutoFlowService autoFlowService;

    @Override
    public String submitSdk(String listDate, String deptId, String applyTitle, String creator, String flowVer,
                            TbWarningInfoBond obj) throws IOException, ParseException {
        String piid = "";
        Integer state = tbWarningInfoBondMapper.findIsSendState(Optional.ofNullable(obj.getUuid()).orElse(""));
        if(state == 1) {
            JsonObject formData = new JsonObject();
            formData.addProperty("OPERATE_DATE", obj.getOperdate());
            formData.addProperty("OPERATE_TIME", LocalDateTime.now().format(DateTimeFormatter.ofPattern("Hmmss")));
            formData.addProperty("BRANCH_NO", obj.getBranchcode());
            formData.addProperty("BRANCH_NAME", obj.getBranchname());
            formData.addProperty("MARKET", obj.getMarket());
            formData.addProperty("BOND_VALUATION", obj.getDebt());
            formData.addProperty("SECURITY_VALUATION", obj.getSecu());
            formData.addProperty("CUSTOMER_NAME", obj.getCustname());
            formData.addProperty("SECURITY_ACCOUNT", obj.getSecuid());
            formData.addProperty("SECURITY_ID", obj.getStkcode());
            formData.addProperty("SECURITY_NAME", obj.getStkname());

            formData.addProperty("ORDER_TIME", DateTimeUtil.formatLocalTime(obj.getOrderDate()) + " " + candidateMapper.turnoverTime(obj.getOrdertime()));
            //买卖方向：0B-买入，0S-卖出
            formData.addProperty("BS_FLAG", "0B".equalsIgnoreCase(obj.getBsflag()) ? "买入" : "卖出");
            //原数据单位是”张“ 需要 除以10 换算成 ”手“
            formData.addProperty("ORDER_QTY", obj.getOrderqty() / 10);
            formData.addProperty("ORDER_PRICE", obj.getOrderprice());
            formData.addProperty("MATCH_TIME", DateTimeUtil.formatLocalTime(obj.getOrderDate()) + " " + candidateMapper.turnoverTime(obj.getMatchtime()));
            //原数据单位是”张“ 需要 除以10 换算成 ”手“
            formData.addProperty("MATCH_QTY", obj.getMatchqty() / 10);
            formData.addProperty("MATCH_PRICE", obj.getMatchprice());
            formData.addProperty("COMPARE_BASELINE",
                    obj.getChDebtRatio() > obj.getChSecuRatio() ? "中债估值" : "中证估值");
            //单位换算成 ”%“
            formData.addProperty("BASELINE_DEGREE",
                    obj.getChDebtRatio() > obj.getChSecuRatio() ? obj.getChDebtRatio() * 100 : obj.getChSecuRatio() * 100);
            formData.addProperty("CH_DEBT_RATIO", obj.getChDebtRatio());
            formData.addProperty("CH_SECU_RATIO", obj.getChSecuRatio());
            formData.addProperty("FLOW_SUBMIT_STATUS", "1");
            formData.addProperty("ORDERSNO", obj.getOrdersno());

            /**
             * 待办标题
             */
            String todoTitle = applyTitle + "(" +obj.getStkcode()+")"+ obj.getFlowNo();
            /**
             * String flowCode, String applyTitle, String todoTitle,
             * String applyTable, JsonObject formData, String flowVer, String candidates
             */
            Map<String, String> flowParams = SendKafkaUtils.getSubmitBodyParams(FlowConstant.FLOW_CMP_ZQPLDYJ_FLOW_CODE,
                    applyTitle,todoTitle, FlowConstant.FLOW_CMP_ZQPLDYJ_TABLE, formData, flowVer, obj.getBranchcode());

            Map<String, String> flowHeader = SendKafkaUtils.submitHeader(FlowConstant.FLOW_SYSTEM_ID_CMP,
                    creator, candidateMapper.findUserNameByUserId(creator));
            logger.info("--------------------------参数：{}", flowParams.toString());
            JSONObject submitResult = autoFlowService.submit(flowHeader, null, flowParams);
            logger.info("{}调用流程接口成功，返回结果为：{}", FlowConstant.FLOW_CMP_ZQPLDYJ_FLOW_CODE, submitResult);
            piid = submitResult.getJSONObject("Data").getJSONObject("instFlowBase").getString("piid");
            if (StringUtils.isNotEmpty(piid)) {
                tbWarningInfoBondMapper.updateSubmitStatusByUuid(obj.getUuid(), piid, LocalDateTime.now().format(DateTimeFormatter.ofPattern("Hmmss")));
            }
        }
        return piid;
    }
}
