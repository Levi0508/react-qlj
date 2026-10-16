package com.gtja.dts.oaflow.pojo.po.thfxq;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("T_TH_APPR_DETAIL")
public class ApprDetail {
    private String clientId;
    private String auditId;
    private String auditSeq;
    private String auditDesc;
    private String disposeDesc;
    private String score;
    private String pkId;
    private String createUser;
    private String createTime;
    private String updateUser;
    private String updateTime;
    private String batchDisplayName;
    private String batchRemark;
    private String batchCreateTime;
    private String batchCreateUser;
}
