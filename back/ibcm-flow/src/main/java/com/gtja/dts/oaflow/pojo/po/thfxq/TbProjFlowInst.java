package com.gtja.dts.oaflow.pojo.po.thfxq;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

/**
 * 流程实例表持久化对象
 * 对应数据库表：thjs.tb_proj_flow_inst
 *
 * @author chengjing
 * @date 2026-08-04
 */
@Data
@TableName("tb_proj_flow_inst")
public class TbProjFlowInst {

    /**
     * 业务类型代码（如 'IBCM002', 'proj_selfcheck_remind','proj_selfcheck_mail'）
     */
    @TableField("FLOW_CODE")
    private String flowCode;

    /**
     * 业务日期（yyyyMMdd 格式）
     */
    @TableField("BUSI_DATE")
    private String busiDate;

    /**
     * 项目 ID
     */
    @TableField("PROJID")
    private String projId;

    /**
     * 项目名称
     */
    @TableField("PROJNAME")
    private String projname;

    /**
     * 检查批次号（6 位数字）
     */
    @TableField("CHECK_BATCH")
    private String checkBatch;

    /**
     * 检查批次 ID
     */
    @TableField("CHECK_BATCH_ID")
    private String checkBatchId;

    /**
     * 标题
     */
    @TableField("TITLE")
    private String title;

    /**
     * 内容（CLOB 类型，使用 ClobTypeHandler 转换为 String）
     */
    @TableField(value = "CONTENT")
    private String content;

    /**
     * 创建时间
     */
    @TableField("CREATE_TIME")
    private Date createTime;

    /**
     * 创建用户
     */
    @TableField("CREATE_USER")
    private String createuser;

    /**
     * 发送状态 ('0'=未发送，'1'=已发送)
     */
    @TableField("SEND_STATUS")
    private String sendStatus;

    /**
     * 发送时间
     */
    @TableField("SEND_TIME")
    private Date sendTime;

    /**
     * PIID（流程实例 ID）
     */
    @TableField("PIID")
    private String piid;

    /**
     * 主键 ID（唯一标识，默认值 sys_guid()）
     */
    @TableField("PK_ID")
    private String pkId;

    /**
     * 创建人 ID（自查流程下发接口请求头中的 x-userId）
     */
    @TableField("CREATE_USER_ID")
    private String createUserId;

    /**
     * 接收人 ID（用于流程审批候选人 candidates）
     */
    @TableField("RECEIVE_USER_ID")
    private String receiveUserId;

    /**
     * 接收人姓名
     */
    @TableField("RECEIVE_USER_NAME")
    private String receiveUserName;

    /**
     * 接收人显示名称（表单 DEPTMANANAME）
     */
    @TableField("RECEIVE_DISPLAY_NAME")
    private String receiveDisplayName;

    /**
     * 接收人员工 ID（表单 STAFF_ID）
     */
    @TableField("RECEIVE_STAFF_ID")
    private String receiveStaffId;

    /**
     * 项目列表状态（表单 PROJLIST_STATUS）
     */
    @TableField("PROJLIST_STATUS")
    private String projlistStatus;

    /**
     * 错误信息（流程下发失败时记录）
     */
    @TableField("ERR_INFO")
    private String errInfo;
    
    /**
     * 锁定标志（用于分布式锁，'0'=未锁定，'1'=已锁定）
     */
    @TableField("LOCK_FLAG")
    private String lockFlag;
}
