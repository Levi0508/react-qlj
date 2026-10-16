package com.gtja.dts.oaflow.config;

import javax.servlet.http.HttpServletResponse;

import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

public class MyInterceptor implements HandlerInterceptor  {

	@Override
	public void afterCompletion(javax.servlet.http.HttpServletRequest arg0, HttpServletResponse arg1, Object arg2,
			Exception arg3) throws Exception {
		
	}

	@Override
	public void postHandle(javax.servlet.http.HttpServletRequest req, HttpServletResponse resp, Object arg2,
			ModelAndView arg3) throws Exception {
		
	}

	@Override
	public boolean preHandle(javax.servlet.http.HttpServletRequest req, HttpServletResponse resp, Object arg2)
			throws Exception {
		resp.setHeader("Access-Control-Allow-Credentials", "true");
		//设置可跨域资源共享的域名，只能设置一个具体的域名，但*可以代表所有
		resp.setHeader("Access-Control-Allow-Origin", req.getHeader("Origin"));
		//设置可跨域资源共享的请求方式
	    resp.setHeader("Access-Control-Allow-Methods","GET,POST,PUT,DELETE,OPTIONS,HEAD");
	    resp.setHeader("Access-Control-max-age","1728000"); 
	    resp.setHeader("Access-Control-Allow-Headers" ,"Origin, No-Cache, X-Requested-With, If-Modified-Since, Pragma, Last-Modified, Cache-Control, Expires, Content-Type, X-E4M-With");
		return true;
	}

}
