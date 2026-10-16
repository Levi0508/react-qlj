package com.gtja.dts.oaflow.pojo.po.zqpld;

import lombok.Data;

/**
 * @author wxx
 * @date 2023-06-26 10:11
 */
@Data
public class TbWarningInfoBond {
    private String uuid;
    private String operdate;
    private String opertime;
    private String ordersno;
    private String orderid;
    private String branchcode;
    private String branchname;
    private String custid;
    private String custname;
    private String secuid;
    private String market;
    private String stkcode;
    private String stkname;
    private String bsflag;
    private Double orderqty;
    private Double orderprice;
    private Double matchqty;
    private String matchtime;
    private Double matchprice;
    private Double matchamt;
    private String orderstatus;
    private Double chDebtRatio;
    private Double chSecuRatio;
    private Double debt;
    private Double secu;
    private Double debtB;
    private Double secuB;
    private String status;
    private String opway;
    private Double orderamt;
    private String flowSubmitStatus;
    private String piid;
    private String flowNo;
    private String orderDate;
    private String ordertime;

}
