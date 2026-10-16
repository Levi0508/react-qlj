package com.gtja.dts.oaflow.service.tyglryj;

import com.gtja.dts.oaflow.pojo.po.tyglryj.tbManagerMatchInfo;
import com.gtja.dts.oaflow.pojo.po.zqpld.TbWarningInfoBond;
import org.apache.ibatis.annotations.Param;

import java.io.IOException;
import java.text.ParseException;
import java.util.List;

/**
 * @author wxx
 * @date 2024-03-05 13:47
 */
public interface FlowDocCmpTyglryjService {

    String submitSdk(String id, String applyTitle, String creator, String flowVer) throws IOException, ParseException;


    List<tbManagerMatchInfo> findTradeDetailsPage(String pid, Integer page, Integer pageSize);
}
