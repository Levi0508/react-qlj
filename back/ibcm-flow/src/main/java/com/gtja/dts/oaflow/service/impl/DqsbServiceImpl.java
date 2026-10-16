package com.gtja.dts.oaflow.service.impl;

import com.gtja.dts.oaflow.service.DqsbService;
import com.gtja.dts.oaflow.utils.Md5Util;
import com.gtja.framework.util.common.MD5Utils;
import org.springframework.stereotype.Service;

import static com.gtja.dts.oaflow.common.CommonConstant.V_SIGN_KEY;

/**
 * @author wxx
 * @date 2023-04-03 16:55
 */
@Service
public class DqsbServiceImpl implements DqsbService {
    /**
     * 获取签名
     *
     * @param piid
     * @param userId
     * @return
     */
    @Override
    public String getSignature(String piid, String userId) {
        return Md5Util.getMD5(V_SIGN_KEY + piid + userId);
    }
}
