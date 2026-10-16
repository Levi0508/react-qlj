package com.gtja.dts.oaflow.pojo.vo.thfxq;

import lombok.Data;

@Data
public class SaveApprDetailRequest {
    private ApprDetailItem[] batchList;

    @Data
    public static class ApprDetailItem {
        private String clientId;
        private String auditId;
        private String auditSeq;
        private String auditDesc;
        private String disposeDesc;
    }
}
