package com.gtja.dts.oaflow.controller;

import cn.hutool.core.text.AntPathMatcher;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.serializer.SerializerFeature;
import com.gtja.dts.oaflow.common.R;
import com.gtja.dts.oaflow.mapper.FlowDocCmpBranchYearSumMapper;
import com.gtja.dts.oaflow.models.FtpProperties;
import com.gtja.dts.oaflow.service.FlowDocCmpBranchYearSumService;
import com.gtja.dts.oaflow.service.impl.FileUploadService;
import com.gtja.dts.oaflow.utils.FtpUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.net.ftp.FTPClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.HandlerMapping;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.UnsupportedEncodingException;

/**
 * @author wxx
 * @date 2023-04-27 13:54
 */
@RestController
@RequiredArgsConstructor
@RequestMapping({"/nbhzCommon"})
@Slf4j
public class NbhzController {

    private final FlowDocCmpBranchYearSumService flowDocCmpBranchYearSumService;

    @GetMapping("/findYearSumInfoByPiid")
    public R<String> findYearSumInfoByPiid(@RequestParam(value = "piid") String piid){
        return R.data(JSON.toJSONString(flowDocCmpBranchYearSumService.findYearSumInfoByPiid(piid), SerializerFeature.WriteMapNullValue));
    }

    @PostMapping("/draft")
    public R<String> draft(@RequestParam(value = "reportYear") String reportYear,
                            @RequestParam(value = "deptId") String deptId,
                            @RequestParam(value = "applyTitle")  String applyTitle,
                            @RequestParam(value = "creator") String creator,
                            @RequestParam(value = "ishalfyear") String ishalfyear,
                           @RequestParam(value = "udf1") String udf1){
        return R.data(flowDocCmpBranchYearSumService.draft(reportYear,deptId,applyTitle,creator,ishalfyear,udf1));
    }
}
