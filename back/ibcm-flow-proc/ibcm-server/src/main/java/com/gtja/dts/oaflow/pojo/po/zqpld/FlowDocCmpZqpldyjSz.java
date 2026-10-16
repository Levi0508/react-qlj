package com.gtja.dts.oaflow.pojo.po.zqpld;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

/**
 * @author wxx
 * @date 2023-06-14 17:05
 */
@Data
@TableName("FLOW_DOC_CMP_ZQPLDYJ_SZ")
public class FlowDocCmpZqpldyjSz {
    private String operateDate;
    private String operateTime;
    private String branchNo;
    private String branchName;
    private String market;
    private String bondValuation;
    private String securityValuation;
    private String customerName;
    private String securityAccount;
    private String securityId;
    private String securityName;
    private String orderTime;
    private String bsFlag;
    private Integer orderQty;
    private String matchTime;
    private Integer matchQty;
    private Double matchPrice;
    private String compareBaseline;
    private String baselineDegree;
    private String causeClassify;
    private String reasonDescription;
    private Double chDebtRatio;
    private Double chSecuRatio;
    private String flowSubmitStatus;
    private String accountCategoryL1;
    private String accountCategoryL2;
    private String ordersno;


    private String flowNo;
    private String opway;
    private Double orderamt;
    private Double matchamt;
    private String orderDate;

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
