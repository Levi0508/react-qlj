package com.gtja.dts.oaflow.pojo.po.tyglryj;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

/**
 * @author wxx
 * @date 2023-06-14 17:05
 */
@Data
@TableName("FLOW_DOC_CMP_TYGLRYJ")
public class FlowDocCmpTyglryj {


    private String occurDate;
    private String occurTime;
    private String ruleId;
    private String ruleName;
    private String branchNo;
    private String branchName;
    private String managerName;
    private String marketId;
    private String marketName;
    private String warningType;
    private String warningWeight;
    private String details;
    private String idNo;
    private String endTime;
    private String pkId;

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
    private String sysDeleteUser;
    private String sysUseStatus;

}
