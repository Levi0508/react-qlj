package com.gtja.dts.oaflow;

import com.gtja.dts.oaflow.config.CrossFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

//@EnableEurekaClient
@SpringBootApplication
public class OaFlowApplication {

	private static final Logger log = LoggerFactory.getLogger(OaFlowApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(OaFlowApplication.class, args);
	}

	@Bean
	public ApplicationRunner scheduleEnabledLogger(Environment environment) {
		return args -> {
			String enabled = environment.getProperty("schedule.enabled", "true");
			if ("false".equalsIgnoreCase(enabled)) {
				log.info("定时任务总开关 schedule.enabled=false，业务定时任务不执行");
			} else {
				log.info("定时任务总开关 schedule.enabled={}，业务定时任务按原配置执行", enabled);
			}
		};
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
