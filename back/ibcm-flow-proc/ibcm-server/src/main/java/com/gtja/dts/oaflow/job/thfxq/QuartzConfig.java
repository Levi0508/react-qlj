package com.gtja.dts.oaflow.job.thfxq;

import org.quartz.JobDetail;
import org.quartz.Trigger;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.quartz.CronTriggerFactoryBean;
import org.springframework.scheduling.quartz.JobDetailFactoryBean;

@Configuration
@ConditionalOnProperty(prefix = "schedule", name = "enabled", havingValue = "true", matchIfMissing = true)
public class QuartzConfig {

    @Bean
    public JobDetailFactoryBean autoEmailSenderJobDetail() {
        JobDetailFactoryBean factoryBean = new JobDetailFactoryBean();
        factoryBean.setJobClass(AutoEmailSender.class);
        factoryBean.setName("autoEmailSenderJob");
        factoryBean.setGroup("emailJobGroup");
        factoryBean.setDurability(true);
        return factoryBean;
    }

    @Bean
    public CronTriggerFactoryBean autoEmailSenderTrigger(JobDetail autoEmailSenderJobDetail) {
        CronTriggerFactoryBean factoryBean = new CronTriggerFactoryBean();
        factoryBean.setJobDetail(autoEmailSenderJobDetail);
        factoryBean.setCronExpression("0 * * * * ?");
        factoryBean.setName("autoEmailSenderTrigger");
        factoryBean.setGroup("emailTriggerGroup");
        return factoryBean;
    }
}