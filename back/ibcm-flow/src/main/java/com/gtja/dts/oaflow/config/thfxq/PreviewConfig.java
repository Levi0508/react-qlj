package com.gtja.dts.oaflow.config.thfxq;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.File;

/**
 * thfxq预览配置初始化类
 */
@Slf4j
@Component
public class PreviewConfig implements ApplicationRunner {
    
    @Value("${file.preview.temp.path:./temp/preview}")
    private String tempPreviewPath;
    
    @Override
    public void run(ApplicationArguments args) {
        try {
            // 确保预览临时目录存在
            File tempDir = new File(tempPreviewPath);
            if (!tempDir.exists()) {
                boolean created = tempDir.mkdirs();
                if (created) {
                    log.info("创建thfxq预览临时目录: {}", tempPreviewPath);
                } else {
                    log.error("创建thfxq预览临时目录失败: {}", tempPreviewPath);
                }
            } else {
                log.info("thfxq预览临时目录已存在: {}", tempPreviewPath);
            }
            
        } catch (Exception e) {
            log.error("初始化thfxq预览配置失败", e);
        }
    }
}