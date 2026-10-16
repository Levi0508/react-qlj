package com.gtja.dts.oaflow.config;

import javax.sql.DataSource;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.servlet.server.ServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.core.config.GlobalConfig;
import com.baomidou.mybatisplus.core.config.GlobalConfig.DbConfig;
import com.baomidou.mybatisplus.core.incrementer.IKeyGenerator;
import com.baomidou.mybatisplus.extension.incrementer.OracleKeyGenerator;
import com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean;

@Configuration
@MapperScan(basePackages = { "com.gtja.dts.oaflow.mapper",
        "com.gtja.framework.flow.mapper" }, sqlSessionFactoryRef = "customSqlSessionFactory")
public class OaFlowConfiguration {

    static final String MAPPER_LOCATION = "classpath*:mapper/**/*.xml";

    @Bean("customSqlSessionFactory")
    public SqlSessionFactory oaSqlSessionFactory(DataSource db,
                                                 @Qualifier("dmKeyGenerator1") IKeyGenerator keyGenerator) throws Exception {
        MybatisSqlSessionFactoryBean sqlSessionFactoryBean = new MybatisSqlSessionFactoryBean();
        sqlSessionFactoryBean.setDataSource(db);
        sqlSessionFactoryBean.setMapperLocations(
                new PathMatchingResourcePatternResolver().getResources(OaFlowConfiguration.MAPPER_LOCATION));
        GlobalConfig globalConfig = new GlobalConfig();
        DbConfig dbConfig = new DbConfig();
        // 默认为input
        dbConfig.setIdType(IdType.INPUT);
        dbConfig.setKeyGenerator(keyGenerator);
        globalConfig.setDbConfig(dbConfig);
        sqlSessionFactoryBean.setGlobalConfig(globalConfig);
        return sqlSessionFactoryBean.getObject();
    }

    @Bean("dmKeyGenerator1")
    public IKeyGenerator keyGenerator1() {
        return new OracleKeyGenerator();
    }

    /**
     * 配置转义字符,解决当请求路径中特殊字符，高版本tomcat解析失败的问题
     */
    @Bean
    public ServletWebServerFactory webServerFactory() {
        TomcatServletWebServerFactory fa = new TomcatServletWebServerFactory();
        fa.addConnectorCustomizers(connector -> {
            connector.setProperty("relaxedQueryChars", "(),/:;<=>?@[\\]{}");
            connector.setProperty("rejectIllegalHeader", "false");
        });
        return fa;
    }

}