package com.gtja.dts.oaflow.pojo.po.dqsb;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

/**
 * @author wxx
 * @date 2023-03-28 14:03
 */
@Data
@TableName("FLOW_DOC_CMP_DQSB_JJCC")
public class FlowDocCmpDqsbJjcc {

    private String tzrxm;
    private String cyrq;
    private String jjdm;
    private String jjmc;
    private String tzjeqj;
    private String jypt;
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
