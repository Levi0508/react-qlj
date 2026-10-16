package com.gtja.dts.oaflow.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.gtja.dts.oaflow.pojo.po.dqsb.FlowDocCmpDqsbZqcc;

import java.util.List;

/**
 * @author wxx
 */
public interface FlowDocCmpDqsbZqccService extends IService<FlowDocCmpDqsbZqcc> {

    List<FlowDocCmpDqsbZqcc> findDqsbInfoByPiid(String piid);
}
