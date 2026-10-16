package com.gtja.dts.oaflow.service.impl.thfxq;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.gtja.dts.oaflow.mapper.thfxq.SelfCheckReminderEmailMapper;
import com.gtja.dts.oaflow.mapper.thfxq.TbProjFlowInstMapper;
import com.gtja.dts.oaflow.mapper.wb.WbUserMapper;
import com.gtja.dts.oaflow.pojo.po.thfxq.TbProjFlowInst;
import com.gtja.dts.oaflow.pojo.vo.thfxq.SelfCheckReminderEmailVO;
import com.gtja.dts.oaflow.service.thfxq.SelfCheckReminderEmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.text.SimpleDateFormat;
import java.util.List;

@Slf4j
@Service
public class SelfCheckReminderEmailServiceImpl implements SelfCheckReminderEmailService {

    private static final int BATCH_SIZE = 100;
    private static final long SLEEP_TIME_MS = 100;

    private static final String TX_SERVER = "10.181.114.82:8002";
    private static final String SYS_TYPE = "n42uNK3xg1+hXrhsgyTxBKNIXKMXvHWok+bxS/XHb9nIK8l+wQNBL8UMaVCL7i3A3BEj62P0+OEb2Bq6VdHVHRb/8949rODwr9wUk2+/5qxi0hKvxvOeCpGz4LQxmNUlGRHHiZrIUCwYkpxeq4k06w+Ms3nPdduLzgnoVftKy+o=";
    private static final String CLIENT_ID = "aab9db9a7946ead1";
    private static final String CLIENT_SECRET = "c83f19ed34f74ec3b3749e5f5c728d8a";
    private static final String SENDER_EMAIL = "cm_ibd@gtht.com";

    private static final String FLOW_CODE_REMIND = "proj_selfcheck_remind";
    private static final String FLOW_CODE_MAIL = "proj_selfcheck_mail";

    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    private SelfCheckReminderEmailMapper emailMapper;

    @Autowired
    private TbProjFlowInstMapper flowInstMapper;

    @Autowired
    private WbUserMapper wbUserMapper;

    @Override
    public String executeReminderTask() {
        return executeTask(FLOW_CODE_REMIND, "清单自查催办邮件");
    }

    @Override
    public String executeFlowMailTask() {
        return executeTask(FLOW_CODE_MAIL, "清单自查流程邮件");
    }

    private String executeTask(String flowCode, String taskName) {
        log.info("=== 开始执行{}任务（flow_code={}） ===", taskName, flowCode);

        int totalProcessed = 0;

        try {
            String token = getOAuthToken();
            if (token == null) {
                log.error("获取 OAuth Token 失败，任务终止");
                return "获取 OAuth Token 失败，任务终止";
            }

            while (true) {
                IPage<TbProjFlowInst> unsentPage = queryUnsentRecords(flowCode, 0, BATCH_SIZE);

                if (unsentPage == null || unsentPage.getRecords().isEmpty()) {
                    log.info("没有待发送的{}记录，任务结束", taskName);
                    break;
                }

                List<TbProjFlowInst> records = unsentPage.getRecords();
                log.info("当前批次获取到 {} 条未发送邮件记录", records.size());

                for (TbProjFlowInst record : records) {
                    try {
                        if (!acquireLock(record.getPkId())) {
                            log.warn("获取分布式锁失败，pkId={}", record.getPkId());
                            continue;
                        }

                        boolean sendSuccess;

                        if (FLOW_CODE_MAIL.equals(flowCode)) {
                            sendSuccess = sendFlowMail(convertToVO(record), token);// 清单自查待办下发
                        } else {
                            sendSuccess = sendReminderEmail(convertToVO(record), token); // 清单自查催办下发
                        }

                        if (sendSuccess) {
                            updateSendStatus(record.getPkId(), "1");
                            log.info("邮件发送成功：pkId={}, projId={}, receiveUser={}",
                                record.getPkId(), record.getProjId(), record.getReceiveUserId());
                        } else {
                            log.error("邮件发送失败：pkId={}, projId={}, receiveUser={}",
                                record.getPkId(), record.getProjId(), record.getReceiveUserId());
                            updateErrorInfo(record.getPkId(), "邮件发送失败");
                        }

                        totalProcessed++;

                    } catch (Exception e) {
                        log.error("处理记录异常：pkId={}", record.getPkId(), e);
                        updateErrorInfo(record.getPkId(), "处理异常：" + e.getMessage());
                    } finally {
                        releaseLock(record.getPkId());
                        Thread.sleep(SLEEP_TIME_MS);
                    }
                }

                if (records.size() < BATCH_SIZE) {
                    break;
                }

                Thread.sleep(SLEEP_TIME_MS);
            }

            log.info("=== {}任务执行完成，共处理 {} 条记录 ===", taskName, totalProcessed);
            return "成功处理 " + totalProcessed + " 条记录";

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("任务被中断", e);
            return "任务被中断，已处理 " + totalProcessed + " 条记录";
        } catch (Exception e) {
            log.error("任务执行异常", e);
            return "任务执行异常：" + e.getMessage();
        }
    }

    private IPage<TbProjFlowInst> queryUnsentRecords(String flowCode, long current, long size) {
        try {
            Page<TbProjFlowInst> page = new Page<>(current, size);
            return emailMapper.queryUnsentReminderEmails(page, flowCode, "0");
        } catch (Exception e) {
            log.error("查询未发送邮件记录失败", e);
            return null;
        }
    }

    private boolean acquireLock(String pkId) {
        try {
            int rows = emailMapper.updateLockFlag(pkId);
            return rows > 0;
        } catch (Exception e) {
            log.error("获取分布式锁异常：pkId={}", pkId, e);
            return false;
        }
    }

    private void releaseLock(String pkId) {
        try {
            emailMapper.resetLockFlag(pkId);
        } catch (Exception e) {
            log.error("释放分布式锁异常：pkId={}", pkId, e);
        }
    }

    private SelfCheckReminderEmailVO convertToVO(TbProjFlowInst po) {
        SelfCheckReminderEmailVO vo = new SelfCheckReminderEmailVO();
        vo.setPkId(po.getPkId());
        vo.setProjId(po.getProjId());
        vo.setProjName(po.getProjname());
        vo.setReceiveUserId(po.getReceiveUserId());
        vo.setReceiveDisplayName(po.getReceiveDisplayName());
        vo.setReceiveStaffId(po.getReceiveStaffId());
        vo.setCreateUserId(po.getCreateUserId());
        if (po.getCreateTime() != null) {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            vo.setCreateTime(sdf.format(po.getCreateTime()));
        }
        vo.setContent(po.getContent());

        if (po.getReceiveUserId() != null && !po.getReceiveUserId().isEmpty()) {
            String userEmail = wbUserMapper.findEmailById(po.getReceiveUserId());
            vo.setUserEmail(userEmail);
            log.info("获取到用户邮箱：userId={}, email={}", po.getReceiveUserId(), userEmail);
        } else {
            log.warn("接收人 ID 为空，无法获取邮箱地址：pkId={}", po.getPkId());
        }

        return vo;
    }

    private String getOAuthToken() {
        try {
            String authUrl = String.format("http://%s/oauth/token", TX_SERVER);// http://10.181.114.82:8002/oauth/token
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("client_id", CLIENT_ID);
            body.add("client_secret", CLIENT_SECRET);
            body.add("grant_type", "client_credentials");
            body.add("scope", "read");
            String resTokenString = restTemplate.postForObject(authUrl, body, String.class);
            JSONObject resToken = JSONObject.parseObject(resTokenString);
            assert resToken != null;
            String token = resToken.getString("access_token");
            log.info("OAuth Token 获取成功");
            return token;
        } catch (Exception e) {
            log.error("获取 OAuth Token 异常", e);
            return null;
        }
    }

    private boolean sendReminderEmail(SelfCheckReminderEmailVO emailVO, String token) {
        try {
            JSONArray userList = buildUserList(emailVO);

            JSONObject params = new JSONObject();
            params.put("subject", emailVO.getProjName() + "项目清单自查提醒");
            params.put("body", buildReminderEmailBody(emailVO));
            params.put("mailFrom", SENDER_EMAIL);
            params.put("bodyFormat", "HTML");
            String msgBody = params.toString();
            String userInfos = userList.toString();

            log.info("邮件请求参数：msgBody={}, userInfos={}", msgBody, userInfos);

            return doSendEmail(msgBody, userInfos, token, emailVO);

        } catch (Exception e) {
            log.error("发送邮件异常：pkId={}", emailVO.getPkId(), e);
            return false;
        }
    }

    private boolean sendFlowMail(SelfCheckReminderEmailVO emailVO, String token) {
        try {
            JSONArray userList = buildUserList(emailVO);

            JSONObject params = new JSONObject();
            params.put("subject", emailVO.getProjName() + "项目清单自查通知");
            params.put("body", buildFlowEmailBody(emailVO));
            params.put("mailFrom", SENDER_EMAIL);
            params.put("bodyFormat", "HTML");
            String msgBody = params.toString();
            String userInfos = userList.toString();

            log.info("流程邮件请求参数：msgBody={}, userInfos={}", msgBody, userInfos);

            return doSendEmail(msgBody, userInfos, token, emailVO);

        } catch (Exception e) {
            log.error("发送流程邮件异常：pkId={}", emailVO.getPkId(), e);
            return false;
        }
    }

    private JSONArray buildUserList(SelfCheckReminderEmailVO emailVO) {
        JSONArray userList = new JSONArray();
        JSONObject u = new JSONObject();
        u.put("custId", emailVO.getReceiveUserId());
        u.put("custType", -1);
        u.put("mobile", null);
        u.put("email", emailVO.getUserEmail());
        u.put("ext1", "to");
        userList.add(u);

        log.info("邮件接收人信息：custId={}, email={}", emailVO.getReceiveUserId(), emailVO.getUserEmail());
        return userList;
    }

    private boolean doSendEmail(String msgBody, String userInfos, String token, SelfCheckReminderEmailVO emailVO) {
        try {
            String emailUrl = String.format("http://%s/open_api/sendMsg/sendNew?access_token=%s", TX_SERVER, token);
            MultiValueMap<String, Object> map = new LinkedMultiValueMap<>();
            map.add("msgBody", msgBody);
            map.add("sendType", 0);
            map.add("sysType", SYS_TYPE);
            map.add("userInfos", userInfos);

            String postRes = restTemplate.postForObject(emailUrl, map, String.class);
            log.info("邮件发送响应：{}", postRes);
            JSONObject jsonObject = JSON.parseObject(postRes);

            String code = jsonObject.getString("code");
            if ("0".equalsIgnoreCase(code)) {
                log.info("邮件发送成功：pkId={}, projName={}", emailVO.getPkId(), emailVO.getProjName());
                return true;
            } else {
                String msg = jsonObject.getString("msg");
                log.error("邮件发送失败：code={}, msg={}, pkId={}", code, msg, emailVO.getPkId());
                return false;
            }

        } catch (Exception e) {
            log.error("发送邮件请求异常：pkId={}", emailVO.getPkId(), e);
            return false;
        }
    }

    private String buildReminderEmailBody(SelfCheckReminderEmailVO emailVO) {
        StringBuilder sb = new StringBuilder();
        sb.append("<p>你还未完成").append(emailVO.getProjName()).append("项目的清单自查工作，请按照以下通知的要求尽快做好相应工作</p>");
        if (emailVO.getContent() != null && !emailVO.getContent().isEmpty()) {
            sb.append(emailVO.getContent());
        }
        return sb.toString();
    }

    private String buildFlowEmailBody(SelfCheckReminderEmailVO emailVO) {
        StringBuilder sb = new StringBuilder();
        sb.append("<p>请按要求完成").append(emailVO.getProjName()).append("项目的清单自查工作</p>");
        if (emailVO.getContent() != null && !emailVO.getContent().isEmpty()) {
            sb.append(emailVO.getContent());
        }
        return sb.toString();
    }

    private void updateSendStatus(String pkId, String sendStatus) {
        flowInstMapper.updateSendStatus(pkId, sendStatus);
    }

    private void updateErrorInfo(String pkId, String errInfo) {
        flowInstMapper.updateErrorAndStatus(pkId, errInfo, "0");
    }
}