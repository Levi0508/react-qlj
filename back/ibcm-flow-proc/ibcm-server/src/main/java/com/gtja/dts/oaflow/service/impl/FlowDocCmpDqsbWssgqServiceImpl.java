package com.gtja.dts.oaflow.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gtja.dts.oaflow.mapper.FlowDocCmpDqsbWssgqMapper;
import com.gtja.dts.oaflow.pojo.po.dqsb.FlowDocCmpDqsbWssgq;
import com.gtja.dts.oaflow.service.FlowDocCmpDqsbWssgqService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author wxx
 * @date 2023-03-29 9:47
 */
@RequiredArgsConstructor
@Service
public class FlowDocCmpDqsbWssgqServiceImpl extends ServiceImpl<FlowDocCmpDqsbWssgqMapper, FlowDocCmpDqsbWssgq> implements FlowDocCmpDqsbWssgqService {

    private final FlowDocCmpDqsbWssgqMapper flowDocCmpDqsbWssgqMapper;

    @Override
    public List<FlowDocCmpDqsbWssgq> findDqsbInfoByPiid(String piid) {
        return flowDocCmpDqsbWssgqMapper.findDqsbInfoByPiid(piid);
    }
}
