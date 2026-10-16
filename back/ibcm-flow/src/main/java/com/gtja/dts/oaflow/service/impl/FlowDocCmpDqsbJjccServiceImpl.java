package com.gtja.dts.oaflow.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gtja.dts.oaflow.mapper.FlowDocCmpDqsbJjccMapper;
import com.gtja.dts.oaflow.pojo.po.dqsb.FlowDocCmpDqsbJjcc;
import com.gtja.dts.oaflow.service.FlowDocCmpDqsbJjccService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author wxx
 * @date 2023-03-29 9:47
 */

@RequiredArgsConstructor
@Service
public class FlowDocCmpDqsbJjccServiceImpl extends ServiceImpl<FlowDocCmpDqsbJjccMapper, FlowDocCmpDqsbJjcc> implements FlowDocCmpDqsbJjccService {

    private final FlowDocCmpDqsbJjccMapper flowDocCmpDqsbJjccMapper;

    @Override
    public List<FlowDocCmpDqsbJjcc> findDqsbInfoByPiid(String piid) {
        return flowDocCmpDqsbJjccMapper.findDqsbInfoByPiid(piid);
    }
}
