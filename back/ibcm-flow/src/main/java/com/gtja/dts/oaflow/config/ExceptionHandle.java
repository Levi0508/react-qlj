package com.gtja.dts.oaflow.config;

import com.gtja.dts.common.domain.ResponseResult;
import com.gtja.dts.common.enums.ResponseEnum;
import com.gtja.dts.common.exception.BusinessException;
import com.gtja.dts.oaflow.utils.ErrorUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.stream.Collectors;

/**
 * 扫描controller，进行全局的异常处理
 *
 * @author cl
 */
@ControllerAdvice
public class ExceptionHandle {
	private static final Logger logger = LoggerFactory.getLogger(ExceptionHandle.class);

	@SuppressWarnings("rawtypes")
	@ExceptionHandler(Exception.class)
	@ResponseBody
	public String handler(Exception e) {
		logger.error(e.getMessage(), e);
		//todo 因为 webbuilder的局限性
		return e.getMessage();
	}

	@ExceptionHandler(NullPointerException.class)
	@ResponseBody
	public String handler(NullPointerException e) {
		logger.error(e.getMessage(), e);
		//todo 因为 webbuilder的局限性
		return "导入失败，模板数据有误";
	}

	@SuppressWarnings("rawtypes")
	@ExceptionHandler(BusinessException.class)
	@ResponseBody
	public ResponseResult handler(BusinessException e) {
		return ResponseResult.fail(e.getCode(), e.getMessage());
	}

	@SuppressWarnings("rawtypes")
	@ExceptionHandler(MethodArgumentNotValidException.class)
	@ResponseBody
	public ResponseResult handler(MethodArgumentNotValidException e) {
		String errorMsg = e.getBindingResult().getAllErrors().stream().map(file -> {
			FieldError fieldError = (FieldError) file;
			return ErrorUtil.parameterErrorFormat(fieldError.getField(), fieldError.getDefaultMessage());
		}).collect(Collectors.joining());
		return ResponseResult.fail(ResponseEnum.PARAMETER_VALID_ERROR.getCode(), errorMsg);
	}

	@SuppressWarnings("rawtypes")
	@ExceptionHandler(BindException.class)
	@ResponseBody
	public ResponseResult handler(BindException e) {
		String errorMsg = e.getBindingResult().getAllErrors().stream().map(file -> {
			FieldError fieldError = (FieldError) file;
			return ErrorUtil.parameterErrorFormat(fieldError.getField(), fieldError.getDefaultMessage());
		}).collect(Collectors.joining());
		return ResponseResult.fail(ResponseEnum.PARAMETER_VALID_ERROR.getCode(), errorMsg);
	}


}
