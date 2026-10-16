package com.gtja.dts.oaflow.pojo.vo.thfxq;

import com.gtja.dts.oaflow.pojo.po.thfxq.RelatedInfo;
import lombok.Data;

import java.util.List;

@Data
public class UpdateOrganEntityRequest {
    private String clientId;
    private String relatedName;
    private List<RelatedInfo> organEntityList;
    private String createUser;
}
