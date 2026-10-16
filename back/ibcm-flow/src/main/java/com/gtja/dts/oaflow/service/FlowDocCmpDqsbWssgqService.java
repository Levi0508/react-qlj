package com.gtja.dts.oaflow.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.gtja.dts.oaflow.pojo.po.dqsb.FlowDocCmpDqsbWssgq;

import java.util.List;

/**
 * @author wxx
 */
public interface FlowDocCmpDqsbWssgqService extends IService<FlowDocCmpDqsbWssgq> {

    List<FlowDocCmpDqsbWssgq> findDqsbInfoByPiid(String piid);
}
