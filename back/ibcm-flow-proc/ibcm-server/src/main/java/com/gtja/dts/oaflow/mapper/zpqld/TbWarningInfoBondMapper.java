package com.gtja.dts.oaflow.mapper.zpqld;


import com.gtja.dts.oaflow.pojo.po.zqpld.TbWarningInfoBond;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * @author wxx
 * @date 2023-06-26 10:16
 */
@Mapper
public interface TbWarningInfoBondMapper {

    /**
     * 获取 北京/深圳 债券偏离度预警未下发数据
     *
     * @param begin
     * @param end
     * @return
     */
    @Select("select uuid,\n" +
            "       operdate,\n" +
            "       opertime,\n" +
            "       ordersno,\n" +
            "       orderid,\n" +
            "       branchcode,\n" +
            "       branchname,\n" +
            "       custid,\n" +
            "       custname,\n" +
            "       secuid,\n" +
            "       market,\n" +
            "       stkcode,\n" +
            "       stkname,\n" +
            "       bsflag,\n" +
            "       orderqty,\n" +
            "       orderprice,\n" +
            "       matchqty,\n" +
            "       matchtime,\n" +
            "       matchprice,\n" +
            "       matchamt,\n" +
            "       orderstatus,\n" +
            "       ch_debt_ratio,\n" +
            "       ch_secu_ratio,\n" +
            "       debt,\n" +
            "       secu,\n" +
            "       debt_b,\n" +
            "       secu_b,\n" +
            "       status,\n" +
            "       opway,\n" +
            "       orderamt,\n" +
            "       flow_submit_status,\n" +
            "       piid,\n" +
            "       flow_no,\n" +
            "       order_date,\n" +
            "       ordertime\n" +
            "  from ycmon.TB_WARNING_INFO_BOND t\n" +
            "  where \n" +
            "  t.flow_submit_status = '0' and t.market = #{market} and \n" +
            "  t.order_date >= #{begin} and t.order_date <= #{end} " +
            "  order by t.flow_no")
    List<TbWarningInfoBond> findUnSubmitFlowDataList(@Param("begin")String begin,@Param("end")String end,@Param("market")String market);

    /**
     * 通过uuid查询未下发数据
     * @param uuid
     *
     * @return
     */
    @Select(" select uuid,\n" +
            "       operdate,\n" +
            "       opertime,\n" +
            "       ordersno,\n" +
            "       orderid,\n" +
            "       branchcode,\n" +
            "       branchname,\n" +
            "       custid,\n" +
            "       custname,\n" +
            "       secuid,\n" +
            "       market,\n" +
            "       stkcode,\n" +
            "       stkname,\n" +
            "       bsflag,\n" +
            "       orderqty,\n" +
            "       orderprice,\n" +
            "       matchqty,\n" +
            "       matchtime,\n" +
            "       matchprice,\n" +
            "       matchamt,\n" +
            "       orderstatus,\n" +
            "       ch_debt_ratio,\n" +
            "       ch_secu_ratio,\n" +
            "       debt,\n" +
            "       secu,\n" +
            "       debt_b,\n" +
            "       secu_b,\n" +
            "       status,\n" +
            "       opway,\n" +
            "       orderamt,\n" +
            "       flow_submit_status,\n" +
            "       piid,\n" +
            "       flow_no,\n" +
            "       order_date,\n" +
            "       ordertime\n" +
            "  from ycmon.TB_WARNING_INFO_BOND t\n" +
            " where t.uuid = #{uuid} \n" +
            "   and t.flow_submit_status = '0'\n " +
            "   and t.market = #{market} ")
    TbWarningInfoBond findUnSubmitByUuid(@Param("uuid")String uuid,@Param("market")String market);


    /**
     * 通过uuid修改下发数据状态
     * @param uuid
     *
     */
    @Update(" update ycmon.TB_WARNING_INFO_BOND t\n" +
            "   set t.flow_submit_status = '1'," +
            "       t.piid = #{piid}," +
            "       t.OPERTIME = #{operTime} " +
            " where t.uuid = #{uuid} \n ")
    void updateSubmitStatusByUuid(@Param("uuid") String uuid, @Param("piid")String piid, @Param("operTime")String operTime);

    /**
     * 通过uuid确定下发状态
     *
     * @param uuid
     * @return
     */
    @Select("select count(1) from ycmon.TB_WARNING_INFO_BOND t where t.uuid = #{uuid} and t.flow_submit_status = 0 ")
    Integer findIsSendState(@Param("uuid") String uuid);

    /**
     * 判断当前时间是否为交易日
     *
     * @param date
     * @return
     */
    @Select("select count(1) from params.tb_exchange_date t where  t.tradedate = #{date} and  t.market_code = '1' and t.date_flag = '1'")
    Integer judgeIsTradeDate(@Param("date") String date);

    /**
     * 获取当前时间的第n天交易日
     *
     * @param date
     * @return
     */
    @Select("select kingstar.get_last_n_tradedate(#{date}, -1 ) as tradeDate from dual ")
    String getLastTradeDate(@Param("date") String date);
}
