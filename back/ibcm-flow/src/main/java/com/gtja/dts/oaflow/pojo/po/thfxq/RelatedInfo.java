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

    private String companyType;
    private String boType;
    private String fullInfoFlag;
    private String bnfType;
    private String gender;
    private String mobno2;
    private String actctrl;
    private String acthdrat;
    private String shareratiostartdate;
    private String shareratioenddate;
    private String actctrlcpny;
    private String actctrltype;
    private String obtainactdate;
    private String terminationactdate;
    private String actotherforms;
    private String actconuppermarket;
    private String actconupperentname;
    private String actconuniscid;
    private String pribenfit;
    private String actownerprofitratio;
    private String profitratiostartdate;
    private String profitratioenddate;
    private String actownerprofitratiovote;
    private String profitratiovotestartdate;
    private String profitratiovoteenddate;
    private String seniormgr;
    private String seniormgrpos;
    private String actdailymgmtpostother;
    private String seniormgrcn;
    private String seniormgrposcn;
    private String ownerrightmgmtpostother;
}
