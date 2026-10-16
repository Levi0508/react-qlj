package com.gtja.dts.oaflow.pojo.po.zbybhz;

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
@TableName("FLOW_DOC_CMP_ZBYBHZ")
public class FlowDocCmpZbybhz {
    private String fillingDate;
    private String reportMonth;
    private String deptName;
    private String deptId;
    private String creator;
    private String creatorName;
    private String applyTitle;
    private String reportCode;

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


}
