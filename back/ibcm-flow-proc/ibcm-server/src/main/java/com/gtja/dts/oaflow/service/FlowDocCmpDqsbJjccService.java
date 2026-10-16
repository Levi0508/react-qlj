package com.gtja.dts.oaflow.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.gtja.dts.oaflow.pojo.po.dqsb.FlowDocCmpDqsbJjcc;

import java.util.List;

/**
 * @author wxx
 */
public interface FlowDocCmpDqsbJjccService extends IService<FlowDocCmpDqsbJjcc> {

    List<FlowDocCmpDqsbJjcc> findDqsbInfoByPiid(String piid);
}
