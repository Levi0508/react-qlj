package com.gtja.dts.oaflow.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gtja.dts.oaflow.mapper.FlowDocCmpDqsbZqccMapper;
import com.gtja.dts.oaflow.pojo.po.dqsb.FlowDocCmpDqsbZqcc;
import com.gtja.dts.oaflow.service.FlowDocCmpDqsbZqccService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author wxx
 * @date 2023-03-29 9:47
 */
@RequiredArgsConstructor
@Service
public class FlowDocCmpDqsbZqccServiceImpl extends ServiceImpl<FlowDocCmpDqsbZqccMapper, FlowDocCmpDqsbZqcc> implements FlowDocCmpDqsbZqccService {

    private final FlowDocCmpDqsbZqccMapper flowDocCmpDqsbZqccMapper;

    @Override
    public List<FlowDocCmpDqsbZqcc> findDqsbInfoByPiid(String piid) {
        return flowDocCmpDqsbZqccMapper.findDqsbInfoByPiid(piid);
    }
}
