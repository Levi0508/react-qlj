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
        log.info("=== 清单催办邮件定时任务开始执行 ===");
        System.out.println("=== 清单催办邮件定时任务开始执行 ===");
        try {
            SelfCheckReminderEmailService reminderEmailService = SpringUtil.getBean(SelfCheckReminderEmailService.class);
            String result = reminderEmailService.executeReminderTask();
            log.info("催办邮件任务执行结果：{}", result);
            System.out.println("催办邮件任务执行结果: " + result);
        } catch (Exception e) {
            log.error("清单催办邮件定时任务执行异常", e);
            System.out.println("清单催办邮件定时任务执行异常: " + e.getMessage());
        } finally {
            log.info("=== 清单催办邮件定时任务执行结束 ===");
            System.out.println("=== 清单催办邮件定时任务执行结束 ===");
        }
    }
}