package com.gtja.dts.oaflow.mapper;


import com.gtja.dts.oaflow.pojo.po.jysjsh.TbUseLetter;
import com.gtja.dts.oaflow.pojo.vo.CleanInVo;
import com.gtja.dts.oaflow.pojo.vo.JysJshVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * @author wxx
 * @date 2023-06-15 11:08
 */
@Mapper
public interface FlowDocCmpJysjshMapper {

    /**
     * 获取关联用户，下发给这个营业部负责人
     * @param id
     * @return
     */
    @Select("select distinct t.sales_department from YCMON.TB_USE_LETTER t where t.id = #{id}  and t.flow_id is null ")
    List<String> findRelateList(String id);

    /**
     * 获取客户反馈等信息
     * @param id
     * @param deptId
     * @return
     */
    @Select("select t.* from YCMON.TB_USE_LETTER t where t.id = #{id}  and t.sales_department = #{deptId} ")
    TbUseLetter findRelateObjData(@Param("id")String id, @Param("deptId")String deptId);

    /**
     * 下发流程后更新 use_letter表的流程id
     * @param id
     * @param deptId
     * @param piid
     */
    @Select("update YCMON.TB_USE_LETTER t set t.flow_id = #{piid} where t.id = #{id}  and t.sales_department = #{deptId} and t.flow_id is null \n")
    void updateUseLetterFlowId(@Param("id")String id, @Param("deptId")String deptId, @Param("piid")String piid);

    /**
     * 获取关联用户，下发给这个营业部负责人
     * @param id
     * @return
     */
    @Select("SELECT w.ID,\n" +
            "      w.notice_way,\n" +
            "       w.read_begin_date,\n" +
            "       w.read_end_date," +
            "       to_char(u.CREATE_DATE, 'yyyy-mm-dd HH24:mi:ss') AS \"CREATE_DATE\",\n" +
            "       A.DISPLAY_NAME AS CREATE_USER,\n" +
            "       FILE_SOURCE,\n" +
            "       (CASE FILE_SOURCE\n" +
            "         WHEN '1' THEN\n" +
            "          '上海证券交易所'\n" +
            "         WHEN '2' THEN\n" +
            "          '深圳证券交易所'\n" +
            "         WHEN '3' THEN\n" +
            "          '全国中小企业股份转让系统'\n" +
            "       END) AS FILE_SOURCE_NAME,\n" +
            "       FILE_TYPE,\n" +
            "       (CASE FILE_TYPE /*WHEN '1' THEN '协查函'*/\n" +
            "         WHEN '2' THEN\n" +
            "          '警示函'\n" +
            "         WHEN '3' THEN\n" +
            "          '暂停交易函'\n" +
            "         WHEN '4' THEN\n" +
            "          '提示函'\n" +
            "         WHEN '5' THEN\n" +
            "          '承诺书签署'\n" +
            "         WHEN '6' THEN\n" +
            "          '关注函'\n" +
            "         WHEN '7' THEN\n" +
            "          '告知书'\n" +
            "       END) AS FILE_TYPE_NAME,\n" +
            "       to_char(w.RECEIPT_DATE, 'yyyy-mm-dd HH24:mi') AS \"RECEIPT_DATE\",\n" +
            "       to_char(w.FEED_OFFTIME, 'yyyy-mm-dd HH24:mi') AS \"FEED_OFFTIME\",\n" +
            "       FILE_TITLE,\n" +
            "       FILE_NOTE,\n" +
            "       FILE_PATH,\n" +
            "       RECEIPT_NAME,\n" +
            "       RECEIPT_UNIT,\n" +
            "       (CASE\n" +
            "         WHEN S.RELATE_NUM IS NULL THEN\n" +
            "          0\n" +
            "         ELSE\n" +
            "          S.RELATE_NUM\n" +
            "       END) || '个' AS RELATE_NUM,\n" +
            "       u.PRESENT_USER,\n" +
            "       u.MATCH_STATE,\n" +
            "       D.FILENAME,\n" +
            "       o.rule_id,\n" +
            "       o.trade_date\n" +
            "  FROM YCMON.TB_WRITE_LETTER w\n" +
            "  LEFT JOIN YCMON.TB_LETTERS u\n" +
            "    ON w.id = u.letter_id\n" +
            "  LEFT JOIN (SELECT T.ID, COUNT(ID) AS RELATE_NUM\n" +
            "               FROM YCMON.TB_USE_LETTER T\n" +
            "              GROUP BY T.ID) S\n" +
            "    ON S.id = u.letter_id\n" +
            "  LEFT JOIN BASIC_YC.WB_USER A\n" +
            "    ON A.USER_ID = U.CREATE_USER\n" +
            "  LEFT JOIN YCMON.TB_UPLOAD_FILE D\n" +
            "    ON w.FILE_PATH = D.FILEPATH\n" +
            "  left join ycmon.tb_warn_letter_info o\n" +
            "    on w.id = o.letter_id\n" +
            " WHERE 1 = 1\n" +
            "   AND (w.FILE_TYPE <> '1')\n" +
            "   AND w.id = #{id} \n ")
    JysJshVo findJshObj(String id);

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

    /**
     *  获取重点账户信息和监管明细
     *
     * @param customerId
     * @param branchCode
     * @return
     */
    @Select("SELECT BEGIN_DATE_T,END_DATE_T,BEGIN_DATE,END_DATE,DEAL_FLAG,TRADEDATE,REASON_REMARK,REMARK " +
            " FROM  CLOSING.TB_GTJA_ABNORMALACCT_CLEAN_IN WHERE CUSTOMER_NO = #{customerId} AND BRANCH_CODE = #{branchCode} ")
    List<CleanInVo> selectKeyAccountByBranchAndCus(@Param("customerId")String customerId, @Param("branchCode")String branchCode);

    /**
     *  获取提示信息
     *
     * @param fileId
     * @return
     */
    @Select("select t.remark from ycmon.tb_letter_remark t where t.id = #{fileId}")
    String getTipRemark(String fileId);


}
