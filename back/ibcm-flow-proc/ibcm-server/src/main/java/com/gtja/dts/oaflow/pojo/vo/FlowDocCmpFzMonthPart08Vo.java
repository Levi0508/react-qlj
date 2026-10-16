package com.gtja.dts.oaflow.pojo.vo;

import com.alibaba.fastjson.annotation.JSONField;
import lombok.Data;

import java.util.Date;

/**
 * @author wxx
 * @date 2023-05-18 15:48
 */
@Data
public class FlowDocCmpFzMonthPart08Vo {

    @JSONField(name = "COMP_DATE")
    private String compDate;
    @JSONField(name = "DEPT_ID")
    private String deptCode;
    @JSONField(name = "DEPT_NAME")
    private String deptName;
    @JSONField(name = "WB_CNT")
    private Integer wbCnt;
    @JSONField(name = "NB_CNT")
    private Integer nbCnt;
    @JSONField(name = "ZB_CNT")
    private Integer zbCnt;
    @JSONField(name = "YB_CNT")
    private Integer ybCnt;
    @JSONField(name = "KHFW_CNT")
    private Integer khfwCnt;
    @JSONField(name = "YJFY_CNT")
    private Integer yjfyCnt;
    @JSONField(name = "YWLCGF_CNT")
    private Integer ywlcgfCnt;
    @JSONField(name = "RYWG_CNT")
    private Integer rywgCnt;
    @JSONField(name = "KZXH_CNT")
    private Integer kzxhCnt;
    @JSONField(name = "JYXT_CNT")
    private Integer jyxtCnt;
    @JSONField(name = "XXXL_CNT")
    private Integer xxxlCnt;
    @JSONField(name = "CPYYWJF_CNT")
    private Integer cpyywjfCnt;
    @JSONField(name = "ZHSYXG_CNT")
    private Integer zhsyxgCnt;
    @JSONField(name = "GSDX_CNT")
    private Integer gsdxCnt;
    @JSONField(name = "QT_CNT")
    private Integer qtCnt;
    @JSONField(name = "CREATE_TIME")
    private Date createTime;
    @JSONField(name = "CREATE_USER")
    private String createUser;
    @JSONField(name = "REPORT_MONTH")
    private String reportMonth;
}
