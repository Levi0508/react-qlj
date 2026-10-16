package com.gtja.dts.oaflow.service.impl;

import com.gtja.dts.oaflow.mapper.HgptDqsbMapper;
import com.gtja.dts.oaflow.models.FlowConstant;
import com.gtja.dts.oaflow.pojo.vo.KafkaParamVo;
import com.gtja.dts.oaflow.utils.SendKafkaUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * @author wxx
 * @date 2023-04-18 16:26
 */
@Service
public class KafkaSendDataService {
    @Autowired
    private HgptDqsbMapper hgptDqsbMapper;

    public String sendKafkaData(String piid,String userId,String opinion){
        String result = "";
        KafkaParamVo kafkaParamVo = hgptDqsbMapper.findTiidByPiid(piid);
        String tiid = kafkaParamVo.getSysTiid();
        Integer count = hgptDqsbMapper.updateRejectRecord(userId, "驳回", piid, tiid);
        if(count > 0){
            hgptDqsbMapper.updateRejectInstance(piid);
            result = SendKafkaUtils.getKafkaRecord(FlowConstant.FLOW_CMP050_NODE_CODE,
                    FlowConstant.FLOW_CMP_CLIENT_ID, piid, tiid,
                    FlowConstant.FLOW_CMP_KAFKA_MSG_TYPE, opinion);
        }
        return result;

    }

}
