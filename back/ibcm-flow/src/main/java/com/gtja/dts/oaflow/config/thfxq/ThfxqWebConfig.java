package com.gtja.dts.oaflow.config.thfxq;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * thfxq Web配置类
 */
@Configuration
public class ThfxqWebConfig implements WebMvcConfigurer {
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 配置thfxq文件预览静态资源访问
        registry.addResourceHandler("/temp/**")
                .addResourceLocations("file:./temp/");
        
        // 配置上传文件静态资源访问
        registry.addResourceHandler("/upload_file/**")
                .addResourceLocations("file:./upload_file/");
    }
}