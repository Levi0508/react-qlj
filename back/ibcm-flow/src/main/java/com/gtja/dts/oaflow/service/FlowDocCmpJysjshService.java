package com.gtja.dts.oaflow.service;

import com.gtja.dts.oaflow.pojo.po.zqpld.TbResult1808032230dOaNew;
import com.gtja.dts.oaflow.pojo.vo.JysJshVo;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.text.ParseException;

/**
 * @author wxx
 * @date 2023-06-14 17:15
 */
public interface FlowDocCmpJysjshService {

    String submitSdk(String id, String applyTitle, String creator, String flowVer,String relateCode, JysJshVo obj) throws IOException, ParseException;

    void downloadFile(HttpServletResponse response, String filePath, String fileName) throws UnsupportedEncodingException;
}
