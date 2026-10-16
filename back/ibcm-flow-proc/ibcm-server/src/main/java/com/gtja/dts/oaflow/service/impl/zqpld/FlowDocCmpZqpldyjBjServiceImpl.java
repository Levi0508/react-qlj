package com.gtja.dts.oaflow.service.impl.zqpld;


import com.alibaba.fastjson.JSONObject;
import com.google.gson.JsonObject;
import com.gtja.dts.oaflow.mapper.zpqld.FlowDocCmpZqpldyjBjMapper;
import com.gtja.dts.oaflow.mapper.zpqld.TbWarningInfoBondMapper;
import com.gtja.dts.oaflow.models.FlowConstant;
import com.gtja.dts.oaflow.pojo.po.zqpld.TbWarningInfoBond;
import com.gtja.dts.oaflow.service.zqpld.FlowDocCmpZqpldyjBjService;
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
import java.text.DecimalFormat;
import java.text.ParseException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * @author wxx
 * @date 2023-06-14 17:15
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FlowDocCmpZqpldyjBjServiceImpl implements FlowDocCmpZqpldyjBjService {
    private final Logger logger = LoggerFactory.getLogger(FlowDocCmpZqpldyjBjServiceImpl.class);

    private final FlowDocCmpZqpldyjBjMapper candidateMapper;
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
            //candidateMapper.turnoverTime(obj.getOpertime())
            formData.addProperty("ORDER_TIME", DateTimeUtil.formatLocalTime(obj.getOrderDate()) + " " + candidateMapper.turnoverTime(obj.getOrdertime()));
            //买卖方向：0B-买入，0S-卖出
            formData.addProperty("BS_FLAG", "0B".equalsIgnoreCase(obj.getBsflag()) ? "买入" : "卖出");
            //原数据单位是”张“ 需要 除以10 换算成 ”手“
            formData.addProperty("ORDER_QTY", obj.getOrderqty());
            formData.addProperty("ORDER_PRICE", obj.getOrderprice());
            formData.addProperty("MATCH_TIME", DateTimeUtil.formatLocalTime(obj.getOrderDate()) + " " + candidateMapper.turnoverTime(obj.getMatchtime()));
            //原数据单位是”张“ 需要 除以10 换算成 ”手“
            formData.addProperty("MATCH_QTY", obj.getMatchqty());
            formData.addProperty("MATCH_PRICE", obj.getMatchprice());
            formData.addProperty("COMPARE_BASELINE",
                    obj.getChDebtRatio() > obj.getChSecuRatio() ? "中债估值" : "中证估值");
            //单位换算成 ”%“
            double degree = obj.getChDebtRatio() > obj.getChSecuRatio() ? obj.getChDebtRatio() * 100 : obj.getChSecuRatio() * 100;
            String baseDegree = degree > 0 ? "向上偏移：" + new DecimalFormat("#.00").format(Math.abs(degree)) + "%" :
                    "向下偏移：" + new DecimalFormat("#.00").format(Math.abs(degree)) + "%";
            formData.addProperty("CAUSE_CLASSIFY",baseDegree);
            formData.addProperty("BASELINE_DEGREE",degree);

            formData.addProperty("ACCOUNT_CATEGORY_L1",new DecimalFormat("#0.00").format(obj.getChDebtRatio() * 100) + "%");
            formData.addProperty("ACCOUNT_CATEGORY_L2",new DecimalFormat("#0.00").format(obj.getChSecuRatio() * 100) + "%");
            formData.addProperty("CH_DEBT_RATIO", obj.getChDebtRatio());
            formData.addProperty("CH_SECU_RATIO", obj.getChSecuRatio());
            
            formData.addProperty("FLOW_SUBMIT_STATUS", "1");
            formData.addProperty("ORDERSNO", obj.getOrdersno());
            formData.addProperty("FLOW_NO", obj.getFlowNo());
            formData.addProperty("OPWAY", obj.getOpway());
            formData.addProperty("ORDERAMT", obj.getOrderamt());
            formData.addProperty("MATCHAMT", obj.getMatchamt());
            formData.addProperty("ORDER_DATE", obj.getOrderDate());

            /**
             * 待办标题
             */
            String todoTitle = applyTitle + "(" +obj.getStkcode()+")"+ obj.getFlowNo();
            /**
             * String flowCode, String applyTitle, String todoTitle,
             * String applyTable, JsonObject formData, String flowVer, String candidates
             */
            Map<String, String> flowParams = SendKafkaUtils.getSubmitBodyParams(FlowConstant.FLOW_CMP_ZQPLDYJBJ_FLOW_CODE,
                    applyTitle,todoTitle, FlowConstant.FLOW_CMP_ZQPLDYJBJ_TABLE, formData, flowVer, obj.getBranchcode());

            Map<String, String> flowHeader = SendKafkaUtils.submitHeader(FlowConstant.FLOW_SYSTEM_ID_CMP,
                    creator, candidateMapper.findUserNameByUserId(creator));
            logger.info("--------------------------参数：{}", flowParams.toString());
            JSONObject submitResult = autoFlowService.submit(flowHeader, null, flowParams);
            logger.info("{}调用流程接口成功，返回结果为：{}", FlowConstant.FLOW_CMP_ZQPLDYJBJ_FLOW_CODE, submitResult);
            piid = submitResult.getJSONObject("Data").getJSONObject("instFlowBase").getString("piid");
            if (StringUtils.isNotEmpty(piid)) {
                tbWarningInfoBondMapper.updateSubmitStatusByUuid(obj.getUuid(), piid, LocalDateTime.now().format(DateTimeFormatter.ofPattern("Hmmss")));
            }
        }
        return piid;
    }
}
