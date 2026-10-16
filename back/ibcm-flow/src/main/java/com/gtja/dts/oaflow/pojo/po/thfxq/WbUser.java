package com.gtja.dts.oaflow.pojo.po.thfxq;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/*
20260410
新增 - 查询维护人员信息接口
start
*/
@Data
@TableName("WB_USER")
public class WbUser {
    private String sid;
    private String userId;
    private String userName;
    private String displayName;
    private String deptId;
    private String deptName;
    private String email;
    private String mobile_phone;
    private String staffId;
    private String status;
    private String createTime;
    private String updateTime;
    private String curUserId;
    private String curUserName;
}
/*
20260410
新增 - 查询维护人员信息接口
end
*/
