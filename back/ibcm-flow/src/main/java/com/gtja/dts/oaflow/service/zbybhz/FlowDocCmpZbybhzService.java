package com.gtja.dts.oaflow.service.zbybhz;


/**
 * @author wxx
 * @date 2023-04-27 14:02
 */
public interface FlowDocCmpZbybhzService {

    /**
     * 起草
     * @param reportMonth
     * @param deptId
     * @param applyTitle
     * @param creator
     * @return
     */
    String draft(String reportMonth,String deptId,String applyTitle,String creator,String reportCode);

}
