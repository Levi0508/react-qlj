package com.gtja.dts.oaflow.service;



import com.baomidou.mybatisplus.extension.service.IService;
import com.gtja.dts.oaflow.pojo.po.nbhz.FlowDocCmpBranchYearSum;

import java.util.List;

/**
 * @author wxx
 * @date 2023-04-27 14:02
 */
public interface FlowDocCmpBranchYearSumService extends IService<FlowDocCmpBranchYearSum> {

    /**
     *  根据piid获取主表数据
     * @param piid
     * @return
     */
    List<FlowDocCmpBranchYearSum> findYearSumInfoByPiid(String piid);

    /**
     * 起草
     * @param reportYear
     * @param deptId
     * @param applyTitle
     * @param creator
     * @param ishalfyear
     * @return
     */
    String draft(String reportYear,String deptId,String applyTitle,String creator,String ishalfyear, String udf1);
}
