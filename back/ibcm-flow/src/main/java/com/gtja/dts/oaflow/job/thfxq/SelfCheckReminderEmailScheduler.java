package com.gtja.dts.oaflow.job.thfxq;

import cn.hutool.extra.spring.SpringUtil;
import com.gtja.dts.oaflow.service.thfxq.SelfCheckReminderEmailService;
import lombok.extern.slf4j.Slf4j;
import org.quartz.JobExecutionContext;
import org.springframework.scheduling.quartz.QuartzJobBean;

@Slf4j
public class SelfCheckReminderEmailScheduler extends QuartzJobBean {

    @Override
    protected void executeInternal(JobExecutionContext context) {
        System.out.println("=== 催办邮件定时任务开始执行 ===");
        try {
            SelfCheckReminderEmailService reminderEmailService = SpringUtil.getBean(SelfCheckReminderEmailService.class);
            String result = reminderEmailService.executeReminderTask();
            System.out.println("催办邮件任务执行结果: " + result);
        } catch (Exception e) {
            System.out.println("催办邮件定时任务执行异常: " + e.getMessage());
        } finally {
            System.out.println("=== 催办邮件定时任务执行结束 ===");
        }
    }
}