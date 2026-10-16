package com.gtja.dts.oaflow.pojo.vo;

import com.alibaba.fastjson.annotation.JSONField;
import lombok.Data;

/**
 * @author wxx
 * @date 2023-05-12 15:04
 */
@Data
public class DicHgptMapperVo {

    private String dicCode;
    private String dicVal;
    private String partType;
    private String sysId;
    private String dicItem;
    private String parentItem;

}
