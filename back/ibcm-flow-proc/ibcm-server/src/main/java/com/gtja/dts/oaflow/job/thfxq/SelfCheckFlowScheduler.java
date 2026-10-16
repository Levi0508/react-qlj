package com.gtja.dts.oaflow.job.thfxq;

import cn.hutool.extra.spring.SpringUtil;
import com.gtja.dts.oaflow.service.thfxq.SelfCheckFlowService;
import org.quartz.JobExecutionContext;
import lombok.extern.log4j.Log4j2;

import org.springframework.scheduling.quartz.QuartzJobBean;

/**
 * 清单自查流程批量下发定时任务
 * 每分钟扫描未发送记录并调用本地 HTTP 接口下发流程
 *
 * @author AI Assistant
 * @date 2026-08-04
 */
@Log4j2
public class SelfCheckFlowScheduler extends QuartzJobBean {

    //private SelfCheckFlowService selfCheckFlowService;

    @Override
    protected void executeInternal(JobExecutionContext context) {
        log.info("清单自查流程批量下发定时任务开始执行");
        SelfCheckFlowService selfCheckFlowService = SpringUtil.getBean(SelfCheckFlowService.class);
        try {
            // 获取 Spring Bean（Quartz Job 非 Spring 管理生命周期）
            if (selfCheckFlowService == null) {
                selfCheckFlowService = SpringUtil.getBean(SelfCheckFlowService.class);
            }

            // 执行批量下发
            SelfCheckFlowService.ProcessResult result = selfCheckFlowService.executeBatchSubmit();
            System.out.println("=== 清单自查流程批量下发任务完成 ===");
            log.info("批量下发任务完成：{}", result);

        } catch (Exception e) {
            log.error("清单自查流程批量下发定时任务执行失败", e);
        }
    }
//
//    public void setSelfCheckFlowService(SelfCheckFlowService selfCheckFlowService) {
//        this.selfCheckFlowService = selfCheckFlowService;
//    }
}
