package com.gtja.dts.oaflow.pojo.vo.thfxq;

import lombok.Data;

@Data
public class SaveApprListRequest {
    private String clientId;
    private String auditId;
    private String remark;
    private String createUser;
}
