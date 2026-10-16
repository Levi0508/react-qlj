package com.gtja.dts.oaflow.pojo.po.thfxq;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("T_DICT_SUBENTRY")
public class DictSubentry {
    private String entryNo;
    private String subentry;
    private String comments;
    private String sourceCode;
    private String remark;
    private String entryContentMatch;
    private String updateUser;
    private String updateTime;
    private String createUser;
    private String createTime;
    private String organFlag;
    private String status;
    
    // 用于字典查询返回的字段
    private String k;
    private String v;
}
