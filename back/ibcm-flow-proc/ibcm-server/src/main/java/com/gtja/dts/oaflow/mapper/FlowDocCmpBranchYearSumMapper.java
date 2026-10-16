package com.gtja.dts.oaflow.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gtja.dts.oaflow.pojo.po.nbhz.FlowDocCmpBranchYearSum;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * @author wxx
 * @date 2023-04-27 14:04
 */
public interface FlowDocCmpBranchYearSumMapper extends BaseMapper<FlowDocCmpBranchYearSum> {

    /**
     *  获取年报主表数据
     *
     * @param piid
     * @return
     */
    @Select("select * from flow_doc_cmp_branch_year_sum t where t.sys_piid = #{piid} and t.sys_use_status = '1' ")
    List<FlowDocCmpBranchYearSum> findYearSumInfoByPiid(@Param("piid") String piid);


    /**
     *  获取部门名称
     *
     * @param deptId
     * @return
     */
    @Select("select t.dept_name from basic_hg.wb_dept t where t.DEPT_ID = #{deptId} and rownum = 1 ")
    String findDeptNameByDeptId(@Param("deptId") String deptId);

    /**
     *  获取起草人Name
     *
     * @param userId
     * @return
     */
    @Select("select t.display_name from basic_hg.wb_user t where t.staff_id = #{userId} and rownum = 1 ")
    String findUserNameByUserId(@Param("userId") String userId);

    /**
     *  获取起草人Name
     *
     * @param userId
     * @return
     */
    @Select("select t.display_name from basic_hg.wb_user t where t.user_id = #{userId} and rownum = 1 ")
    String findUserNameByEhrId(@Param("userId") String userId);


}
