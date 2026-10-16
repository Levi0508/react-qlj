package com.gtja.dts.oaflow.pojo.po.thfxq;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("T_TH_RELAT_INFO")
public class RelatedInfo {
    private String clientId;
    private String relatedId;
    private String relatedType;
    private String organFlag;
    private String relatedName;
    private String nationality;
    private String idType;
    private String idNo;
    private String idBegindate;
    private String idEnddate;
    private String birthday;
    private String shareholdingRatio;
    private String beneficiary;
    private String address;
    private String mobno1;
    private String isGovernmentDept;
    private String objectId;
    private String createUser;
    private String createTime;
    private String updateUser;
    private String updateTime;
    private String dataStatus;
}
