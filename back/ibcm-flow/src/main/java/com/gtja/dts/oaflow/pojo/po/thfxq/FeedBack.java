package com.gtja.dts.oaflow.pojo.po.thfxq;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("T_TH_FEEDBACK_RESULTS")
public class FeedBack {
    private String clientId;
    private String clientName;
    private String screenCode;
    private String screenName;
    private String gradeValue;
    private String gradeName;
}
