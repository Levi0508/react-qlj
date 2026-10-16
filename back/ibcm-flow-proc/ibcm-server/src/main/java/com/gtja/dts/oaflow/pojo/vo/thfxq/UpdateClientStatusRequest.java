package com.gtja.dts.oaflow.pojo.vo.thfxq;

import lombok.Data;

@Data
public class UpdateClientStatusRequest {
    private String clientId;
    private String opFlag;
    private String userName;
    private String returnMsg;
    private String returnCode;
}
