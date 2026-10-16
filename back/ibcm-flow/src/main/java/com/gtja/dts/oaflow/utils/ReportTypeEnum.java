package com.gtja.dts.oaflow.utils;

import lombok.Data;

import java.util.HashMap;
import java.util.Map;


public enum ReportTypeEnum {

    // 示例数据，你可以根据需要修改
    TYPE_YEAR(0, "年报"),
    TYPE_HALF_YEAR(1, "半年报");


    private final Integer key;
    private final String value;

    // 用于 key -> value 的映射
    private static final Map<Integer, String> keyToValueMap = new HashMap<>();
    // 用于 value -> key 的映射
    private static final Map<String, Integer> valueToKeyMap = new HashMap<>();

    static {
        for (ReportTypeEnum e : ReportTypeEnum.values()) {
            keyToValueMap.put(e.key, e.value);
            valueToKeyMap.put(e.value, e.key);
        }
    }

    ReportTypeEnum(Integer key, String value) {
        this.key = key;
        this.value = value;
    }

    /**
     * 根据 key 获取 value
     */
    public static String getValueByKey(Integer key) {
        return keyToValueMap.get(key);
    }

    /**
     * 根据 value 获取 key
     */
    public static Integer getKeyByValue(String value) {
        return valueToKeyMap.get(value);
    }

    /**
     * 获取所有 key 集合
     */
    public static Map<Integer, String> getAll() {
        return new HashMap<>(keyToValueMap);
    }

    // 可选：添加 getter 方法
    public Integer getKey() {
        return key;
    }

    public String getValue() {
        return value;
    }
}