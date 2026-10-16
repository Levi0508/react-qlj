package com.gtja.dts.oaflow.utils;

/**
 * @author cl
 */
public class ErrorUtil {

    private ErrorUtil() {
        throw new IllegalStateException("ErrorUtil class");
    }

    public static String parameterErrorFormat(String field, String msg) {
        return "【" + field + " : " + msg + "】";
    }
}
