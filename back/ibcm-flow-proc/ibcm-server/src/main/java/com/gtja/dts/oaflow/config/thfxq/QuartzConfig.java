package com.gtja.dts.oaflow.config.thfxq;


import com.gtja.dts.oaflow.job.thfxq.AutoEmailSender;
import com.gtja.dts.oaflow.job.thfxq.ClientIdExpiryFlowScheduler;
import com.gtja.dts.oaflow.job.thfxq.SelfCheckFlowEmailScheduler;
import com.gtja.dts.oaflow.job.thfxq.SelfCheckFlowScheduler;
import com.gtja.dts.oaflow.job.thfxq.SelfCheckReminderEmailScheduler;
import org.quartz.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration("autoEmailQuartzConfig")
public class QuartzConfig {

    @Bean
    public JobDetail autoEmailJobDetail() {
        return JobBuilder.newJob(AutoEmailSender.class)
                .withIdentity("autoEmailJob", "emailGroup")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger autoEmailTrigger() {
        CronScheduleBuilder scheduleBuilder = CronScheduleBuilder.cronSchedule("0 * * * * ?");
        return TriggerBuilder.newTrigger()
                .forJob(autoEmailJobDetail())
                .withIdentity("autoEmailTrigger", "emailGroup")
                .withSchedule(scheduleBuilder)
                .build();
    }

    @Bean
    public JobDetail selfCheckFlowJobDetail() {
        return JobBuilder.newJob(SelfCheckFlowScheduler.class)
                .withIdentity("selfCheckFlowJob", "selfCheckGroup")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger selfCheckFlowTrigger() {
        CronScheduleBuilder scheduleBuilder = CronScheduleBuilder.cronSchedule("0 * * * * ?");
        return TriggerBuilder.newTrigger()
                .forJob(selfCheckFlowJobDetail())
                .withIdentity("selfCheckFlowTrigger", "selfCheckGroup")
                .withSchedule(scheduleBuilder)
                .build();
    }

    @Bean
    public JobDetail selfCheckReminderEmailJobDetail() {
        return JobBuilder.newJob(SelfCheckReminderEmailScheduler.class)
                .withIdentity("selfCheckReminderEmailJob", "selfCheckGroup")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger selfCheckReminderEmailTrigger() {
        CronScheduleBuilder scheduleBuilder = CronScheduleBuilder.cronSchedule("0 * * * * ?");
        return TriggerBuilder.newTrigger()
                .forJob(selfCheckReminderEmailJobDetail())
                .withIdentity("selfCheckReminderEmailTrigger", "selfCheckGroup")
                .withSchedule(scheduleBuilder)
                .build();
    }

    @Bean
    public JobDetail selfCheckFlowEmailJobDetail() {
        return JobBuilder.newJob(SelfCheckFlowEmailScheduler.class)
                .withIdentity("selfCheckFlowEmailJob", "selfCheckGroup")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger selfCheckFlowEmailTrigger() {
        CronScheduleBuilder scheduleBuilder = CronScheduleBuilder.cronSchedule("0 * * * * ?");
        return TriggerBuilder.newTrigger()
                .forJob(selfCheckFlowEmailJobDetail())
                .withIdentity("selfCheckFlowEmailTrigger", "selfCheckGroup")
                .withSchedule(scheduleBuilder)
                .build();
    }

    @Bean
    public JobDetail clientIdExpiryFlowJobDetail() {
        return JobBuilder.newJob(ClientIdExpiryFlowScheduler.class)
                .withIdentity("clientIdExpiryFlowJob", "clientExpiryGroup")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger clientIdExpiryFlowTrigger() {
        CronScheduleBuilder scheduleBuilder = CronScheduleBuilder.cronSchedule("0 * * * * ?");
        return TriggerBuilder.newTrigger()
                .forJob(clientIdExpiryFlowJobDetail())
                .withIdentity("clientIdExpiryFlowTrigger", "clientExpiryGroup")
                .withSchedule(scheduleBuilder)
                .build();
    }
}