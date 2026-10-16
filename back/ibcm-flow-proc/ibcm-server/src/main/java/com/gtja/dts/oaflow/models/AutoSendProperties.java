package com.gtja.dts.oaflow.models;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * @author wxx
 * @date 2023-05-15 15:25
 */

@Component
@ConfigurationProperties(prefix = "auto")
@Data
public class AutoSendProperties {
    private String applyTitle;
    private String flowVer;
    private String creator;
    private String cron;
    private String state;
    private String flowVerBj;
    private String flowVerSz;

}
