package com.gtja.dts.oaflow.pojo.vo.thfxq;

import lombok.Data;

@Data
public class DeleteOrganEntityRequest {
    private String clientId;
    private String organFlag;
    private String relatedType;
    private String relatedId;
    private String dataStatus;
}
