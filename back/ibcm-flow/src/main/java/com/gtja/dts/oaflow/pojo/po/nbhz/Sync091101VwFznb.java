package com.gtja.dts.oaflow.pojo.po.nbhz;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

/**
 * 分支结构年报半年报信息
 *
 */
@Data
@TableName("TCL_VW_FZNB")
public class Sync091101VwFznb {
    private String busiDate;
    private String branchCode;
    private Integer reportYear;
    private Integer reportType;
    private String deptCode;
    private String reportName;
    private String createEhr;
    private Date createTime;
    private Date updateTime;
    private String note;
    /**
     * 分公司本部合规风控人数
     */
    private Integer rypzAllHgrs;
    /**
     * 分公司下辖营业部家数
     */
    private Integer rypzAllYybjs;
    /**
     * 15人及以上营业部家数
     */
    private Integer rypzYybjs1;
    /**
     * 15人及以下营业部家数
     */
    private Integer rypzYybjs2;
    /**
     *配备专职合规风控人员家数
     */
    private Integer rypzHgrs1;
    private Integer rypzHgrs2;
    private String rypzBb;
    private String rypzNr;
    private String rypzBb2;
    private String rypzBz;
    private Integer zdjsNum1;
    private Integer zdjsNum2;
    private Integer zdjsNum3;
    private Integer zdjsNum4;
    private String zdjsDesc1;
    private String zdjsDesc2;
    private String zdjsDesc3;
    private String zdjsDesc4;
    private Integer hgscNum1;
    private Integer hgscNum2;
    private String hgscDesc1;
    private String hgscDesc2;
    private Integer nbhgjcNum1;
    private Integer nbhgjcNum2;
    private Integer nbhgjcNum3;
    private String nbhgjcDesc1;
    private String nbhgjcDesc2;
    private Integer hgxdpxNum1;
    private Integer hgxdpxNum2;
    private Integer hgxdpxNum3;
    private String hgxdpxDesc1;
    private String hgxdpxDesc2;
    private String hgxdpxDesc3;
    private Integer hgwzNum0;
    private Integer hgwzNum1;
    private Integer hgwzNum2;
    private Integer hgwzNum3;
    private Integer hgwzNum4;
    private Integer hgwzNum5;
    private Integer hgwzNum6;
    private Integer hgwzNum7;
    private Integer hgwzNum8;
    private Integer hgwzNum9;
    private Integer hgwzNum10;
    private Integer hgwzNum11;
    private Integer hgwzNum12;
    private Integer hgwzNum13;
    private Integer jggtyphNum1;
    private Integer jggtyphNum2;
    private Integer jggtyphNum3;
    private String jggtyphDesc1;
    private String jggtyphDesc2;
    private String jggtyphDesc3;
    private String jggtyphDesc4;
    private String qtzdgzDesc1;
    private String zdfxsjDesc1;
    private String zdfxsjDesc2;
    private String zdfxyhDesc1;
    private Integer tsqkNum1;
    private Integer tsqkNum2;
    private Integer tsqkNum3;
    private Integer tsqkNum4;
    private Integer tsqkNum5;
    private Integer tsqkNum6;
    private Integer tsqkNum7;
    private Integer tsqkNum8;
    private Integer tsqkNum9;
    private Integer tsqkNum10;
    private Integer tsqkNum11;
    private Integer tsqkNum12;
    private Integer tsqkNum13;
    private String commitEhr;
    private Date commitTime;

    private String zdjsUrl;
    private String hgscUrl;
    private String nbhgjcUrl;
    private String hgxdpxUrl;
    private String ggtyphUrl;
    private String qtzdgzUrl;
    private String zdfxshUrl;

    private String zdjsName;
    private String hgscName;
    private String nbhgjcName;
    private String hgxdpxName;
    private String ggtyphName;
    private String qtzdgzName;
    private String zdfxshName;


}
