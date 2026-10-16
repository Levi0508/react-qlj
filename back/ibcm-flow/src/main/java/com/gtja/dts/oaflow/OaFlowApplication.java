package com.gtja.dts.oaflow;

import com.gtja.dts.oaflow.config.CrossFilter;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;

//@EnableEurekaClient
@SpringBootApplication
public class OaFlowApplication {

	public static void main(String[] args) {
		SpringApplication.run(OaFlowApplication.class, args);
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
