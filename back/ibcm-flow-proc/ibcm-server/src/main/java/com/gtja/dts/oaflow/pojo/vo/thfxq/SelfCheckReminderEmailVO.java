package com.gtja.dts.oaflow.pojo.vo.thfxq;

import lombok.Data;

/**
 * 清单自查催办邮件 VO
 *
 * @author CodeBuddy
 * @date 2026-08-05
 */
@Data
public class SelfCheckReminderEmailVO {

    /**
     * 流程实例 ID（pk_id）
     */
    private String pkId;

    /**
     * 项目 ID
     */
    private String projId;

    /**
     * 项目名称
     */
    private String projName;

    /**
     * 收件人 OA 用户 ID
     */
    private String receiveUserId;

    /**
     * 收件人显示名称
     */
    private String receiveDisplayName;

    /**
     * 收件人工号
     */
    private String receiveStaffId;

    /**
     * 创建人 ID
     */
    private String createUserId;

    /**
     * 创建时间
     */
    private String createTime;

    /**
     * 邮件正文内容（来自 tb_proj_flow_inst.content 字段）
     */
    private String content;

    /**
     * 收件人邮箱地址（通过 basic_thjs.wb_user 表查询）
     */
    private String userEmail;

    /**
     * 系统类型（与现有邮件 API 保持一致）
     */
    private String sysType = "thfxq";

    /**
     * 发送类型（与现有邮件 API 保持一致）
     */
    private String sendType = "reminder";
}
