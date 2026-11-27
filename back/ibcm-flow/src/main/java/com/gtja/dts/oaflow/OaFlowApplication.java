package com.gtja.dts.oaflow;

import com.gtja.dts.oaflow.config.CrossFilter;
import com.gtja.dts.oaflow.models.FixedTimeTask;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.TriggerKey;
import org.quartz.impl.matchers.GroupMatcher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.lang.Nullable;
import org.springframework.scheduling.annotation.ScheduledAnnotationBeanPostProcessor;
import org.springframework.scheduling.config.ScheduledTask;
import org.springframework.scheduling.support.ScheduledMethodRunnable;

import java.util.Collections;
import java.util.Set;
import java.util.TreeSet;

//@EnableEurekaClient
@SpringBootApplication
public class OaFlowApplication {

	private static final Logger log = LoggerFactory.getLogger(OaFlowApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(OaFlowApplication.class, args);
	}

	@Bean
	public ApplicationRunner scheduleEnabledLogger(Environment environment, @Nullable Scheduler scheduler,
			@Nullable ScheduledAnnotationBeanPostProcessor scheduledTasks) {
		return args -> {
			String enabled = environment.getProperty("schedule.enabled", "true");
			if ("false".equalsIgnoreCase(enabled)) {
				log.info("定时任务总开关 schedule.enabled=false，业务定时任务不执行");
			} else {
				log.info("定时任务总开关 schedule.enabled={}，业务定时任务按原配置执行", enabled);
			}
			String autoState = environment.getProperty("auto.state", "未配置");
			boolean bondTaskRegistered = isBondTaskRegistered(scheduledTasks);
			try {
				Set<TriggerKey> triggers = scheduler == null ? Collections.emptySet()
						: new TreeSet<>(scheduler.getTriggerKeys(GroupMatcher.anyTriggerGroup()));
				log.info("SCHEDULE_CHECK schedule.enabled={} Quartz触发器数={} 触发器={} 债券预警任务已注册={} auto.state={}",
						enabled, triggers.size(), triggers, bondTaskRegistered, autoState);
			} catch (SchedulerException ex) {
				log.warn("SCHEDULE_CHECK schedule.enabled={} Quartz触发器读取失败 债券预警任务已注册={} auto.state={}",
						enabled, bondTaskRegistered, autoState, ex);
			}
		};
	}

	private boolean isBondTaskRegistered(@Nullable ScheduledAnnotationBeanPostProcessor scheduledTasks) {
		if (scheduledTasks == null) {
			return false;
		}
		for (ScheduledTask task : scheduledTasks.getScheduledTasks()) {
			Runnable runnable = task.getTask().getRunnable();
			if (runnable instanceof ScheduledMethodRunnable
					&& ((ScheduledMethodRunnable) runnable).getTarget() instanceof FixedTimeTask) {
				return true;
			}
		}
		return false;
	}

	/**
	 * 配置跨域访问的过滤器
	 * @return
	 */
	@Bean
	public FilterRegistrationBean registerFilter(){
		FilterRegistrationBean bean = new FilterRegistrationBean();
		bean.addUrlPatterns("/*");
		bean.setFilter(new CrossFilter());
		return bean;
	}
}
