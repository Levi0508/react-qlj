package com.gtja.dts.oaflow.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.gtja.dts.oaflow.pojo.po.dqsb.FlowDocCmpDqsbZqjy;

import java.util.List;

/**
 * @author wxx
 */
public interface FlowDocCmpDqsbZqjyService extends IService<FlowDocCmpDqsbZqjy> {

    List<FlowDocCmpDqsbZqjy> findDqsbInfoByPiid(String piid);
}
