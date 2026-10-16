package com.gtja.dts.oaflow.pojo.po.thfxq;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

@Data
@TableName("tb_flow_inst")
public class TbFlowInst {

    private String busiDate;
    private String flowId;
    private String flowCode;
    private String raiseCode;
    private String bizKey;
    private String title;
    private String paramInfo;
    private String sendStatus;
    private Date sendTime;
    private String errorInfo;
    private String opUser;
    private Date opTime;
    private String sendRemark;
    private String thFlowId;
}
