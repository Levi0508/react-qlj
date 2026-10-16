package com.gtja.dts.oaflow.pojo.vo;

import com.alibaba.fastjson.annotation.JSONField;
import lombok.Data;

/**
 * @author wxx
 * @date 2023-05-15 11:15
 */
@Data
public class FileResultVo {

    @JSONField(name = "FILE_PATH")
    private String filePath;
    @JSONField(name = "FILE_NAME")
    private String fileName;

    public FileResultVo(String filePath, String fileName) {
        this.filePath = filePath;
        this.fileName = fileName;
    }
}
