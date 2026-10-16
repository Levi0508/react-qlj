package com.gtja.dts.oaflow.pojo.po.wb;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;
/**
 * WB_USER 用户表实体类
 */
@Data
@TableName("BASIC_THJS.WB_USER")
public class WbUser {
    private String sid;
    private String userName;
    private String password;
    private String displayName;
    private LocalDateTime createDate;
    private Long loginTimes;
    private String deptId;
    private String email;
    private String mobilePhone;
    private String useLang;
    private LocalDateTime lastLogin;
    private Integer status;
    private String staffId;
    private String staffOa;
    private String userId;
    private String deptName;
    private String userType;
    private LocalDateTime updateDate;
    private String remark;
}


