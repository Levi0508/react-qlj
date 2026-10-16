package com.gtja.dts.oaflow.pojo.po.dqsb;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

/**
 * @author wxx
 * @date 2023-03-28 13:41
 */
@Data
@TableName("FLOW_DOC_CMP_DQSBPCL")
public class FlowDocCmpDqsb {

    private String ygxm;
    private String ygxmId;
    private String ssbm;
    private String ssbmId;
    private String ksrq;
    private String jsrq;
    private String sbnr;
    private String ydzx1;
    private String ydzx2;
    private String ydzx3;
    private String ydzx4;
    private String xfrq;
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
    private String bt;
    private String planId;


}
