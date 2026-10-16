package com.gtja.dts.oaflow.pojo.po.thfxq;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableField;
import lombok.Data;

@Data
@TableName("T_TH_CLIENT_FILE")
public class FileList {
    @TableField("CLIENT_ID")
    private String clientId;
    
    @TableField("FILE_TYPE_NO")
    private String fileTypeNo;
    
    @TableField("ID")
    private String id;
    
    @TableField("NAME")
    private String name;
    
    @TableField("FILE_SIZE")
    private String fileSize;
    
    @TableField("EXTENSION")
    private String extension;
    
    @TableField("CREATE_BY")
    private String createBy;
    
    @TableField("CREATE_TIME")
    private String createTime;
    
    @TableField("FILE_PATH")
    private String filePath;
    
    @TableField("STATUS")
    private String status;
    
    @TableField("OBJECT_ID")
    private String objectId;
}
