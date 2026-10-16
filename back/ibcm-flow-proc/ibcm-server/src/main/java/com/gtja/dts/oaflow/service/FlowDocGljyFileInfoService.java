package com.gtja.dts.oaflow.service;

import com.gtja.dts.oaflow.pojo.po.FlowDocCmpFileInfo;

/**
 * @author wxx
 * @date 2021-08-26 15:34
 */
public interface FlowDocGljyFileInfoService {
    /**
     * 文件入库
     * @param flowDocCmpFileInfo 文件对象
     * @return
     */
    boolean createFile(FlowDocCmpFileInfo flowDocCmpFileInfo);
}
