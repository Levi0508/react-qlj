package com.gtja.dts.oaflow.pojo.po.thfxq;

import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableField;
import lombok.Data;
import org.apache.ibatis.type.JdbcType;

import java.sql.Blob;
import java.sql.SQLException;

@Data
@TableName("T_TH_CLIENT_FILE_CONTENT")
public class FileContent {
    @TableField("ID")
    private String id;
    
    @TableField(value = "CONTENT", jdbcType = JdbcType.BLOB)
    private Blob content;
    
    // 添加获取blob内容的方法
    public byte[] getContentBytes() throws Exception {
        if (content != null) {
            try {
                int length = (int) content.length();
                if (length > 0) {
                    return content.getBytes(1, length);
                }
            } catch (SQLException e) {
                throw new RuntimeException("读取BLOB内容失败", e);
            }
        }
        return null;
    }
    
    // 添加调试方法
    @Override
    public String toString() {
        return "FileContent{" +
                "id='" + id + '\'' +
                ", content=" + (content == null ? "null" : "BLOB[size=" + getContentSize() + "]") +
                '}';
    }
    
    private long getContentSize() {
        try {
            return content != null ? content.length() : 0;
        } catch (SQLException e) {
            return -1;
        }
    }
}