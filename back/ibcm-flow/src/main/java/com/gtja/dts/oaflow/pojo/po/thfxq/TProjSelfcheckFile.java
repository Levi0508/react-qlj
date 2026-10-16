package com.gtja.dts.oaflow.pojo.po.thfxq;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("T_PROJ_SELFCHECK_FILE")
public class TProjSelfcheckFile {
    private String checkBatchId;
    private String id;
    private String name;
    private Long fileSize;
    private String extension;
    private String createBy;
    private String createTime;
    private String filePath;
    private String status;
    private String displayName;
    private String fullFileName;
}