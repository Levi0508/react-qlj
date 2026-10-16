package com.gtja.dts.oaflow.service.impl;

import com.gtja.dts.oaflow.mapper.FlowDocGljyFileInfoMapper;
import com.gtja.dts.oaflow.pojo.po.FlowDocCmpFileInfo;
import com.gtja.dts.oaflow.service.FlowDocGljyFileInfoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * @author wxx
 * @date 2021-08-26 15:42
 */
@Service
@RequiredArgsConstructor
public class FlowDocGljyFileInfoServiceImpl extends BaseServiceImpl<FlowDocCmpFileInfo> implements FlowDocGljyFileInfoService {
    private final FlowDocGljyFileInfoMapper flowDocGljyFileInfoMapper;

    @Override
    public boolean createFile(FlowDocCmpFileInfo flowDocCmpFileInfo) {
        return flowDocGljyFileInfoMapper.insert(flowDocCmpFileInfo)>0;
    }
}
