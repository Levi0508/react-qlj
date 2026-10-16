package com.gtja.dts.oaflow.mapper.thfxq;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gtja.dts.oaflow.pojo.po.thfxq.TbFlowInst;
import com.gtja.dts.oaflow.pojo.vo.thfxq.ClientFlowSubmitVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;
import org.apache.ibatis.type.JdbcType;

import java.util.List;

@Mapper
public interface TbFlowInstMapper extends BaseMapper<TbFlowInst> {

    List<ClientFlowSubmitVO> selectUnsentByIdExpiry(@Param("raiseCode") String raiseCode,
                                                    @Param("limit") Integer limit);

    @Update("UPDATE thjs.tb_flow_inst " +
            "SET send_status = #{sendStatus,jdbcType=VARCHAR}, " +
            "    send_time = SYSDATE " +
            "WHERE flow_id = #{flowId,jdbcType=VARCHAR}")
    int updateSendStatus(@Param("flowId") String flowId,
                         @Param("sendStatus") String sendStatus);

    @Update("UPDATE thjs.tb_flow_inst " +
            "SET send_status = #{sendStatus,jdbcType=VARCHAR}, " +
            "    error_info = #{errorInfo,jdbcType=VARCHAR}, " +
            "    send_time = SYSDATE " +
            "WHERE flow_id = #{flowId,jdbcType=VARCHAR}")
    int updateErrorAndStatus(@Param("flowId") String flowId,
                             @Param("errorInfo") String errorInfo,
                             @Param("sendStatus") String sendStatus);
}
