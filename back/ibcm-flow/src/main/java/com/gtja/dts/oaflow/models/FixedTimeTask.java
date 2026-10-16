package com.gtja.dts.oaflow.models;

import com.gtja.dts.oaflow.mapper.zpqld.TbResult1808032230dOaNewMapper;
import com.gtja.dts.oaflow.utils.DateTimeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

/**
 * @author wxx
 * @date 2023-07-11 14:35
 * @Description:定时任务公共类
 */
@Component
@RequiredArgsConstructor
@Slf4j
@EnableScheduling //通过@EnableScheduling注解开启对计划任务的支持
public class FixedTimeTask {

    private final RestTemplate restTemplate = new RestTemplate();

    private final TbResult1808032230dOaNewMapper tbOaMapper;

    private final AutoSendProperties autoSendProperties;

    @Value("${auto.cron}")
    private String cron;

    @Autowired
    public FixedTimeTask(AutoSendProperties autoSendProperties,TbResult1808032230dOaNewMapper tbOaMapper) {
        this.autoSendProperties = autoSendProperties;
        this.tbOaMapper = tbOaMapper;
    }

    @Scheduled(cron= "${auto.cron}")
    public void getInPortShipNum() {
        String state = autoSendProperties.getState();
        if("false".equalsIgnoreCase(state)){
            log.info("定时任务未开启");
            return;
        }
        try {
            Thread.sleep(2000L);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        String applyTitle = autoSendProperties.getApplyTitle();
        String creator = autoSendProperties.getCreator();
        String flowVer = autoSendProperties.getFlowVer();
        String flowVerSz = autoSendProperties.getFlowVerSz();
        String flowVerBj = autoSendProperties.getFlowVerBj();
        String lastTradeDate = tbOaMapper.getLastTradeDate(DateTimeUtil.getCurrentShortDateStr());

        String urlSh = "http://localhost:8094/ycjy/batchSubmitSdk";
        String urlSz = "http://localhost:8094/ycjySz/batchSubmitSdk";
        String urlBj = "http://localhost:8094/ycjyBj/batchSubmitSdk";
        // 请求头设置,x-www-form-urlencoded格式的数据
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        //提交参数设置
        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("creator", creator);
        map.add("applyTitle", applyTitle);
        map.add("flowVer", flowVer);
        map.add("beginDate", lastTradeDate);
        map.add("endDate", lastTradeDate);
        log.info("--------------------------sh参数：{},\r\n表达式：{}", map.toString(),cron);

        MultiValueMap<String, String> mapSz = new LinkedMultiValueMap<>();
        mapSz.add("creator", creator);
        mapSz.add("applyTitle", applyTitle);
        mapSz.add("flowVer", flowVerSz);
        mapSz.add("beginDate", lastTradeDate);
        mapSz.add("endDate", lastTradeDate);
        log.info("--------------------------sz参数：{},\r\n表达式：{}", mapSz.toString(),cron);

        MultiValueMap<String, String> mapBj = new LinkedMultiValueMap<>();
        mapBj.add("creator", creator);
        mapBj.add("applyTitle", applyTitle);
        mapBj.add("flowVer", flowVerBj);
        mapBj.add("beginDate", lastTradeDate);
        mapBj.add("endDate", lastTradeDate);
        log.info("--------------------------bj参数：{},\r\n表达式：{}", mapBj.toString(),cron);

        // 组装请求体
        HttpEntity<MultiValueMap<String, String>> requestSh = new HttpEntity<>(map, headers);
        HttpEntity<MultiValueMap<String, String>> requestSz = new HttpEntity<>(mapSz, headers);
        HttpEntity<MultiValueMap<String, String>> requestBj = new HttpEntity<>(mapBj, headers);
        // 发送post请求，并打印结果，以String类型接收响应结果JSON字符串
        String result = restTemplate.postForObject(urlSh, requestSh, String.class);
        log.info("上交所债券预警定时完成，返回{}",result);
        try {
            Thread.sleep(2000L);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        String resultSz = restTemplate.postForObject(urlSz, requestSz, String.class);
        log.info("深交所债券预警定时完成，返回{}",resultSz);
        try {
            Thread.sleep(2000L);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        String resultBj = restTemplate.postForObject(urlBj, requestBj, String.class);
        log.info("北交所债券预警定时完成，返回{}",resultBj);
        try {
            Thread.sleep(2000L);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

    }
}
