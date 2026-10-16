package com.gtja.dts.oaflow.mapper.thfxq;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gtja.dts.oaflow.pojo.po.thfxq.TbProjFlowInst;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 流程实例表 Mapper
 * 用于查询未发送的流程实例数据（send_status='0'）
 *
 * @author AI Assistant
 * @date 2026-08-04
 */
@Mapper
public interface TbProjFlowInstMapper extends BaseMapper<TbProjFlowInst> {

    /**
     * 查询指定业务类型的未发送流程实例
     *
     * @param flowCodes 业务类型列表（如 'IBCM002', 'proj_selfcheck_remind'）
     * @param limit 返回数量上限
     * @return 未发送的流程实例列表
     */
    List<TbProjFlowInst> selectUnsentByFlowCodes(
            @Param("flowCodes") List<String> flowCodes,
            @Param("limit") Integer limit);

    /**
     * 更新流程实例的发送状态和时间
     *
     * @param pkId 主键 ID
     * @param sendStatus 发送状态 ('0'=未发送，'1'=已发送)
     * @return 影响行数
     */
    @Update("UPDATE thjs.tb_proj_flow_inst " +
            "SET send_status = #{sendStatus}, " +
            "    send_time = SYSDATE " +
            "WHERE pk_id = #{pkId}")
    int updateSendStatus(@Param("pkId") String pkId, @Param("sendStatus") String sendStatus);

    /**
     * 更新流程实例的错误信息和状态
     *
     * @param pkId 主键 ID
     * @param errInfo 错误信息
     * @param sendStatus 发送状态 ('0'=未发送，'1'=已发送)
     * @return 影响行数
     */
    @Update("UPDATE thjs.tb_proj_flow_inst " +
            "SET send_status = #{sendStatus}, " +
            "    err_info = #{errInfo}, " +
            "    send_time = SYSDATE " +
            "WHERE pk_id = #{pkId}")
    int updateErrorAndStatus(
            @Param("pkId") String pkId,
            @Param("errInfo") String errInfo,
            @Param("sendStatus") String sendStatus);

    @Update("UPDATE thjs.tb_proj_flow_inst " +
            "SET send_status = '2', " +
            "    send_time = SYSDATE " +
            "WHERE pk_id = #{pkId} AND send_status = '0'")
    int markProcessing(@Param("pkId") String pkId);

    @Update("UPDATE thjs.tb_proj_flow_inst " +
            "SET send_status = #{sendStatus}, " +
            "    err_info = #{errInfo}, " +
            "    send_time = SYSDATE " +
            "WHERE pk_id = #{pkId} AND send_status = '2'")
    int updateFromProcessing(
            @Param("pkId") String pkId,
            @Param("errInfo") String errInfo,
            @Param("sendStatus") String sendStatus);

    @Update("UPDATE thjs.tb_proj_flow_inst " +
            "SET send_status = '0', err_info = '重置：长时间卡在处理中状态' " +
            "WHERE send_status = '2' AND send_time < SYSDATE - 5/1440")
    int resetStuckProcessing();

    @Update("UPDATE thjs.tb_proj_flow_inst " +
            "SET send_status = '3', " +
            "    err_info = #{errInfo}, " +
            "    send_time = SYSDATE " +
            "WHERE pk_id = #{pkId} AND send_status = '2'")
    int markPendingConfirm(@Param("pkId") String pkId, @Param("errInfo") String errInfo);
}
