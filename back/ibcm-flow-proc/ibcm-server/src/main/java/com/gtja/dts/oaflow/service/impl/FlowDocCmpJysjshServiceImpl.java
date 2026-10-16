package com.gtja.dts.oaflow.service.impl;


import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson.JSONObject;
import com.google.gson.JsonObject;
import com.gtja.dts.oaflow.mapper.FlowDocCmpJysjshMapper;
import com.gtja.dts.oaflow.models.FlowConstant;
import com.gtja.dts.oaflow.pojo.po.jysjsh.TbUseLetter;
import com.gtja.dts.oaflow.pojo.vo.JysJshVo;
import com.gtja.dts.oaflow.service.FlowDocCmpJysjshService;
import com.gtja.dts.oaflow.utils.FileToolUtils;
import com.gtja.dts.oaflow.utils.SendKafkaUtils;
import com.gtja.flow.helper.service.AutoFlowService;
import com.gtja.framework.util.common.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.Map;

/**
 * @author wxx
 * @date 2023-06-14 17:15
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FlowDocCmpJysjshServiceImpl implements FlowDocCmpJysjshService {
    private final Logger logger = LoggerFactory.getLogger(FlowDocCmpJysjshServiceImpl.class);

    private final FlowDocCmpJysjshMapper candidateMapper;

    private final AutoFlowService autoFlowService;

    @Value("${file.ycjy.local.path}")
    private String jshUrl;

    @Override
    public String submitSdk(String id, String applyTitle, String creator, String flowVer,String relateCode,
                            JysJshVo obj) throws IOException {

        String piid;
        TbUseLetter relateObjData = candidateMapper.findRelateObjData(id, relateCode);
        String fileType = obj.getFileType();
        String tip = "";
        String fileSource = obj.getFileSource();
        String fileSourceName = "";
        if("2".equals(fileType) || "3".equals(fileType) | "5".equals(fileType) | "6".equals(fileType)){
            tip = candidateMapper.getTipRemark("200");
        }

        /**
         * 暂无字典表
         */
        if("1".equals(fileSource)){
            fileSourceName = "上海证券交易所";
        }else if("2".equals(fileSource)){
            fileSourceName = "深圳证券交易所";
        }else if("3".equals(fileSource)){
            fileSourceName = "全国中小企业股份转让系统";
        }else{
            fileSourceName = "北京证券交易所";
        }

        String deptNameFind = candidateMapper.findDeptNameByDeptId(relateObjData.getSalesDepartment());
        String deptName = StrUtil.isBlank(deptNameFind) ? "" : deptNameFind;

        JsonObject formData = new JsonObject();
        formData.addProperty("OPERATE_DATE", obj.getCreateDate());
        formData.addProperty("ID", obj.getId());
        formData.addProperty("CUSTOMER_ACCOUNT", relateObjData.getCustomerAccount());
        formData.addProperty("CUSTOMER_NUMBER", relateObjData.getCustomerNumber());
        formData.addProperty("CUSTOMER_NAME", relateObjData.getCustomerName());
        formData.addProperty("SALES_DEPARTMENT", relateObjData.getSalesDepartment());
        formData.addProperty("SEND_LETTER_USER", relateObjData.getSendLetterUser());
        formData.addProperty("SEND_FUCTION", relateObjData.getSendFuction());
        formData.addProperty("SEND_TIME", relateObjData.getSendTime());
        formData.addProperty("SEND_CONTENT", relateObjData.getSendContent());
        formData.addProperty("STATE", relateObjData.getState());
        formData.addProperty("STOCK_CODE", relateObjData.getStockCode());
        formData.addProperty("DSID", relateObjData.getDsid());
        formData.addProperty("CUSTOMER_TYPE", relateObjData.getCustomerType());
        formData.addProperty("SEND_ENCLOSURE", relateObjData.getSendEnclosure());
        formData.addProperty("FILENO", relateObjData.getFileno());
        formData.addProperty("CUSTOM_COOPERATION", relateObjData.getCustomCooperation());
        formData.addProperty("FILE_SOURCE", obj.getFileSource());
        formData.addProperty("FILE_TYPE", obj.getFileType());
        formData.addProperty("RECEIPT_DATE", obj.getReceiptDate());
        formData.addProperty("FEED_OFFTIME", obj.getFeedOfftime());
        formData.addProperty("FILE_TITLE", obj.getFileTitle());
        formData.addProperty("FILE_NOTE", obj.getFileNote());
        formData.addProperty("FILE_PATH", obj.getFilePath());
        formData.addProperty("NOTICE_WAY", obj.getNoticeWay());
        formData.addProperty("RECEIPT_NAME", obj.getReceiptName());
        formData.addProperty("RECEIPT_UNIT", obj.getReceiptUnit());
        formData.addProperty("READ_BEGIN_DATE", obj.getReadBeginDate());
        formData.addProperty("READ_END_DATE", obj.getReadEndDate());
        formData.addProperty("FILENAME", obj.getFilename());
        formData.addProperty("TRADE_DATE", obj.getTradeDate());
        formData.addProperty("RULE_ID", obj.getRuleId());
        formData.addProperty("HIT_FLAG", tip);
        formData.addProperty("CREATE_USER", creator);
        formData.addProperty("CREATE_USER_NAME", candidateMapper.findUserNameByUserId(creator));
        formData.addProperty("DEPT_NAME", deptName);


        String receiptDate = DateUtil.format(DateUtil.parse(obj.getReceiptDate(), "yyyy-MM-dd"), "yyyy-MM-dd");

        /**
         * 待办标题
         */
        String todoTitle = fileSourceName+"-"+obj.getFileTitle()+"-"+deptName+"-"+receiptDate;

        /**
         * String flowCode, String applyTitle, String todoTitle,
         * String applyTable, JsonObject formData, String flowVer, String candidates
         */
        Map<String, String> flowParams = SendKafkaUtils.getSubmitBodyParams(FlowConstant.FLOW_CMP_JYSJSH_FLOW_CODE,
                applyTitle,todoTitle, FlowConstant.FLOW_CMP_JYSJSH_TABLE, formData, flowVer, relateCode);

        Map<String, String> flowHeader = SendKafkaUtils.submitHeader(FlowConstant.FLOW_SYSTEM_ID_CMP,
                creator, candidateMapper.findUserNameByUserId(creator));
        logger.info("--------------------------参数：{}", flowParams.toString());
        JSONObject submitResult = autoFlowService.submit(flowHeader, null, flowParams);
        logger.info("{}调用流程接口成功，返回结果为：{}", FlowConstant.FLOW_CMP_JYSJSH_FLOW_CODE, submitResult);
        piid = submitResult.getJSONObject("Data").getJSONObject("instFlowBase").getString("piid");
        if (StringUtils.isNotEmpty(piid)) {
            candidateMapper.updateUseLetterFlowId(id,relateCode,piid);
        }
        return piid;
    }

    @Override
    public void downloadFile(HttpServletResponse response, String filePath, String fileName) throws UnsupportedEncodingException {
        //存在共享文件夹的
        String remoteNewFilePath = filePath.replace("E:",jshUrl);
        if(!remoteNewFilePath.endsWith("\\")||!remoteNewFilePath.endsWith("/")){
            remoteNewFilePath = remoteNewFilePath + "/";
        }
        FileToolUtils.downloadFileByPath(response,remoteNewFilePath,fileName);

    }

}
