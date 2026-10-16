package com.gtja.dts.oaflow.service.impl.thfxq;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gtja.dts.oaflow.mapper.thfxq.TbProjFlowInstMapper;
import com.gtja.dts.oaflow.models.FlowConstant;
import com.gtja.dts.oaflow.pojo.po.thfxq.TbProjFlowInst;
import com.gtja.dts.oaflow.service.thfxq.SelfCheckFlowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.ConnectException;
import java.net.HttpURLConnection;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 清单自查流程服务实现
 * 
 * @author AI Assistant
 * @date 2026-08-04
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SelfCheckFlowServiceImpl implements SelfCheckFlowService {

    private final TbProjFlowInstMapper flowInstMapper;

    /**
     * 流程下发 URL（从配置读取）
     */
    // @Value("${selfcheck.flow.submit.url:http://10.116.131.13:8094/auto/submit}")
    @Value("${selfcheck.flow.submit.url:http://10.106.2.92:8094/auto/submit}")
    private String submitUrl;

    /**
     * 批次大小（每次查询的记录数）
     */
    @Value("${selfcheck.flow.batch.size:100}")
    private int batchSize;

    /**
     * 每条记录处理后的休眠时间（毫秒，随机范围）
     */
    @Value("${selfcheck.flow.sleep.min:50}")
    private int sleepMin;

    @Value("${selfcheck.flow.sleep.max:100}")
    private int sleepMax;

    /**
     * 业务类型列表
     */
    private static final List<String> FLOW_CODES = new ArrayList<>();
    static {
        FLOW_CODES.add("IBCM002");
    }

    @Override
    public ProcessResult executeBatchSubmit() {
        log.info("开始执行清单自查流程批量下发任务");

        int resetCount = flowInstMapper.resetStuckProcessing();
        if (resetCount > 0) {
            log.warn("重置了 {} 条长时间卡在'处理中'状态的记录", resetCount);
        }

        ProcessResult result = new ProcessResult();

        try {
            while (true) {
                List<TbProjFlowInst> records = flowInstMapper.selectUnsentByFlowCodes(
                        FLOW_CODES,
                        batchSize
                );

                if (records == null || records.isEmpty()) {
                    log.info("没有更多未发送的记录，任务结束");
                    break;
                }

                log.info("本次批次共 {} 条未发送记录", records.size());

                for (TbProjFlowInst record : records) {
                    String pkId = record.getPkId();
                    String projId = record.getProjId();

                    int affected = flowInstMapper.markProcessing(pkId);
                    if (affected == 0) {
                        log.info("记录已被其他线程处理，跳过: pkId={}, projId={}", pkId, projId);
                        continue;
                    }

                    result.setTotal(result.getTotal() + 1);

                    try {
                        boolean success = submitSelfCheckFlow(record);
                        if (success) {
                            flowInstMapper.updateSendStatus(pkId, "1");
                            result.setSuccess(result.getSuccess() + 1);
                            log.info("流程下发成功: pkId={}, projId={}, projName={}", pkId, projId, record.getProjname());
                        } else {
                            result.setFailed(result.getFailed() + 1);
                            log.error("流程下发返回失败: pkId={}, projId={}", pkId, projId);
                        }

                        Thread.sleep(getRandomSleepTime());

                    } catch (InterruptedException e) {
                        log.error("线程被中断", e);
                        Thread.currentThread().interrupt();
                        break;
                    } catch (Exception e) {
                        String errMsg = "下发异常: " + e.getMessage();
                        log.error("流程下发异常: pkId={}, projId={}, error={}", pkId, projId, e.getMessage(), e);

                        if (isConnectTimeout(e)) {
                            flowInstMapper.updateFromProcessing(pkId, errMsg, "0");
                            log.warn("判断为连接超时，标记为可重试 '0': pkId={}", pkId);
                        } else {
                            flowInstMapper.markPendingConfirm(pkId, errMsg);
                            log.warn("判断为读超时/其他异常，标记为待确认 '3': pkId={}，避免重复下发", pkId);
                        }
                        result.setFailed(result.getFailed() + 1);
                    }
                }

                if (records.size() < batchSize) {
                    break;
                }
            }

        } catch (Exception e) {
            log.error("批量下发任务执行失败", e);
            result.setErrorMsg(e.getMessage());
        }

        log.info("批量下发任务完成: {}", result);
        return result;
    }

    /**
     * 提交清单自查流程到 OA 系统
     * 
     * @param record 流程实例记录
     * @return 是否成功
     */
    private boolean submitSelfCheckFlow(TbProjFlowInst record) {
        Map<String, Object> formData = buildFormData(record);

        Map<String, Object> requestObj = new HashMap<>();
        requestObj.put("todoTitle", "清单自查 - 【" + record.getProjname() + "】");
        requestObj.put("sysGuid", "IBCM");
        requestObj.put("flowCode", "IBCM002");
        requestObj.put("formData", com.alibaba.fastjson.JSON.toJSONString(formData));
        requestObj.put("templateName", "清单自查 - 【" + record.getProjname() + "】");
        requestObj.put("flowVer", "1");
        requestObj.put("nodeCode", "draft");
        requestObj.put("applyTable", "T_PROJ_SELFCHECK_FLOW");
        requestObj.put("candidates", "7000");

        String requestBody = com.alibaba.fastjson.JSON.toJSONString(requestObj);
        log.info("开始调用OA下发接口: pkId={}, projId={}, url={}", record.getPkId(), record.getProjId(), submitUrl);

        String responseBody = doHttpPost(submitUrl, requestBody,
                record.getCreateUserId(), record.getCreateuser());
        log.info("OA下发接口响应: pkId={}, body={}", record.getPkId(), responseBody);

        Map<String, Object> respMap = com.alibaba.fastjson.JSON.parseObject(responseBody, Map.class);
        Integer code = (Integer) respMap.get("code");

        if (code != null && code == 0) {
            return true;
        } else {
            String msg = (String) respMap.get("msg");
            log.error("OA下发返回错误码: pkId={}, projId={}, code={}, msg={}", record.getPkId(), record.getProjId(), code, msg);
            return false;
        }
    }

    /**
     * 构建表单数据（使用新增表字段）
     * 
     * @param record 流程实例记录
     * @return 表单数据 Map
     */
    private Map<String, Object> buildFormData(TbProjFlowInst record) {
        Map<String, Object> formData = new HashMap<>();
        formData.put("BUSIDATE", record.getBusiDate());
        formData.put("PROJID", record.getProjId());
        formData.put("PROJLIST_STATUS", record.getProjlistStatus() != null ? record.getProjlistStatus() : "");
        formData.put("DEPTMANANAME", record.getReceiveDisplayName() != null ? record.getReceiveDisplayName() : "");
        formData.put("STAFF_ID", record.getReceiveStaffId() != null ? record.getReceiveStaffId() : "");
        formData.put("START_USER", record.getCreateuser());
        formData.put("CHECK_BATCH", record.getCheckBatch());
        formData.put("CHECK_BATCH_ID", record.getCheckBatchId());
        formData.put("TITLE", record.getTitle());
        formData.put("CONTENT", record.getContent());
        formData.put("PROJNAME", record.getProjname());
        return formData;
    }

    /**
     * 获取随机休眠时间（毫秒）
     * 
     * @return 休眠时间
     */
    private long getRandomSleepTime() {
        return ThreadLocalRandom.current().nextLong(sleepMin, sleepMax + 1);
    }

    private boolean isConnectTimeout(Exception e) {
        Throwable root = e;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        if (root instanceof ConnectException) {
            return true;
        }
        if (root instanceof SocketTimeoutException) {
            String msg = root.getMessage();
            return msg != null && msg.contains("connect");
        }
        String msg = root.getMessage();
        if (msg == null) {
            msg = e.getMessage();
        }
        if (msg != null) {
            return msg.toLowerCase().contains("connect timed out")
                    || msg.toLowerCase().contains("connection refused")
                    || msg.toLowerCase().contains("failed to connect");
        }
        return false;
    }

    private String doHttpPost(String urlStr, String jsonBody, String userId, String userName) {
        try {
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            try {
                conn.setRequestMethod("POST");
                conn.setDoOutput(true);
                conn.setRequestProperty("Content-Type", "application/json;charset=utf-8");
                conn.setRequestProperty("x-flow-systemId", "IBCM");
                conn.setRequestProperty("x-userId", userId != null ? userId : "");
                conn.setRequestProperty("x-userName", userName != null ? userName : "");
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(30000);

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(jsonBody.getBytes(StandardCharsets.UTF_8));
                    os.flush();
                }

                int httpStatus = conn.getResponseCode();
                BufferedReader br;
                if (httpStatus >= 200 && httpStatus < 300) {
                    br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                } else {
                    br = new BufferedReader(new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8));
                }
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line);
                }
                br.close();
                log.info("HTTP POST响应: url={}, httpStatus={}", urlStr, httpStatus);
                return sb.toString();
            } finally {
                conn.disconnect();
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
