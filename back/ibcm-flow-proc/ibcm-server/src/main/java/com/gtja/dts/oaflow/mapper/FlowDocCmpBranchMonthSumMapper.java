package com.gtja.dts.oaflow.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gtja.dts.oaflow.pojo.po.dqsb.FlowDocCmpDqsbJjcc;
import com.gtja.dts.oaflow.pojo.po.ybhz.FlowDocCmpBranchMonthSum;
import com.gtja.dts.oaflow.pojo.vo.BranchDataVo;
import com.gtja.dts.oaflow.pojo.vo.DicHgptMapperVo;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * @author wxx
 * @date 2023-04-27 14:04
 */
public interface FlowDocCmpBranchMonthSumMapper extends BaseMapper<FlowDocCmpBranchMonthSum> {

    /**
     *  获取定期申报数据
     *
     *  提交
     * @param piid
     * @return
     */
    @Select("select filling_date,\n" +
            "       report_month,\n" +
            "       dept_name,\n" +
            "       dept_id,\n" +
            "       report_person,\n" +
            "       serial_number,\n" +
            "       apply_title,\n" +
            "       sys_create_time,\n" +
            "       sys_update_time,\n" +
            "       sys_create_user,\n" +
            "       sys_update_user,\n" +
            "       sys_piid,\n" +
            "       sys_tiid,\n" +
            "       sys_guid,\n" +
            "       sys_tenant_code,\n" +
            "       sys_system_id,\n" +
            "       sys_flow_code,\n" +
            "       sys_use_status\n" +
            "  from flow_doc_cmp_branch_month_sum t where t.sys_piid = #{piid} and t.sys_use_status = '1' \n")
    List<FlowDocCmpBranchMonthSum> findMonthSumInfoByPiid(@Param("piid") String piid);


    /**
     *  获取部门名称
     *
     * @param deptId
     * @return
     */
    @Select("select t.dept_name from ehr01.tcl_v_dept_info_hgfk t where concat('D',t.DEPT_ID) = #{deptId} and rownum = 1 ")
    String findDeptNameByDeptId(@Param("deptId") String deptId);


    /**
     * 根据子公司的编码获取子公司的名称
     * @param deptId
     * @return
     */
    @Select("select t.branch_name from basic_hg.wb_branch_new t where t.branch_id = #{deptId} and rownum = 1 ")
    String getSubCompNameByDeptId(@Param("deptId") String deptId);


    /**
     *  获取起草人Name
     *
     * @param userId
     * @return
     */
    @Select("select t.username from ehr01.tcl_v_emp_info_hgfk t where (t.staff_id = #{userId} or t.ehr_id = #{userId}) and rownum = 1 ")
    String findUserNameByUserId(@Param("userId") String userId);

    /**
     *  获取起草人部门Name
     *
     * @param userId
     * @return
     */
    @Select("select t.dept_id from basic_hg.wb_user t where t.user_id = #{userId} and rownum = 1 ")
    String findDeptNameByUserId(@Param("userId") String userId);

    /**
     *  获取起草人部门ID
     *
     * @param userId
     * @return
     */
    @Select("select t.dept_name from basic_hg.wb_user t where t.user_id = #{userId} and rownum = 1 ")
    String findDeptIdByUserId(@Param("userId") String userId);

    /**
     *
     *  获取字典
     * @param partType
     * @param sysId
     * @return
     */
    @Select("select part_type, dic_code, dic_val, sys_id, dic_item, parent_item " +
            "from tb_dic_hgpt_mapper t where t.part_type = #{partType} and t.sys_id = #{sysId} ")
    List<DicHgptMapperVo> findDicValueByType(@Param("partType") String partType, @Param("sysId") String sysId);

    /**
     *  获取分支机构列表
     *
     * @param userId
     * @return
     */
    @Select("select distinct   rr.resource_id as dept_id,\n" +
            "                  b.branch_name  as dept_name,\n" +
            "                  b.prarent_id   as parent_dept_id\n" +
            "        from basic_hg.wb_role_resource rr\n" +
            "       inner join basic_hg.wb_branch b\n" +
            "          on rr.resource_id = b.branch_id\n" +
            "       where \n" +
            "         (rr.role_id in (select t.role_id from basic_hg.wb_user_role t  where t.user_id = #{userId})\n" +
            "         or 'admin' in (select t.role_id from basic_hg.wb_user_role t  where t.user_id = #{userId}))\n" +
            "         and rr.resource_type = 2\n" +
            "         and (b.prarent_id = '18' and\n" +
            "             rr.resource_id not in ('8093',\n" +
            "                                     '8086',\n" +
            "                                     '7777',\n" +
            "                                     '7501',\n" +
            "                                     '7028',\n" +
            "                                     '7026',\n" +
            "                                     '7009',\n" +
            "                                     '7007',\n" +
            "                                     '7005',\n" +
            "                                     '7003',\n" +
            "                                     '7002',\n" +
            "                                     '7001',\n" +
            "                                     '7027',\n" +
            "                                     '7020',\n" +
            "                                     '7000') or rr.resource_id = '7003')\n" +
            "       order by decode(rr.resource_id, '18', 1, 'D0', 1, 'D2', 1, 2), rr.resource_id desc")
    List<BranchDataVo> findBranchByUserId(@Param("userId") String userId);



    /**
     *  获取分支机构列表
     *
     * @param userId
     * @return
     */
    @Select("select distinct   rr.resource_id as dept_id,\n" +
            "                              b.branch_name  as dept_name,\n" +
            "                              b.prarent_id   as parent_dept_id\n" +
            "                    from basic_hg.wb_role_resource rr\n" +
            "                   inner join basic_hg.wb_branch b\n" +
            "                      on rr.resource_id = b.branch_id\n" +
            "                   where \n" +
            "                      rr.resource_type = 2\n" +
            "                     and \n" +
            "                     (b.prarent_id = '18' and\n" +
            "                         rr.resource_id not in ('8093',\n" +
            "                                                 '8086',\n" +
            "                                                 '7777',\n" +
            "                                                 '7501',\n" +
            "                                                 '7028',\n" +
            "                                                 '7026',\n" +
            "                                                 '7009',\n" +
            "                                                 '7007',\n" +
            "                                                 '7005',\n" +
            "                                                 '7003',\n" +
            "                                                 '7002',\n" +
            "                                                 '7001',\n" +
            "                                                 '7027',\n" +
            "                                                 '7020',\n" +
            "                                                 '7000') or rr.resource_id = '7003')\n" +
            "                   order by decode(rr.resource_id, '18', 1, 'D0', 1, 'D2', 1, 2), rr.resource_id desc")
    List<BranchDataVo> findAllBranch(@Param("userId") String userId);


    /**
     *  获取全部分支机构列表
     *
     * @param
     * @return
     */
    @Select("SELECT * FROM EHR01.TCL_V_DEPT_INFO_HGFK t1 WHERE  t1.DISABLED ='0'  and\n" +
            "( \n" +
            "t1.PARENT_DEPT_ID IS null AND t1.COMPANY_ID IN ('comp02')\n" +
            " OR \n" +
            " t1.DEPT_ID in(\n" +
            "'1200',\n" +
            "'1202',\n" +
            "'1230',\n" +
            "'1192',\n" +
            "'0752',\n" +
            "'1480',\n" +
            "'0748',\n" +
            "'1498',\n" +
            "'1732',\n" +
            "'0013',\n" +
            "'0716',\n" +
            "'0751',\n" +
            "'0715',\n" +
            "'0094'\n" +
            ") AND t1.COMPANY_ID IN ('comp02','comp01')\n" +
            ") order by decode(t1.DEPT_LEVEL , 'G01', 1, 'G02', 2) ASC,t1.SHOW_ORDER")
    List<BranchDataVo> findBranchList();


    /**
     *  获取分支机构列表
     *
     * @param userId
     * @return
     */
    @Select("select distinct \n" +
            "       t.dept_id,\n" +
            "       t.dept_name,\n" +
            "       t.parent_dept_id,\n" +
            "       t.dept_level\n" +
            "  from ehr01.tcl_v_dept_info_hgfk t\n" +
            " where (t.company_id = 'comp01' or t.company_id = 'comp02')\n" +
            "   and t.disabled = '0'\n ")
    List<BranchDataVo> findAllBranchEhr(@Param("userId") String userId);
}
