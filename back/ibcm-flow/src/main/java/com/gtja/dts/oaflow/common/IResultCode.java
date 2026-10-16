package com.gtja.dts.oaflow.common;

import java.io.Serializable;

/**
 * @author aileaile
 * @date 2022/8/2
 * @description
 */
public interface IResultCode extends Serializable {
    String getMessage();

    int getCode();
}
