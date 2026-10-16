package com.gtja.dts.oaflow.pojo.vo.thfxq;

import lombok.Data;

/**
 * 文件预览响应VO
 */
@Data
public class FilePreviewVO {
    private String previewUrl;
    private String fileName;
    private String fileType;
    private Long fileSize;
}