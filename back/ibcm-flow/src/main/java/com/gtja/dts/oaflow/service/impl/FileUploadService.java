package com.gtja.dts.oaflow.service.impl;

import com.gtja.dts.oaflow.models.FlowConstant;
import com.gtja.dts.oaflow.models.FtpProperties;
import com.gtja.dts.oaflow.models.SmbClientProperties;
import com.gtja.dts.oaflow.pojo.dto.WbDownloadDto;
import com.gtja.dts.oaflow.pojo.vo.FileResultVo;
import com.gtja.dts.oaflow.utils.DateTimeUtil;
import com.gtja.dts.oaflow.utils.FileToolUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.UUID;

/**
 * @author wxx
 * @date 2023-05-15 10:20
 */
@RequiredArgsConstructor
@Service
@Slf4j
public class FileUploadService {

    private final SmbClientProperties smbClientProperties;

    @Value("${file.save.path}")
    private String url;
    @Value("${file.hgpt.local.path}")
    private String localUrl;

    public FileResultVo saveFile(MultipartFile file){
        String filePath = "";
        String fileName = "";
        String uuidStr = UUID.randomUUID() + "";
        String now = DateTimeUtil.getCurrentDateStr();
        String saveFilePath = url + now + "\\" + uuidStr;
        //保存文件
        boolean isSaveFile = FileToolUtils.fileUtil(file, saveFilePath);
        if(isSaveFile){
            fileName = file.getOriginalFilename();
            filePath = saveFilePath + "\\";
        }
        return  new FileResultVo(filePath,fileName);
    }

    public void downloadFormExcel(HttpServletResponse response, String filePath, String fileName) throws UnsupportedEncodingException {
        //存在共享文件夹的
        if(StringUtils.startsWithIgnoreCase(filePath,"E:")){
            String remoteNewFilePath = filePath.replace("E:",localUrl);
            FileToolUtils.downloadFileByPath(response,remoteNewFilePath,fileName);
        }else{
            FileToolUtils.downloadFileByPath(response,filePath,fileName);
        }

    }
}
