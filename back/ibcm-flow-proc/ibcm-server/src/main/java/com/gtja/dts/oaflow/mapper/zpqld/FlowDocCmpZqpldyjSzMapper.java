package com.gtja.dts.oaflow.mapper.zpqld;


import com.gtja.flow.helper.domain.Candidate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/**
 * @author wxx
 * @date 2023-06-15 11:08
 */
@Mapper
public interface FlowDocCmpZqpldyjSzMapper {
    /**
     * 查找候选人信息
     * @param candidate
     * @return
     */
    @Select("select \n" +
            "       branch_code as orgCode,\n" +
            "       branch_name as orgName,\n" +
            "       branch_op_user_id as userCode,\n" +
            "       branch_op_user_name as userName,\n" +
            "       user_code as userOaCode\n" +
            "  from ycmon.flow_branch_config t \n" +
            "  where t.branch_code = #{branchCode} ")
    Candidate findCandidateByUserId(String candidate);

    /**
     *  获取部门名称
     *
     * @param deptId
     * @return
     */
    @Select("select t.dept_name from basic_hg.wb_dept t where t.DEPT_ID = #{deptId} and rownum = 1 ")
    String findDeptNameByDeptId(String deptId);

    /**
     *  获取起草人Name
     *
     * @param userId
     * @return
     */
    @Select("select t.display_name from basic_hg.wb_user t where t.user_id = #{userId} and rownum = 1 ")
    String findUserNameByUserId(String userId);

    @Select("select count(1)\n" +
            "  from flow_doc_cmp_zqpldyj_sz t\n" +
            " where t.sys_piid = #{piid} \n" +
            "   and t.REASON_DESCRIPTION is not null\n")
    Integer checkData(String piid);

    /**
     *  时间转换
     *
     * @param operTime
     * @return
     */
    @Select("select ycmon.f_turnover_time(#{operTime}) from dual")
    String turnoverTime(String operTime);
}
