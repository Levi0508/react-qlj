package com.gtja.dts.oaflow.mapper.wb;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gtja.dts.oaflow.pojo.po.wb.WbUser;
import com.gtja.flow.helper.domain.Candidate;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface WbUserMapper  extends BaseMapper<WbUser> {


    @Select("SELECT replace(u.dept_id, 'D', '')  as orgCode," +
            "u.DEPT_NAME as orgName," +
            "u.USER_ID as userCode," +
            "u.DISPLAY_NAME as userName," +
            "u.USER_NAME AS userOaCode " +
            "FROM BASIC_THJS.WB_USER u WHERE u.USER_ID= #{userId}")
    Candidate findUserByUserId(String userId);
    
    /**
     * 根据用户 ID 查询邮箱地址
     */
    // @Select("SELECT email FROM basic_thjs.wb_user WHERE user_id = #{userId}")
    @Select("SELECT email FROM wolf.wb_user WHERE user_id = #{userId}")
    String findEmailById(String userId);

}
