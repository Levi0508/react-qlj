package com.gtja.dts.oaflow.job.thfxq;

import cn.hutool.extra.spring.SpringUtil;
import com.gtja.dts.oaflow.service.thfxq.ThfxqService;
import lombok.extern.log4j.Log4j2;
import org.quartz.JobExecutionContext;
import org.springframework.scheduling.quartz.QuartzJobBean;

@Log4j2
public class ClientIdExpiryFlowScheduler extends QuartzJobBean {

    @Override
    protected void executeInternal(JobExecutionContext context) {
        log.info("[证件过期流程下发定时任务] 开始执行");
        ThfxqService thfxqService = SpringUtil.getBean(ThfxqService.class);
        try {
            thfxqService.submitClientIdExpiryFlow();
            log.info("[证件过期流程下发定时任务] 执行完毕");
        } catch (Exception e) {
            log.error("[证件过期流程下发定时任务] 执行失败", e);
        }
    }
}
