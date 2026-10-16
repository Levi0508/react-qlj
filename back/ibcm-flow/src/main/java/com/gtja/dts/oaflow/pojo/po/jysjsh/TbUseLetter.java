package com.gtja.dts.oaflow.pojo.po.jysjsh;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

/**
 * @author wxx
 * @date 2023-06-14 17:05
 */
@Data
@TableName("TB_USE_LETTER")
public class TbUseLetter {

    private String id;
    private String customerAccount;
    private Integer customerNumber;
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
    private String flowId;
    private Integer flowState;
    private String fileno;
    private String customCooperation;


}
