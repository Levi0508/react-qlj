package com.gtja.dts.oaflow.mapper;


import com.gtja.dts.oaflow.pojo.vo.HgptDqsbVo;
import com.gtja.dts.oaflow.pojo.vo.KafkaParamVo;
import com.gtja.dts.oaflow.pojo.vo.PersonReportRecordVo;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * @author wxx
 * @date 2023-03-30 14:59
 */
@Mapper
public interface HgptDqsbMapper  {

    /**
     * 获取领导管理的所有部门
     *
     * @param planId  批次号
     * @param spDeptId  领导所属部门
     * @return
     */
    @Select("SELECT d.dept_id deptId,\n" +
            "       d.dept_name deptName,\n" +
            "       nvl(qb.num_person, 0)  total,\n" +
            "       nvl(ytj.num_submit, 0)  submittedNum\n" +
            "  FROM emmnt.tb_emp_oper_dept d\n" +
            "  LEFT JOIN (SELECT dept_id, COUNT(*) AS num_person\n" +
            "               FROM emmnt.tb_task_instance\n" +
            "              WHERE plan_id = #{planId} \n" +
            "              GROUP BY dept_id) qb\n" +
            "    ON d.dept_id = qb.dept_id\n" +
            "  LEFT JOIN (SELECT dept_id, COUNT(*) AS num_submit\n" +
            "               FROM emmnt.tb_task_instance\n" +
            "              WHERE plan_id = #{planId}\n" +
            "                AND (flow_status = '3' OR flow_status = '9')\n" +
            "              GROUP BY dept_id) ytj\n" +
            "    ON d.dept_id = ytj.dept_id\n" +
            " WHERE d.sp_dept_id = #{spDeptId} \n" +
            " ORDER BY d.show_order\n")
    List<HgptDqsbVo> findDeptInfoBySpDeptId(@Param("planId") String planId, @Param("spDeptId") String spDeptId);

    /**
     * 获取该部门下的员工信息
     *
     * @param planId 批次号
     * @param deptId 部门id
     * @return
     */
    @Select("select plan_id,\n" +
            "       dept_id,\n" +
            "       parent_dept,\n" +
            "       emp_no,\n" +
            "       emp_name,\n" +
            "       emp_type,\n" +
            "       invest_type,\n" +
            "       report_range,\n" +
            "       begin_date,\n" +
            "       end_date,\n" +
            "       pk_id,\n" +
            "       remark,\n" +
            "       creator,\n" +
            "       create_time,\n" +
            "       piid,\n" +
            "       flow_status,\n" +
            "       app_time,\n" +
            "       tiid\n" +
            "  from emmnt.tb_task_instance \n" +
            "  where plan_id = #{planId} \n" +
            "   and dept_id = #{deptId}")
    List<PersonReportRecordVo> findPersonInfoByDeptId(@Param("planId") String planId, @Param("deptId") String deptId);


    /**
     * 获取Tiid
     * @param piid
     * @return
     */
    @Select("select sys_tiid from hgpt.flow_doc_cmp_dqsb where sys_piid = #{piid} ")
    KafkaParamVo findTiidByPiid(@Param("piid") String piid);

    /**
     * 驳回时添加驳回记录
     *
     * @param userId
     * @param nodeAction
     * @param piid
     * @param tiid
     * @return
     */
    @Insert("insert into emmnt.flow_node_inst_user(user_id, node_action, piid, tiid) values( #{userId}, #{nodeAction}, #{piid}, #{tiid})")
    Integer updateRejectRecord(@Param("userId")String userId, @Param("nodeAction") String nodeAction, @Param("piid") String piid, @Param("tiid") String tiid);


    /**
     * 驳回时添加驳回记录
     *
     * @param piid
     */
    @Update("update emmnt.tb_task_instance set  flow_status = '2' , app_time = '' where piid = #{piid} ")
    void updateRejectInstance(@Param("piid") String piid);

}
