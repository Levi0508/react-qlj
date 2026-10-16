package com.gtja.dts.oaflow.pojo.vo;

import lombok.Data;

import java.util.Date;

/**
 * @author wxx
 * @date 2023-03-30 15:21
 */

@Data
public class PersonReportRecordVo {

    private String planId;
    private String deptId;
    private String parentDept;
    private String empNo;
    private String empName;
    private String empType;
    private String investType;
    private String reportRange;
    private String beginDate;
    private String endDate;
    private String pkId;
    private String remark;
    private String creator;
    private String createTime;
    private String piid;
    private String flowStatus;
    private String appTime;
    private String tiid;

}
