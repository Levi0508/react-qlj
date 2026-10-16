package com.gtja.dts.oaflow.job.thfxq;
import cn.hutool.extra.spring.SpringUtil;
import com.gtja.dts.oaflow.service.thfxq.ThfxqService;
import org.quartz.JobExecutionContext;
import lombok.extern.log4j.Log4j2;

import org.springframework.scheduling.quartz.QuartzJobBean;

@Log4j2
public class AutoEmailSender extends QuartzJobBean{
    @Override
    protected void executeInternal(JobExecutionContext context) {
//        EmailService emailService = SpringUtil.getBean(EmailService.class);
        ThfxqService emailService = SpringUtil.getBean(ThfxqService.class);
        try {
            System.out.println("=== 执行邮件发送 ===");
            emailService.mailScheduled();
        } catch (Exception e) {
            log.error("邮件配置表扫描邮件发送失败：",e);
            throw new RuntimeException(e);
        }
    }

}
