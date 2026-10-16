package com.gtja.dts.oaflow.service.zqpld;

import com.gtja.dts.oaflow.pojo.po.zqpld.TbWarningInfoBond;

import java.io.IOException;
import java.text.ParseException;

/**
 * @author wxx
 * @date 2023-06-14 17:15
 */
public interface FlowDocCmpZqpldyjBjService {

    String submitSdk(String listDate, String deptId, String applyTitle, String creator, String flowVer, TbWarningInfoBond obj) throws IOException, ParseException;

}
