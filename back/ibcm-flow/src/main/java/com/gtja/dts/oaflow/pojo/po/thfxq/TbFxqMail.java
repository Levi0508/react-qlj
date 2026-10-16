package com.gtja.dts.oaflow.pojo.po.thfxq;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

/**
 * 邮件实体类 - 对应表 TB_HG_MAIL
 */
@Data
@TableName("TB_FXQ_MAIL")
public class TbFxqMail {

    /**
     * 邮件ID，主键，VARCHAR2(32)，默认 sys_guid()
     */
    @TableId
    private String mailId;

    /**
     * 收件人，VARCHAR2(4000)，非空
     */
    private String receiveUser;

    /**
     * 抄送人，VARCHAR2(4000)，可空
     */
    private String ccUser;

    /**
     * 邮件标题，VARCHAR2(255)，非空
     */
    private String mailTitle;

    /**
     * 邮件正文，CLOB
     */
    private String mailContent;

    /**
     * 邮件附件路径，VARCHAR2(255)
     */
    private String mailFilePath;

    /**
     * 发送标记，CHAR(1)：例如 '0' 未发送，'1' 已发送
     */
    private String sendMark;

    /**
     * 邮件日期，DATE
     */
    private Date mailDate;

    /**
     * 发送人，VARCHAR2(50)
     */
    private String sendUser;

    /**
     * 接收消息（回执？错误信息？），NVARCHAR2(1000)
     */
    private String recvMsg;

    /**
     * 备注
     */
    private String remark;

    /**
     * 记录生成时间
     */
    private Date genTime;
}