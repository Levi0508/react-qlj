package com.gtja.dts.oaflow.service;

import org.springframework.stereotype.Service;

/**
 * @author wxx
 * @date 2023-04-03 16:54
 */
public interface DqsbService {

    /**
     * 获取签名
     *
     * @param piid
     * @param userId
     * @return
     */
    String getSignature(String piid,String userId);
}
