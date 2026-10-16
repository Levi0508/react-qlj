package com.gtja.dts.oaflow.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gtja.dts.oaflow.pojo.po.FlowDocCmpFileInfo;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * @author wxx
 * @date 2021-08-26 15:54
 */
public interface FlowDocGljyFileInfoMapper extends BaseMapper<FlowDocCmpFileInfo> {
    /**
     * 得到同意目录下文件名相同的数量
     * @param bucket  桶
     * @param fileLikeName 查询文件名条件
     * @return
     */
    @Select("select count(1) from FLOW_DOC_GLJY_FILE_INFO t  where t.bucket = #{bucket} and t.file_name like #{fileLikeName}")
    Integer getFileCount(@Param("bucket") String bucket,@Param("fileLikeName") String fileLikeName);
}
