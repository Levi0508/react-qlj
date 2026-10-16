package com.gtja.dts.oaflow.mapper;

import com.gtja.dts.oaflow.pojo.po.FlowData;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DataConvertMapper {

    /**
     *  插入解析json后的数据
     * @param flowData
     * @return
     */
    @Insert("insert into ${tableName} (${fields}) values (${record})")
    int getInfo(FlowData flowData);
}
