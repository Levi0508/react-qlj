package com.gtja.dts.oaflow.pojo.vo.thfxq;

import com.gtja.dts.oaflow.pojo.po.thfxq.FeedBack;
import lombok.Data;

import java.util.List;

/**
 * 存储过程返回结果VO
 * 用于接收存储过程的输出参数
 */
@Data
public class FeedBackResultVO {
    /**
     * 存储过程返回的游标结果集
     */
    private List<FeedBack> result;

    /**
     * 客户ID（输入参数）
     */
    private Integer clientId;

    /**
     * 用户ID（输入参数）
     */
    private String userId;

    /**
     * 返回消息
     */
    private String returnMsg;

    /**
     * 返回代码
     */
    private Integer returnCode;
}
