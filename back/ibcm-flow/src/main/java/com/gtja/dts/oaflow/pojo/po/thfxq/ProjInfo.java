package com.gtja.dts.oaflow.pojo.po.thfxq;

import lombok.Data;

import java.util.List;

@Data
public class ProjInfo {
    private String projcode;
    private String projid;
    private String khname;
    private String projname;
    private String stockcode;
    private String stockname;
    private String projtype;
    private String projStatus;
    private String projStatusName;
    private String deptmananame;
    private String staffId;
    private String deptName;
    private String deptCode;
    private String opContent;
    private String opTime;
    private String checkResult;
    private String checkTime;
    private List<InoutCommentFile> fileList;
}