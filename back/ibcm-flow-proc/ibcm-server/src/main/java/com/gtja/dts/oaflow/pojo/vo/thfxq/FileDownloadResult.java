package com.gtja.dts.oaflow.pojo.vo.thfxq;

import lombok.Data;
import org.springframework.core.io.Resource;

@Data
public class FileDownloadResult {
    private Resource resource;
    private String fileName;
    private String contentType;
    private long contentLength;
    
    public FileDownloadResult(Resource resource, String fileName, String contentType, long contentLength) {
        this.resource = resource;
        this.fileName = fileName;
        this.contentType = contentType;
        this.contentLength = contentLength;
    }
}