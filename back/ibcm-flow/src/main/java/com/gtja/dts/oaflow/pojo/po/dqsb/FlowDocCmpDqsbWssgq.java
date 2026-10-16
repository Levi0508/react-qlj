package com.gtja.dts.oaflow.pojo.po.dqsb;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

/**
 * @author wxx
 * @date 2023-03-28 14:06
 */
@Data
@TableName("FLOW_DOC_CMP_DQSB_WSSGQ")
public class FlowDocCmpDqsbWssgq {

    private String tzrxm;
    private String cyrq;
    private String gsmc;
    private String tyshxym;
    private String ytzje;
    private String cygfzb;
    private String sfwgsskr;
    private String sfczglgx;
    private String sfyssjh;
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
