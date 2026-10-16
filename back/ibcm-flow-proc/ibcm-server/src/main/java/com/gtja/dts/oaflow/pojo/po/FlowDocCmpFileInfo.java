package com.gtja.dts.oaflow.pojo.po;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.Tolerate;

import java.util.Date;

/**
 * @author wxx
 * @date 2021-08-26 15:17
 */
@Data
@Builder
@TableName(value = "FLOW_DOC_CMP_FILE_INFO")
public class FlowDocCmpFileInfo {
    /** 文件id */
    private String fileId;

    /** 文件名称 */
    private String fileName;

    /** 上传人 */
    private String uploadUser;

    /** 创建时间 */
    private Date createTime;

    /** 桶名称 */
    private String bucket;

    /** piid */
    private String piid;

    /** 系统id */
    private String systemId;

    /** 文种 */
    private String flowCode;


    @Tolerate
    private FlowDocCmpFileInfo() {}
}
