package com.gtja.dts.oaflow.controller;

import com.gtja.dts.oaflow.common.R;
import com.gtja.dts.oaflow.mapper.zpqld.FlowDocCmpZqpldyjBjMapper;
import com.gtja.dts.oaflow.mapper.zpqld.TbWarningInfoBondMapper;
import com.gtja.dts.oaflow.pojo.po.zqpld.TbWarningInfoBond;
import com.gtja.dts.oaflow.service.zqpld.FlowDocCmpZqpldyjBjService;
import com.gtja.dts.oaflow.utils.DateTimeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.text.ParseException;
import java.util.List;
import java.util.Optional;

/**
 * @author wxx
 * @date 2023-06-14 17:16
 */
@RestController
@RequiredArgsConstructor
@RequestMapping({"/ycjyBj"})
@Slf4j
public class FlowDocCmpZqpldyjBjController {

    private final FlowDocCmpZqpldyjBjService flowDocCmpZqpldyjBjService;
    private final TbWarningInfoBondMapper tbOaMapper;
    private final FlowDocCmpZqpldyjBjMapper flowDocCmpZqpldyjBjMapper;

    @PostMapping("/submitSdk")
    public R<String> submitSdk(@RequestParam(value = "applyTitle")  String applyTitle,
                               @RequestParam(value = "creator") String creator,
                               @RequestParam(value = "flowVer") String flowVer,
                               @RequestParam(value = "uuid") String uuid) throws IOException, ParseException {

        return R.data(flowDocCmpZqpldyjBjService.submitSdk("", "", applyTitle, creator, flowVer,
                Optional.ofNullable(tbOaMapper.findUnSubmitByUuid(uuid,"8")).orElse(new TbWarningInfoBond())));
    }

    @PostMapping("/batchSubmitSdk")
    public R<String> batchSubmitSdk(@RequestParam(value = "beginDate") String beginDate,
                                    @RequestParam(value = "endDate") String endDate,
                                    @RequestParam(value = "applyTitle")  String applyTitle,
                                    @RequestParam(value = "creator") String creator,
                                    @RequestParam(value = "flowVer") String flowVer) {
        List<TbWarningInfoBond> flowDataList = tbOaMapper.findUnSubmitFlowDataList(beginDate,endDate,"8");
        Integer isTradeDate = tbOaMapper.judgeIsTradeDate(DateTimeUtil.getCurrentShortDateStr());
        if(isTradeDate != 1){
            return R.fail("今天非交易日,下发失败!");
        }
        log.info("-----进入北交所债券预警批量下发,下发条数：{}------",flowDataList.size());
        flowDataList.forEach(o -> {
            try {
                flowDocCmpZqpldyjBjService.submitSdk("", "", applyTitle, creator, flowVer, o);
            } catch (IOException | ParseException e) {
                e.printStackTrace();
            }
        });
        return R.success("北交所债券预警批量下发成功");
    }

    @PostMapping("/checkData")
    public R<Integer> checkData(@RequestParam(value = "piid")  String piid) {
        log.info("CMP060——checkData请求进入----------{}------------",piid);
        Integer checkState = flowDocCmpZqpldyjBjMapper.checkData(piid);
        log.info("CMP060——end------checkState:{}-----{}-------------",checkState,piid);
        return R.data(checkState);
    }
}
