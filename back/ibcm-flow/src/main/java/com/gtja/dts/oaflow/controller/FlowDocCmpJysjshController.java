package com.gtja.dts.oaflow.controller;

import com.alibaba.fastjson.JSONObject;
import com.gtja.dts.oaflow.common.R;
import com.gtja.dts.oaflow.mapper.FlowDocCmpJysjshMapper;
import com.gtja.dts.oaflow.pojo.vo.CleanInVo;
import com.gtja.dts.oaflow.pojo.vo.JysJshVo;
import com.gtja.dts.oaflow.service.FlowDocCmpJysjshService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.List;

/**
 * @author wxx
 * @date 2023-06-14 17:16
 */
@RestController
@RequiredArgsConstructor
@RequestMapping({"/jysjsh"})
@Slf4j
public class FlowDocCmpJysjshController {

    private  final FlowDocCmpJysjshService flowDocCmpJysjshService;
    private final FlowDocCmpJysjshMapper flowDocCmpJysjshMapper;


    @PostMapping("/submitSdk")
    public R<String> batchSubmitSdk(@RequestParam(value = "id") String id,
                                    @RequestParam(value = "applyTitle")  String applyTitle,
                                    @RequestParam(value = "creator") String creator,
                                    @RequestParam(value = "flowVer") String flowVer) {
        //关联人
        List<String> relateList = flowDocCmpJysjshMapper.findRelateList(id);
        JysJshVo jshObj = flowDocCmpJysjshMapper.findJshObj(id);
        List<String> piidList = new ArrayList<>();
        if(relateList.size() == 0){
            return R.fail("无下发数据!");
        }
        relateList.forEach(o -> {
            try {
                String piid = flowDocCmpJysjshService.submitSdk(id, applyTitle, creator, flowVer, o, jshObj);
                piidList.add(piid);
            } catch (IOException | ParseException e) {
                e.printStackTrace();
            }
        });
        return R.data(JSONObject.toJSONString(piidList));
    }

    /**
     *  获取重点账户信息和监管明细
     *
     * @param customerId
     * @param branchCode
     * @return
     */
    @PostMapping("/selectKeyAccount")
    public R<String> batchSubmitSdk(@RequestParam(value = "customerId") String customerId,
                                    @RequestParam(value = "branchCode")  String branchCode) {

        List<CleanInVo> cleanInVos = flowDocCmpJysjshMapper.selectKeyAccountByBranchAndCus(customerId, branchCode);
        if(cleanInVos.size() == 0){
            return R.data("");
        }
        return R.data(JSONObject.toJSONString(cleanInVos.get(0)));
    }

    /**
     * 附件下载
     *
     * @return
     */
    @GetMapping(value = "/download")
    public void downloadFormPdf(HttpServletResponse response,
                                @RequestParam(value = "filePath") String filePath,
                                @RequestParam(value = "fileName") String fileName) throws UnsupportedEncodingException {
        flowDocCmpJysjshService.downloadFile(response, filePath, fileName);
    }

}
