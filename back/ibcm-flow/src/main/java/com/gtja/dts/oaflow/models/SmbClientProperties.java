package com.gtja.dts.oaflow.models;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * @author wxx
 * @date 2023-05-16 15:09
 */
@Component
@ConfigurationProperties(prefix = "smb")
@Data
public class SmbClientProperties {
    private String server;
    private String user;
    private String password;
    private String share;
    private String disk;
}
