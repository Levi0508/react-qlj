package com.gtja.dts.oaflow.controller;

import com.gtja.dts.oaflow.common.R;
import com.gtja.dts.oaflow.mapper.zpqld.FlowDocCmpZqpldyjMapper;
import com.gtja.dts.oaflow.mapper.zpqld.TbResult1808032230dOaNewMapper;
import com.gtja.dts.oaflow.mapper.zpqld.TbWarningInfoBondMapper;
import com.gtja.dts.oaflow.pojo.po.zqpld.TbResult1808032230dOaNew;
import com.gtja.dts.oaflow.pojo.po.zqpld.TbWarningInfoBond;
import com.gtja.dts.oaflow.service.zqpld.FlowDocCmpZqpldyjService;
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
@RequestMapping({"/ycjy"})
@Slf4j
public class FlowDocCmpZqpldyjController {

    private  final FlowDocCmpZqpldyjService flowDocCmpZqpldyjService;
    private final TbWarningInfoBondMapper tbOaMapper;
    private final FlowDocCmpZqpldyjMapper flowDocCmpZqpldyjMapper;

    @PostMapping("/submitSdk")
    public R<String> submitSdk(@RequestParam(value = "applyTitle")  String applyTitle,
                               @RequestParam(value = "creator") String creator,
                               @RequestParam(value = "flowVer") String flowVer,
                               @RequestParam(value = "uuid") String uuid) throws IOException, ParseException {

        return R.data(flowDocCmpZqpldyjService.submitSdk("", "", applyTitle, creator, flowVer,
                Optional.ofNullable(tbOaMapper.findUnSubmitByUuid(uuid,"1")).orElse(new TbWarningInfoBond())));
    }

    @PostMapping("/batchSubmitSdk")
    public R<String> batchSubmitSdk(@RequestParam(value = "beginDate") String beginDate,
                                    @RequestParam(value = "endDate") String endDate,
                                    @RequestParam(value = "applyTitle")  String applyTitle,
                                    @RequestParam(value = "creator") String creator,
                                    @RequestParam(value = "flowVer") String flowVer) {
        List<TbWarningInfoBond> flowDataList = tbOaMapper.findUnSubmitFlowDataList(beginDate,endDate,"1");
        Integer isTradeDate = tbOaMapper.judgeIsTradeDate(DateTimeUtil.getCurrentShortDateStr());
        if(isTradeDate != 1){
            return R.fail("今天非交易日,下发失败!");
        }
        //数据小于五条说明数据有问题，不下发
        if(flowDataList.size() < 5){
            return R.fail("预警数据不足5条,下发失败!");
        }
        flowDataList.forEach(o -> {
            try {
                flowDocCmpZqpldyjService.submitSdk("", "", applyTitle, creator, flowVer, o);
            } catch (IOException | ParseException e) {
                e.printStackTrace();
            }
        });
        return R.success("批量下发成功");
    }

    @PostMapping("/checkData")
    public R<Integer> checkData(@RequestParam(value = "piid")  String piid) {
        log.info("CMP060——checkData请求进入----------piid-{}------------",piid);
        Integer checkState = flowDocCmpZqpldyjMapper.checkData(piid);
        log.info("CMP060——end------checkState{}-----piid-{}-------------",checkState,piid);
        return R.data(checkState);
    }
}
