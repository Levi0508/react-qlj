package com.gtja.dts.oaflow.pojo.po.thfxq;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("T_TH_APPR_LIST")
public class ApprList {
    private String clientId;
    private String auditId;
    private String remark;
    private String createUser;
    private String createTime;
    private String updateUser;
    private String updateTime;
}
