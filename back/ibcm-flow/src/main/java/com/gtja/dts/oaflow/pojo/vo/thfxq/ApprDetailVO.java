package com.gtja.dts.oaflow.pojo.vo.thfxq;

import lombok.Data;
import java.util.List;

@Data
public class ApprDetailVO {
    private List<ApprDetailItem> batchList;
    private String createUser;
    
    @Data
    public static class ApprDetailItem {
        private String clientId;
        private String auditId;
        private String auditSeq;
        private String auditDesc;
        private String disposeDesc;
    }
}
