package com.gtja.dts.oaflow.pojo.po.jysjsh;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

/**
 * @author wxx
 * @date 2023-06-14 17:05
 */
@Data
@TableName("FLOW_DOC_CMP_JYSJSH")
public class FlowDocCmpJysjsh {

    private String id;
    private String customerAccount;
    private String customerNumber;
    private String customerName;
    private String salesDepartment;
    private String sendLetterUser;
    private String sendFuction;
    private String sendTime;
    private String sendContent;
    private String state;
    private String stockCode;
    private String dsid;
    private String customerType;
    private String sendEnclosure;
    private String fileno;
    private String customCooperation;
    private String fileSource;
    private String fileType;
    private String receiptDate;
    private String feedOfftime;
    private String fileTitle;
    private String fileNote;
    private String filePath;
    private String noticeWay;
    private String receiptName;
    private String receiptUnit;
    private Integer readBeginDate;
    private Integer readEndDate;
    private String fileName;
    private String tradeDate;
    private String ruleId;
    private String hitFlag;
    private String unhitreason;
    private String remark;
    private String createUser;
    private String createUserName;

    private Date sysCreateTime;
    private Date sysUpdateTime;
    private String sysCreateUser;
    private String sysUpdateUser;
    private String sysPiid;
    private String sysTiid;
    private String sysGuid;
    private String sysTenantCode;
    private String sysSystemId;
    private String sysFlowCode;
    private String sysDeleteUser;
    private String sysUseStatus;

}
