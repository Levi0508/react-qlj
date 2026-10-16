package com.gtja.dts.oaflow.models;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * @author wxx
 * @date 2023-05-15 15:25
 */


@Component
@ConfigurationProperties(prefix = "ftp")
@Data
public class FtpProperties {
    private String server;
    private int port;
    private String user;
    private String password;
    private String downLoadPath;
}
