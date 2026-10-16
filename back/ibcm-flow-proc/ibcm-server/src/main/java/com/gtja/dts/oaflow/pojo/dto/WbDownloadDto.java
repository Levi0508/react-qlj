package com.gtja.dts.oaflow.pojo.dto;

import lombok.Data;

/**
 * @author wxx
 * @date 2023-05-15 17:07
 */
@Data
public class WbDownloadDto {
    private String[] files;
    private boolean zip;

    public WbDownloadDto(String[] files, boolean zip) {
        this.files = files;
        this.zip = zip;
    }
}
