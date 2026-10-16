package com.gtja.dts.oaflow.pojo.po.thfxq;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("WB_KEY")
public class WbKey {
    private String sid;
    private String rid;
    private String mapK;
    private String mapV;
    
    // 用于键值查询返回的字段
    private String k;
    private String v;
}
