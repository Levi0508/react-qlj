package com.gtja.dts.oaflow.mapper.thfxq;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.gtja.dts.oaflow.pojo.po.thfxq.TbProjFlowInst;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 清单自查催办邮件 Mapper
 *
 * @author CodeBuddy
 * @date 2026-08-05
 */
@Mapper
public interface SelfCheckReminderEmailMapper extends BaseMapper<TbProjFlowInst> {

    /**
     * 查询未发送的催办邮件记录（分页）
     *
     * @param page 分页对象
     * @param flowCode 流程编码
     * @param sendStatus 发送状态
     * @return 分页结果
     */
    IPage<TbProjFlowInst> queryUnsentReminderEmails(@Param("page") Page<TbProjFlowInst> page,
                                                    @Param("flowCode") String flowCode,
                                                    @Param("sendStatus") String sendStatus);

    /**
     * 批量查询未发送记录（用于分布式锁获取）
     *
     * @param pkIds PK ID 列表
     * @return 记录列表
     */
    List<TbProjFlowInst> batchQueryByIds(@Param("pkIds") List<String> pkIds);

    /**
     * 更新锁定标志（分布式锁）
     *
     * @param pkId PK ID
     * @return 影响行数
     */
    int updateLockFlag(@Param("pkId") String pkId);

    /**
     * 重置锁定标志（任务完成后释放锁）
     *
     * @param pkId PK ID
     * @return 影响行数
     */
    int resetLockFlag(@Param("pkId") String pkId);
}
