package com.gtja.dts.oaflow.pojo.po.nbhz;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

/**
 * 分支机构合规风控月报汇总_主表
 *
 * @author wxx
 * @date 2023-04-27 13:59
 */
@Data
@TableName("FLOW_DOC_CMP_BRANCH_YEAR_SUM")
public class FlowDocCmpBranchYearSum {
    private String fillingDate;
    private String reportYear;
    private String deptName;
    private String deptId;
    private String reportPerson;
    private String remark;
    private String applyTitle;
    private String reportType;
    private String ishalfyear;


    private Date sysCreateTime;
    private Date sysUpdateTime;
    private String sysCreateUser;
    private String sysUpdateUser;
    private String sysPiid;
    private String sysTiid;
    private String sysGuid;
    private String sysTenantCode;
    private String sysSystemId;
    private String sysFlowCode;
    private String sysUseStatus;
    private String creator;
}
