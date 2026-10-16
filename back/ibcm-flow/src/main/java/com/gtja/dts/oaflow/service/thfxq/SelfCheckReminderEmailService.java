package com.gtja.dts.oaflow.service.thfxq;

/**
 * 清单自查催办邮件服务接口
 * 
 * @author CodeBuddy
 * @date 2026-08-05
 */
public interface SelfCheckReminderEmailService {
    
    /**
     * 执行催办邮件发送任务（flow_code = proj_selfcheck_remind）
     * 
     * @return 执行结果描述
     */
    String executeReminderTask();

    /**
     * 执行清单自查流程邮件发送任务（flow_code = proj_selfchek_mail）
     * 
     * @return 执行结果描述
     */
    String executeFlowMailTask();
}
