package com.gtja.dts.oaflow.pojo.po;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

/**
 * @Author: Joey
 * @Date: 2021/5/13 10:41
 * @Description:
 */
@Data
public class FlowData {

    private String tableName;

    private String fields;

    private String record;

    public FlowData(String tableName, String fields, String record) {
        this.fields = fields;
        this.record = record;
        this.tableName = tableName;
    }
}
