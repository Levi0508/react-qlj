package com.gtja.dts.oaflow.config.thfxq;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.io.File;

/**
 * thfxq Web配置类
 */
@Slf4j
@Configuration
public class ThfxqWebConfig implements WebMvcConfigurer {

    @Value("${file.preview.temp.path:./temp/preview}")
    private String tempPreviewPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 配置thfxq文件预览静态资源访问
        // 需要映射到 temp 目录的父目录，因为URL是 /temp/preview/xxx
        // tempPreviewPath 是 /data/app/ibcm_java/temp/preview
        // 所以资源位置应该是 /data/app/ibcm_java/temp

        File tempDir = new File(tempPreviewPath);
        File tempParentDir = tempDir.getParentFile();

        String tempResourceLocation;
        if (tempPreviewPath.startsWith("/") && tempParentDir != null) {
            // 绝对路径，使用父目录
            tempResourceLocation = "file:" + tempParentDir.getAbsolutePath();
        } else if (tempPreviewPath.startsWith("/")) {
            // 绝对路径但无法获取父目录
            tempResourceLocation = "file:" + tempPreviewPath;
        } else {
            // 相对路径
            tempResourceLocation = "file:./temp/";
        }

        registry.addResourceHandler("/ibcm_file/**")
                .addResourceLocations(tempResourceLocation);

        // 配置上传文件静态资源访问
        registry.addResourceHandler("/upload_file/**")
                .addResourceLocations("file:./upload_file/");
    }
}