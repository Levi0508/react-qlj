package com.gtja.dts.oaflow.pojo.po.dqsb;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

/**
 * @author wxx
 * @date 2023-03-29 10:06
 */
@Data
@TableName("FLOW_DOC_CMP_DQSB_ZQJY")
public class FlowDocCmpDqsbZqjy {

    private String tzrxm;
    private String jyrq;
    private String zqdm;
    private String zqmc;
    private String sc;
    private String zhhm;
    private String jyfx;
    private String jysl;
    private String qmye;
    private String cjjg;
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
