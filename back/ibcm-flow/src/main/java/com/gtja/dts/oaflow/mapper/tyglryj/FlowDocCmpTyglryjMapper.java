package com.gtja.dts.oaflow.mapper.tyglryj;

import com.gtja.dts.oaflow.pojo.po.tyglryj.FlowDocCmpTyglryj;
import com.gtja.dts.oaflow.pojo.po.tyglryj.tbManagerMatchInfo;
import com.gtja.dts.oaflow.pojo.po.tyglryj.tbWarningOneManager;
import com.gtja.flow.helper.domain.Candidate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * @author wxx
 * @date 2024-03-05 13:27
 */
@Mapper
public interface FlowDocCmpTyglryjMapper {

    /**
     * 通过pkId获取预警数据
     *
     * @param pkId
     * @return
     */
    @Select(" select pk_id,\n" +
            "       occur_date,\n" +
            "       occur_time,\n" +
            "       rule_id,\n" +
            "       branch_no,\n" +
            "       branch_name,\n" +
            "       manager_name,\n" +
            "       market_id,\n" +
            "       warning_type,\n" +
            "       warning_weight,\n" +
            "       piid,\n" +
            "       details,\n" +
            "       id_no,\n" +
            "       end_time,\n" +
            "       rule_name,\n" +
            "       market_name,\n" +
            "       flow_submit_status\n" +
            "  from ycmon.tb_warning_one_manager t\n" +
            " where t.pk_id = #{pkId} and t.FLOW_SUBMIT_STATUS = 0 ")
    tbWarningOneManager findYjByPkId(String pkId);


    /**
     * 通过pkId修改下发数据状态
     * @param pkId
     * @param piid
     */
    @Update(" update ycmon.tb_warning_one_manager t\n" +
            "   set " +
            "   t.flow_submit_status = '1'," +
            "   t.piid = #{piid}\n" +
            " where t.pk_id = #{pkId}\n ")
    void updateSubmitStatusByPkId(@Param("pkId") String pkId, @Param("piid")String piid);


    /**
     * 通过uuid确定下发状态
     *
     * @param pkId
     * @return
     */
    @Select("select count(1) from ycmon.tb_warning_one_manager t where t.pkId = #{pkId} and t.FLOW_SUBMIT_STATUS = 0 ")
    Integer findIsSendState(@Param("pkId") String pkId);

    /**
     *  获取起草人Name
     *
     * @param userId
     * @return
     */
    @Select("select t.display_name from basic_hg.wb_user t where t.user_id = #{userId} and rownum = 1 ")
    String findUserNameByUserId(String userId);


    /**
     * 查找候选人信息
     * @param candidate
     * @return
     */
    @Select("select replace(u.dept_id, 'D', '')     as orgCode,\n" +
            "       u.dept_name                     as orgName,\n" +
            "       t.branch_op_user_id             as userCode,\n" +
            "       t.branch_op_user_name           as userName,\n" +
            "       t.user_code                     as userOaCode\n" +
            "  from YCMON.TB_CONFIG_1809010020 t\n" +
            "  left join basic_hg.wb_user u\n" +
            "  on t.BRANCH_OP_USER_ID = u.user_id\n" +
            " where t.branch_code = #{branchCode} ")
    Candidate findCandidateByUserId(String candidate);


    /**
     * 查询同一管理人预警 成交明细 分页数据
     * @param pid
     * @param page
     * @param pageSize
     * @return
     */
    @Select(" select a.*\n" +
            "  from (SELECT t.*, ROWNUM rn\n" +
            "          from (select i.*\n" +
            "                  from ycmon.tb_manager_match_info i\n" +
            "                 where i.parent_rowid = #{pid} \n" +
            "                 order by i.trade_time_max) t) a\n" +
            " where a.rn > #{page} " +
            "   and a.rn <= #{pageSize}  \n ")
    List<tbManagerMatchInfo> findTradeDetailsPage(@Param("pid")String pid,@Param("page")Integer page,@Param("pageSize")Integer pageSize);

    /**
     * 查询同一管理人预警 成交明细 总条数
     * @param pid
     * @return
     */
    @Select(" select count(1)\n" +
            "  from ycmon.tb_manager_match_info i\n" +
            " where i.parent_rowid = #{pid} \n")
    Integer findTradeDetailsTotal(@Param("pid") String pid);

}
