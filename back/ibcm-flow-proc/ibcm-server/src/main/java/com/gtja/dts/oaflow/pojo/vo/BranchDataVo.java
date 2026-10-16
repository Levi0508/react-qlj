package com.gtja.dts.oaflow.pojo.vo;

import com.alibaba.fastjson.annotation.JSONField;
import lombok.Data;

/**
 * @author wxx
 * @date 2023-05-12 15:04
 */
@Data
public class BranchDataVo {

    @JSONField(name = "DEPT_ID")
    private String deptId;
    @JSONField(name = "DEPT_NAME")
    private String deptName;
    @JSONField(name = "PARENT_DEPT_ID")
    private String parentDeptId;
    @JSONField(name = "DEPT_LEVEL")
    private String deptLevel;

}

