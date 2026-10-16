package com.gtja.dts.oaflow.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gtja.dts.oaflow.pojo.po.dqsb.FlowDocCmpDqsbZqjy;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * @author wxx
 */
public interface FlowDocCmpDqsbZqjyMapper extends BaseMapper<FlowDocCmpDqsbZqjy> {

    /**
     *  获取定期申报数据
     *
     * @param piid
     * @return
     */
    @Select("select tzrxm,\n" +
            "       jyrq,\n" +
            "       zqdm,\n" +
            "       zqmc,\n" +
            "       sc,\n" +
            "       zhhm,\n" +
            "       jyfx,\n" +
            "       jysl,\n" +
            "       qmye,\n" +
            "       cjjg,\n" +
            "       sys_create_time,\n" +
            "       sys_update_time,\n" +
            "       sys_create_user,\n" +
            "       sys_update_user,\n" +
            "       sys_piid,\n" +
            "       sys_tiid,\n" +
            "       sys_guid,\n" +
            "       sys_tenant_code,\n" +
            "       sys_system_id,\n" +
            "       sys_flow_code\n" +
            "  from flow_doc_cmp_dqsb_zqjy t where t.sys_piid = #{piid} and t.sys_use_status = '1' \n")
    List<FlowDocCmpDqsbZqjy> findDqsbInfoByPiid(@Param("piid") String piid);
}
