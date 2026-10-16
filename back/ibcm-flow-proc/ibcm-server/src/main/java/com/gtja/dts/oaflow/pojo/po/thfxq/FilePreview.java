package com.gtja.dts.oaflow.pojo.po.thfxq;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件预览数据类
 */
@Data
public class FilePreview {
    private MultipartFile file;
    private String fileName;
    private String previewUrl;
    private String fileType;
    private Long fileSize;
}