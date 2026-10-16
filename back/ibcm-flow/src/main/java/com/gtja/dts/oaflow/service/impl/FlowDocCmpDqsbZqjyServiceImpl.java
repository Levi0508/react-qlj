package com.gtja.dts.oaflow.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gtja.dts.oaflow.mapper.FlowDocCmpDqsbZqjyMapper;
import com.gtja.dts.oaflow.pojo.po.dqsb.FlowDocCmpDqsbZqjy;
import com.gtja.dts.oaflow.service.FlowDocCmpDqsbZqjyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author wxx
 * @date 2023-03-29 9:47
 */
@RequiredArgsConstructor
@Service
public class FlowDocCmpDqsbZqjyServiceImpl extends ServiceImpl<FlowDocCmpDqsbZqjyMapper, FlowDocCmpDqsbZqjy> implements FlowDocCmpDqsbZqjyService {

    private final FlowDocCmpDqsbZqjyMapper flowDocCmpDqsbZqjyMapper;

    @Override
    public List<FlowDocCmpDqsbZqjy> findDqsbInfoByPiid(String piid) {
        return flowDocCmpDqsbZqjyMapper.findDqsbInfoByPiid(piid);
    }
}
