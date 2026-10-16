package com.gtja.dts.oaflow.pojo.po.dqsb;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

/**
 * @author wxx
 * @date 2023-03-28 14:09
 */
@Data
@TableName("FLOW_DOC_CMP_DQSB_ZQCC")
public class FlowDocCmpDqsbZqcc {

    private String tzrxm;
    private String cyrq;
    private String zqdm;
    private String zqmc;
    private String sc;
    private String zhhm;
    private String cysl;
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

}
