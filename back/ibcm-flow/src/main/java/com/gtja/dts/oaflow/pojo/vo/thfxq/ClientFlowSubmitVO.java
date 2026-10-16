package com.gtja.dts.oaflow.pojo.vo.thfxq;

import lombok.Data;

@Data
public class ClientFlowSubmitVO {

    private String flowId;
    private String bizKey;
    private String raiseCode;

    private String clientId;
    private String clientName;
    private String organFlag;
    private String clientBelong;
    private String clientStatus;

    private String newMaintainer;
    private String maintainerUserId;
}