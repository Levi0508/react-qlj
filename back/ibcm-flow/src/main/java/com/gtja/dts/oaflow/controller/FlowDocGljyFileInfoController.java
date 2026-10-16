package com.gtja.dts.oaflow.controller;

import com.gtja.dts.common.domain.ResponseResult;
import com.gtja.dts.oaflow.pojo.po.FlowDocCmpFileInfo;
import com.gtja.dts.oaflow.service.FlowDocGljyFileInfoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


/**
 * @author wxx
 * @date 2021-08-26 15:49
 */
@RestController
@RequestMapping("flowDocGljyFileInfo")
@RequiredArgsConstructor
@Slf4j
public class FlowDocGljyFileInfoController {
    private final FlowDocGljyFileInfoService  flowDocGljyFileInfoService;

    @PostMapping("/createFile/**")
    public ResponseResult<String> createFile(@RequestParam(value = "fileId")String fileId,@RequestParam(value = "fileName")String fileName,
                                     @RequestParam(value = "uploadUser")String uploadUser, @RequestParam(value = "bucket")String bucket,
                                     @RequestParam(value = "piid")String piid, @RequestParam(value = "systemId")String systemId,
                                     @RequestParam(value = "flowCode")String flowCode){
        FlowDocCmpFileInfo flowDocCmpFileInfo = FlowDocCmpFileInfo.builder().fileId(fileId).fileName(fileName)
                .uploadUser(uploadUser).bucket(bucket).piid(piid).systemId(systemId).flowCode(flowCode).build();
        if(flowDocGljyFileInfoService.createFile(flowDocCmpFileInfo)){
            log.info("入库成功文件名字为{}",fileName);
        }
        return ResponseResult.success(0,"操作成功",fileName);
    }

}
