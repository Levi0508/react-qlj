package com.gtja.dts.oaflow.pojo.po.thfxq;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("TB_PROJLIST_CHECK_RESULT")
public class TbProjlistCheckResult {
    private String processId;
    private String projid;
    private String batchId;
    private String inoutId;
    private String checkId;
    private String checkResult;
    private String remark;
    private String createUser;
    private String createTime;
    private String uploadId;
    private String updateUser;
    private String updateTime;
}