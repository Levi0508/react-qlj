package com.gtja.dts.oaflow.controller;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.serializer.SerializerFeature;
import com.gtja.dts.oaflow.common.R;
import com.gtja.dts.oaflow.mapper.HgptDqsbMapper;
import com.gtja.dts.oaflow.models.FlowConstant;
import com.gtja.dts.oaflow.service.*;
import com.gtja.dts.oaflow.service.impl.KafkaSendDataService;
import com.gtja.dts.oaflow.utils.SendKafkaUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

/**
 * @author wxx
 * @date 2023-03-29 9:43
 */
@RestController
@RequiredArgsConstructor
public class HgptController {

    private final FlowDocCmpDqsbJjccService flowDocCmpDqsbJjccService;
    private final FlowDocCmpDqsbWssgqService flowDocCmpDqsbWssgqService;
    private final FlowDocCmpDqsbZqccService flowDocCmpDqsbZqccService;
    private final FlowDocCmpDqsbZqjyService flowDocCmpDqsbZqjyService;
    private final DqsbService dqsbService;
    private final HgptDqsbMapper hgptDqsbMapper;
    private final KafkaSendDataService kafkaSendDataService;

    private final KafkaTemplate<String, String> kafkaTemplate;


    @GetMapping("/findAllCmpDqsbJjcc")
    public R<String> findAllCmpDqsbJjcc(@RequestParam(value = "piid") String piid){
        return R.data(JSON.toJSONString(flowDocCmpDqsbJjccService.findDqsbInfoByPiid(piid), SerializerFeature.WriteMapNullValue));
    }

    @GetMapping("/findAllCmpDqsbWssgq")
    public R<String> findAllCmpDqsbWssgq(@RequestParam(value = "piid") String piid){
        return R.data(JSON.toJSONString(flowDocCmpDqsbWssgqService.findDqsbInfoByPiid(piid), SerializerFeature.WriteMapNullValue));
    }

    @GetMapping("/findAllCmpDqsbZqcc")
    public R<String> findAllCmpDqsbZqcc(@RequestParam(value = "piid") String piid){
        return R.data(JSON.toJSONString(flowDocCmpDqsbZqccService.findDqsbInfoByPiid(piid), SerializerFeature.WriteMapNullValue));
    }

    @GetMapping("/findAllCmpDqsbZqjy")
    public R<String> findAllCmpDqsbZqjy(@RequestParam(value = "piid") String piid){
        return R.data(JSON.toJSONString(flowDocCmpDqsbZqjyService.findDqsbInfoByPiid(piid), SerializerFeature.WriteMapNullValue));
    }

    /**
     * 获取领导管理的所有部门
     *
     * @param planId
     * @param spDeptId
     * @return
     */
    @GetMapping("/findDeptInfoBySpDeptId")
    public R<String> findDeptInfoBySpDeptId(@RequestParam(value = "planId") String planId,
                                            @RequestParam(value = "spDeptId") String spDeptId){
        return R.data(JSON.toJSONString(hgptDqsbMapper.findDeptInfoBySpDeptId(planId,spDeptId), SerializerFeature.WriteMapNullValue));
    }

    /**
     * 获取该部门下的员工信息
     *
     * @param planId
     * @param deptId
     * @return
     */
    @GetMapping("/findPersonInfoByDeptId")
    public R<String> findPersonInfoByDeptId(@RequestParam(value = "planId") String planId,
                                            @RequestParam(value = "deptId") String deptId){
        return R.data(JSON.toJSONString(hgptDqsbMapper.findPersonInfoByDeptId(planId,deptId), SerializerFeature.WriteMapNullValue));
    }

    /**
     * 获取md5的签名
     *
     * @param piid
     * @param userId
     * @return
     */
    @GetMapping("/getSignature")
    public R<String> getSignature(@RequestParam(value = "piid") String piid,
                                  @RequestParam(value = "userId") String userId){
        return R.data(JSON.toJSONString(dqsbService.getSignature(piid,userId)));
    }

    @GetMapping("/rejectFlow")
    public R<String> sendKafkaData(@RequestParam(value = "piid")String piid,
                              @RequestParam(value = "userId")String userId,
                              @RequestParam(value = "opinion", required = false, defaultValue = "")String opinion){

        String kafkaData = kafkaSendDataService.sendKafkaData(piid, userId, opinion);
        if(StringUtils.isEmpty(kafkaData)){
            return R.fail("操作失败");
        }
        kafkaTemplate.send(FlowConstant.FLOW_CMP_KAFKA_TOPIC, kafkaData);
        return R.success("操作成功");
    }



}
