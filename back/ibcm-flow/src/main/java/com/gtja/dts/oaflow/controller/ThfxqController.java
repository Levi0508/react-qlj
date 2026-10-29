package com.gtja.dts.oaflow.controller;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.serializer.SerializerFeature;
import com.gtja.dts.oaflow.common.R;
import com.gtja.dts.oaflow.mapper.thfxq.ThfxqMapper;
import com.gtja.dts.oaflow.pojo.po.thfxq.ClientInfo;
import com.gtja.dts.oaflow.pojo.po.thfxq.RelatedInfo;
import com.gtja.dts.oaflow.service.thfxq.ThfxqService;
import com.gtja.dts.oaflow.pojo.vo.thfxq.FilePreviewVO;
import com.gtja.dts.oaflow.pojo.vo.thfxq.DeleteOrganEntityRequest;
import com.gtja.dts.oaflow.pojo.vo.thfxq.UpdateOrganEntityRequest;
import com.gtja.dts.oaflow.pojo.vo.thfxq.UpdateClientStatusRequest;
import com.gtja.dts.oaflow.pojo.vo.thfxq.ApprDetailVO;
import com.gtja.dts.oaflow.pojo.vo.thfxq.SaveApprListRequest;
import com.gtja.dts.oaflow.pojo.vo.thfxq.SaveApprDetailRequest;
import com.gtja.dts.oaflow.pojo.po.thfxq.ApprList;
import com.gtja.dts.oaflow.pojo.po.thfxq.ApprDetail;
import lombok.RequiredArgsConstructor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * @author 程婧
 * @date 2025-11-25 13:54
 */

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping({"thfxq"})
public class ThfxqController {
    private final ThfxqService ithfxqService;
    private final ThfxqMapper thfxqMapper;

    @GetMapping("/selectBasicInfo")
    public R<String> selectBasicInfo(@RequestParam(value = "clientId") String clientId){
        return R.data(JSON.toJSONString(ithfxqService.selectBasicInfo(clientId), SerializerFeature.WriteMapNullValue));
    }

    @GetMapping("/selectRelatedInfo")
    public R<String> selectRelatedInfo(@RequestParam(value = "clientId") String clientId,
                                       @RequestParam(value = "relatedType") String relatedType,
                                       @RequestParam(value = "dataType") String dataType){
        return R.data(JSON.toJSONString(ithfxqService.selectRelatedInfo(clientId, relatedType, dataType), SerializerFeature.WriteMapNullValue));
    }

    @GetMapping("/selectFileList")
    public R<String> selectFileList(@RequestParam(value = "clientId") String clientId,
                                    @RequestParam(value = "fileTypeNo") String fileTypeNo,
                                    @RequestParam(value = "objectId") String objectId){
        return R.data(JSON.toJSONString(ithfxqService.selectFileList(clientId, fileTypeNo, objectId), SerializerFeature.WriteMapNullValue));
    }

    @GetMapping("/selectDict")
    public R<String> selectDict(@RequestParam(value = "entryNo") String entryNo){
        return R.data(JSON.toJSONString(ithfxqService.selectDict(entryNo), SerializerFeature.WriteMapNullValue));
    }

    @GetMapping("/selectKey")
    public R<String> selectKey(@RequestParam(value = "keyName") String keyName){
        return R.data(JSON.toJSONString(ithfxqService.selectKey(keyName), SerializerFeature.WriteMapNullValue));
    }

    @GetMapping("/selectErrType")
    public R<String> selectErrType(@RequestParam(value = "organFlag", required = false) String organFlag){
        return R.data(JSON.toJSONString(ithfxqService.selectErrType(organFlag), SerializerFeature.WriteMapNullValue));
    }

    @GetMapping("/selectFeedBack")
    public R<String> selectFeedBack(@RequestParam(value = "clientId") String clientId,
                                    @RequestParam(value = "userId") String userId){
        return R.data(JSON.toJSONString(ithfxqService.selectFeedBack(Integer.parseInt(clientId), userId), SerializerFeature.WriteMapNullValue));
    }

    @GetMapping("/selectFeedBackDesc")
    public R<String> selectFeedBackDesc(@RequestParam(value = "clientId") String clientId,
                                        @RequestParam(value = "userId") String userId){
        return R.data(JSON.toJSONString(ithfxqService.selectFeedBackDesc(Integer.parseInt(clientId), userId), SerializerFeature.WriteMapNullValue));
    }

    @GetMapping("/selectBatchTotal")
    public R<String> selectBatchTotal(@RequestParam(value = "clientId") String clientId){
        return R.data(JSON.toJSONString(ithfxqService.selectBatchTotal(clientId), SerializerFeature.WriteMapNullValue));
    }

    @GetMapping("/selectApprDetails")
    public R<String> selectApprDetails(@RequestParam(value = "clientId") String clientId,
                                       @RequestParam(value = "batchNum") String batchNum){
        return R.data(JSON.toJSONString(ithfxqService.selectApprDetails(clientId,batchNum), SerializerFeature.WriteMapNullValue));
    }
    @GetMapping("/selectProvince")
    public R<String> selectProvince(){
        return R.data(JSON.toJSONString(ithfxqService.selectProvince(), SerializerFeature.WriteMapNullValue));
    }

    @GetMapping("/selectCity")
    public R<String> selectCity(@RequestParam(value = "proCode") String proCode){
        return R.data(JSON.toJSONString(ithfxqService.selectCity(proCode), SerializerFeature.WriteMapNullValue));
    }

    @GetMapping("/selectDistrict")
    public R<String> selectDistrict(@RequestParam(value = "proCode") String proCode,
                                    @RequestParam(value = "areaCode") String areaCode){
        return R.data(JSON.toJSONString(ithfxqService.selectDistrict(proCode, areaCode), SerializerFeature.WriteMapNullValue));
    }

    @PostMapping("/deleteOrganEntity")
    public R<String> deleteOrganEntity(@RequestBody DeleteOrganEntityRequest request){
        int result = ithfxqService.deleteOrganEntity(request.getClientId(), request.getOrganFlag(), request.getRelatedType(), request.getRelatedId(), request.getDataStatus());
        return R.data(JSON.toJSONString(result, SerializerFeature.WriteMapNullValue));
    }

    @GetMapping("/selectOrganEntity")
    public R<String> selectOrganEntity(@RequestParam(value = "clientId") String clientId,
                                       @RequestParam(value = "organFlag") String organFlag,
                                       @RequestParam(value = "relatedName", required = false) String relatedName){
        return R.data(JSON.toJSONString(ithfxqService.selectOrganEntity(clientId, organFlag, relatedName), SerializerFeature.WriteMapNullValue));
    }
    /**
     * 更新客户基本信息
     * @param clientInfo 客户信息
     * @return 操作结果
     */
    @PostMapping("/updateClient")
    public R<String> updateClient(@RequestBody ClientInfo clientInfo) {
        try {
            ithfxqService.updateClient(clientInfo);
            // 存储过程执行成功后，可通过clientInfo.getReturnMsg()获取返回信息
            return R.data("{\"returnMsg\":\"" + (clientInfo.getReturnMsg() != null ? clientInfo.getReturnMsg() : "") + "\",\"returnCode\":\"" + (clientInfo.getReturnCode() != null ? clientInfo.getReturnCode() : "") + "\"}");
        } catch (Exception e) {
            log.error("更新客户信息失败", e);
            return R.fail("更新客户信息失败: " + e.getMessage());
        }
    }

    /**
     * 保存关联人信息（批量保存到临时表）
     * @param relatedInfoList 关联人信息列表
     * @return 影响行数
     */
    @PostMapping("/saveRelatedInfo")
    public R<String> saveRelatedInfo(@RequestBody List<RelatedInfo> relatedInfoList) {
        try {
            int result = ithfxqService.saveRelatedInfo(relatedInfoList);
            return R.data(JSON.toJSONString(result, SerializerFeature.WriteMapNullValue));
        } catch (Exception e) {
            log.error("保存关联人信息失败", e);
            return R.fail("保存关联人信息失败: " + e.getMessage());
        }
    }

    /**
     * 删除关联人信息
     * @param relatedId 关联人ID
     * @return 影响行数
     */
    @PostMapping("/deleteRelatedInfo")
    public R<String> deleteRelatedInfo(@RequestBody Map<String, String> request) {
        try {
            String relatedId = request.get("relatedId");
            int result = thfxqMapper.deleteRelatedInfoTmp(relatedId);
            return R.data(JSON.toJSONString(result, SerializerFeature.WriteMapNullValue));
        } catch (Exception e) {
            log.error("删除关联人信息失败", e);
            return R.fail("删除关联人信息失败: " + e.getMessage());
        }
    }

    /**
     * 保存关联主体（批量保存到临时表）
     * @param organEntityList 关联主体列表
     * @return 影响行数
     */
    @PostMapping("/saveOrganEntity")
    public R<String> saveOrganEntity(@RequestBody List<RelatedInfo> organEntityList) {
        try {
            int result = ithfxqService.saveOrganEntity(organEntityList);
            return R.data(JSON.toJSONString(result, SerializerFeature.WriteMapNullValue));
        } catch (Exception e) {
            log.error("保存关联主体失败", e);
            return R.fail("保存关联主体失败: " + e.getMessage());
        }
    }

    /**
     * 更新关联主体（先删除后插入）
     * @param request 包含clientId、relatedName、organEntityList的请求
     * @return 影响行数
     */
    @PostMapping("/updateOrganEntity")
    public R<String> updateOrganEntity(@RequestBody UpdateOrganEntityRequest request) {
        try {
            int result = ithfxqService.updateOrganEntity(request.getClientId(), request.getRelatedName(), request.getOrganEntityList(), request.getCreateUser());
            return R.data(JSON.toJSONString(result, SerializerFeature.WriteMapNullValue));
        } catch (Exception e) {
            log.error("更新关联主体失败", e);
            return R.fail("更新关联主体失败: " + e.getMessage());
        }
    }

    /**
     * 上传文件
     * @param clientId 客户ID
     * @param fileTypeNo 文件类型编号
     * @param file 上传的文件
     * @param objectId 对象ID
     * @param createBy 创建人
     * @return 文件ID
     */
    @PostMapping("/uploadFile")
    public R<String> uploadFile(@RequestParam("clientId") String clientId,
                                @RequestParam("fileTypeNo") String fileTypeNo,
                                @RequestParam("file") MultipartFile file,
                                @RequestParam(value = "objectId", required = false) String objectId,
                                @RequestParam(value = "createBy", required = false) String createBy) {
        try {
            if (createBy == null || createBy.trim().isEmpty()) {
                createBy = "system";
            }
            String fileId = ithfxqService.uploadFile(clientId, fileTypeNo, file, objectId, createBy);
            return R.data(JSON.toJSONString(fileId, SerializerFeature.WriteMapNullValue));
        } catch (Exception e) {
            log.error("文件上传失败", e);
            return R.fail("文件上传失败: " + e.getMessage());
        }
    }

    /**
     * 更新文件目录
     * @param id 文件ID
     * @param fileTypeNo 文件类型编号
     * @return 影响行数
     */
    @PostMapping("/updateFileDir")
    public R<String> updateFileDir(@RequestParam("id") String id, @RequestParam("fileTypeNo") String fileTypeNo) {
        try {
            int result = ithfxqService.updateFileDir(id, fileTypeNo);
            return R.data(JSON.toJSONString(result, SerializerFeature.WriteMapNullValue));
        } catch (Exception e) {
            log.error("更新文件目录失败", e);
            return R.fail("更新文件目录失败: " + e.getMessage());
        }
    }

    /**
     * 删除附件（同时删除文件信息和文件内容）
     * @param filePkId 文件ID
     * @return 影响行数
     */
    @PostMapping("/deleteFile")
    public R<String> deleteFile(@RequestParam("filePkId") String filePkId) {
        try {
            int result = ithfxqService.deleteFile(filePkId);
            return R.data(JSON.toJSONString(result, SerializerFeature.WriteMapNullValue));
        } catch (Exception e) {
            log.error("删除附件失败", e);
            return R.fail("删除附件失败: " + e.getMessage());
        }
    }

    /**
     * 批量保存审核详情
     * @param apprDetailVO 审核详情VO
     * @return 影响行数
     */
    @PostMapping("/saveApprDetails")
    public R<String> saveApprDetails(@RequestBody ApprDetailVO apprDetailVO) {
        try {
            int result = ithfxqService.saveApprDetails(apprDetailVO);
            return R.data(JSON.toJSONString(result, SerializerFeature.WriteMapNullValue));
        } catch (Exception e) {
            log.error("保存审核详情失败", e);
            return R.fail("保存审核详情失败: " + e.getMessage());
        }
    }


    /**
     * 保存审核列表（使用小驼峰参数）
     * @param request 请求参数
     * @return 影响行数
     */
    @PostMapping("/saveApprList")
    public R<String> saveApprListCamel(@RequestBody SaveApprListRequest request) {
        try {
            int result = ithfxqService.saveApprList(request.getClientId(), request.getAuditId(), request.getRemark(), request.getCreateUser());
            return R.data(JSON.toJSONString(result, SerializerFeature.WriteMapNullValue));
        } catch (Exception e) {
            log.error("保存审核列表失败", e);
            return R.fail("保存审核列表失败: " + e.getMessage());
        }
    }



    /**
     * 统一的文件预览接口
     * @param id 文件ID（可选）
     * @param file 上传的文件（可选）
     * @param clientId 客户ID（可选）
     * @param fileTypeNo 文件类型编号（可选）
     * @param objectId 对象ID（可选）
     * @param fileName 文件名（可选）
     * @param extension 文件扩展名（可选）
     * @return 预览URL
     */
    @PostMapping("/previewFile")
    public R<FilePreviewVO> previewFile(
            @RequestParam(value = "id", required = false) String id,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "clientId", required = false) String clientId,
            @RequestParam(value = "fileTypeNo", required = false) String fileTypeNo,
            @RequestParam(value = "objectId", required = false) String objectId,
            @RequestParam(value = "fileName", required = false) String fileName,
            @RequestParam(value = "extension", required = false) String extension) {
        try {
            FilePreviewVO result;
            System.out.println("接收到的id:"+id);
            System.out.println("接收到的clientId:"+clientId);
            System.out.println("接收到的fileTypeNo:"+fileTypeNo);
            System.out.println("接收到的objectId:"+objectId);
            System.out.println("接收到的fileName:"+fileName);
//            if (file != null && !file.isEmpty()) {
//                // 上传新文件预览（数据库数据预览）
//                if (extension != null && !extension.isEmpty()) {
//                    fileName = fileName != null ? fileName + "." + extension : file.getOriginalFilename();
//                }
//                result = ithfxqService.previewFile(file, fileName);
//            } else
            if (id != null && !id.isEmpty()) {
                // 通过ID预览已存在的文件（查询数据库blob）
                result = ithfxqService.previewFileById(id);
            } else if (clientId != null && !clientId.isEmpty() && fileName != null && !fileName.isEmpty()) {
                // 通过文件信息预览已存在的文件（查询服务器磁盘地址）
                result = ithfxqService.previewFileByInfo(clientId, fileTypeNo, objectId, fileName);
            } else {
                return R.fail("参数不完整，请提供file或id或文件信息");
            }

            return R.data(result);
        } catch (Exception e) {
            log.error("文件预览失败", e);
            return R.fail(e.getMessage());
        }
    }

    /**
     * 附件下载接口
     * @param id 附件ID
     * @param request HTTP请求
     * @return 文件下载响应
     */
    @GetMapping("/downloadFile")
    public ResponseEntity<Resource> downloadFile(@RequestParam("id") String id, HttpServletRequest request) {
        try {
            System.out.println("=== downloadFile called ===");
            System.out.println("ID: " + id);

            // 调用服务层下载文件
            ThfxqService.FileDownloadResult downloadResult = ithfxqService.downloadFile(id);

            System.out.println("Download result: " + downloadResult);
            System.out.println("FileName: " + downloadResult.getFileName());
            System.out.println("ContentType: " + downloadResult.getContentType());
            System.out.println("ContentLength: " + downloadResult.getContentLength());

            // 设置响应头
            String contentType = downloadResult.getContentType();
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            String fileName = downloadResult.getFileName();
            if (fileName == null || fileName.trim().isEmpty()) {
                fileName = "download_" + id;
            }

            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8.toString());

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"")
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(downloadResult.getContentLength()))
                    .body(downloadResult.getResource());

        } catch (Exception e) {
            // 打印详细的错误堆栈
            System.out.println("=== ERROR in downloadFile ===");
            System.out.println("Error: " + e.getMessage());
            e.printStackTrace();

            // 返回详细错误信息而不是404
            String errorFileName = "download_error.txt";
            String errorContent = "下载失败: " + e.getMessage() + "\n\n" + getStackTrace(e);

            return ResponseEntity.status(500)
                    .contentType(MediaType.TEXT_PLAIN)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + errorFileName + "\"")
                    .body(new org.springframework.core.io.ByteArrayResource(errorContent.getBytes()));
        }
    }

    private String getStackTrace(Exception e) {
        java.io.StringWriter sw = new java.io.StringWriter();
        java.io.PrintWriter pw = new java.io.PrintWriter(sw);
        e.printStackTrace(pw);
        return sw.toString();
    }
    /**
     * 更新客户状态
     * @param request 请求参数
     * @return 操作结果
     */
    @PostMapping("/updateClientStatus")
    public R<String> updateClientStatus(@RequestBody UpdateClientStatusRequest request) {
        try {
            ithfxqService.updateClientStatus(request);
            return R.data("{\"returnMsg\":\"" + (request.getReturnMsg() != null ? request.getReturnMsg() : "") + "\",\"returnCode\":\"" + (request.getReturnCode() != null ? request.getReturnCode() : "") + "\"}");
        } catch (Exception e) {
            log.error("更新客户状态失败", e);
            return R.fail("更新客户状态失败: " + e.getMessage());
        }
    }

    /**
     * 查询客户维护人信息
     * @param clientId 请求参数
     * @return 操作结果
     */
    @GetMapping("/getMaintainer")
    public R<String> getMaintainer(@RequestParam(value = "clientId") String clientId,@RequestParam(value = "userId") String userId) {
        return R.data(JSON.toJSONString(ithfxqService.selectMaintainer(clientId,userId), SerializerFeature.WriteMapNullValue));
    }

    /**
     * 根据流程实例ID查询自检流程内容
     * @param piid 流程实例ID
     * @return 内容字符串
     */
    @GetMapping("/selectContent")
    public R<String> selectContent(@RequestParam(value = "piid") String piid) {
        return R.data(JSON.toJSONString(ithfxqService.selectContent(piid), SerializerFeature.WriteMapNullValue));
    }

    /**
     * 根据项目ID、流程实例ID和业务日期查询自检结果
     * @param projId 项目ID
     * @param piid 流程实例ID
     * @param busiDate 业务日期（格式：yyyyMMdd）
     * @return 自检结果列表
     */
    @GetMapping("/selectSelfCheck")
    public R<String> selectSelfCheck(@RequestParam(value = "projId") String projId,
                                     @RequestParam(value = "piid") String piid,
                                     @RequestParam(value = "checkBatchId") String checkBatchId) {
        return R.data(JSON.toJSONString(ithfxqService.selectSelfCheck(projId, piid, checkBatchId), SerializerFeature.WriteMapNullValue));
    }

    /**
     * 根据项目ID、流程实例ID和批次ID查询清单审核表单数据
     * @param projId 项目ID
     * @param piid 流程实例ID
     * @param batchId 批次ID
     * @return 清单审核表单数据列表
     */
    @GetMapping("/selectProjInfo")
    public R<String> selectProjInfo(@RequestParam(value = "projId") String projId,
                                    @RequestParam(value = "piid") String piid,
                                    @RequestParam(value = "batchId") String batchId,
                                    @RequestParam(value = "pkId", required = false) String pkId) {
        return R.data(JSON.toJSONString(ithfxqService.selectProjInfo(projId, piid, batchId, pkId), SerializerFeature.WriteMapNullValue));
    }

    /**
     * 按流程实例查询隔离墙操作变动审核结果标识
     * @param piid 流程实例ID
     * @return check_result_flag，0 或 1；未审核时为空
     */
    @GetMapping("/selectCheckResultFlag")
    public R<String> selectCheckResultFlag(@RequestParam(value = "piid") String piid) {
        return R.data(JSON.toJSONString(ithfxqService.selectCheckResultFlag(piid), SerializerFeature.WriteMapNullValue));
    }

    /**
     * 根据清单自查批次号查询附件列表
     * @param checkBatchId 清单自查批次号
     * @return 附件列表
     */
    @GetMapping("/selectSelfCheckFile")
    public R<String> selectSelfCheckFile(@RequestParam(value = "checkBatchId") String checkBatchId) {
        return R.data(JSON.toJSONString(ithfxqService.selectSelfCheckFile(checkBatchId), SerializerFeature.WriteMapNullValue));
    }

    /**
     * 下载清单自查附件（直接从应用服务器文件系统读取）
     * @param id 附件ID（T_PROJ_SELFCHECK_FILE.id）
     * @return 文件下载响应
     */
    @GetMapping("/downloadSelfCheckFile")
    public ResponseEntity<Resource> downloadSelfCheckFile(@RequestParam("id") String id) {
        String trimmedId = id == null ? null : id.trim();
        try {
            ThfxqService.FileDownloadResult downloadResult = ithfxqService.downloadSelfCheckFile(trimmedId);

            String contentType = downloadResult.getContentType();
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            String fileName = downloadResult.getFileName();
            if (fileName == null || fileName.trim().isEmpty()) {
                fileName = "download_" + trimmedId;
            }

            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8.toString());

            log.info("清单自查附件下载成功: id={}, filePath={}, fileName={}, size={}",
                    trimmedId, downloadResult.getResource().getFilename(), fileName, downloadResult.getContentLength());

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"")
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(downloadResult.getContentLength()))
                    .body(downloadResult.getResource());

        } catch (Exception e) {
            log.error("清单自查附件下载失败: id={}, 原始id={}, 错误信息={}", trimmedId, id, e.getMessage(), e);
            String errorFileName = "download_error.txt";
            String errorContent = "下载失败: " + e.getMessage();
            return ResponseEntity.status(500)
                    .contentType(MediaType.TEXT_PLAIN)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + errorFileName + "\"")
                    .body(new org.springframework.core.io.ByteArrayResource(errorContent.getBytes()));
        }
    }

    /**
     * 下载审核流程附件（filepath是相对路径，后台拼接部署前缀）
     * @param filepath 相对路径，如 projlistFile/20260701/admin/xxx.pdf
     * @return 文件下载响应
     */
    @GetMapping("/downloadInoutCommentFile")
    public ResponseEntity<Resource> downloadInoutCommentFile(@RequestParam("filepath") String filepath) {
        try {
            ThfxqService.FileDownloadResult downloadResult = ithfxqService.downloadInoutCommentFile(filepath);

            String contentType = downloadResult.getContentType();
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            String fileName = downloadResult.getFileName();
            if (fileName == null || fileName.trim().isEmpty()) {
                fileName = "download_" + System.currentTimeMillis();
            }

            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8.toString());

            log.info("审核流程附件下载成功: filepath={}, fileName={}, size={}",
                    filepath, fileName, downloadResult.getContentLength());

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"")
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(downloadResult.getContentLength()))
                    .body(downloadResult.getResource());

        } catch (Exception e) {
            log.error("审核流程附件下载失败: filepath={}, 错误信息={}", filepath, e.getMessage(), e);
            String errorFileName = "download_error.txt";
            String errorContent = "下载失败: " + e.getMessage();
            return ResponseEntity.status(500)
                    .contentType(MediaType.TEXT_PLAIN)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + errorFileName + "\"")
                    .body(new org.springframework.core.io.ByteArrayResource(errorContent.getBytes()));
        }
    }

    /**
     * 预览审核流程附件（filepath是相对路径，后台拼接部署前缀）
     * @param filepath 相对路径，如 projlistFile/20260701/admin/xxx.pdf
     * @return 文件预览结果
     */
    @PostMapping("/previewInoutCommentFile")
    public R<FilePreviewVO> previewInoutCommentFile(@RequestParam("filepath") String filepath) {
        try {
            FilePreviewVO result = ithfxqService.previewInoutCommentFile(filepath);
            return R.data(result);
        } catch (Exception e) {
            log.error("审核流程附件预览失败: filepath={}", filepath, e);
            return R.fail(e.getMessage());
        }
    }
}
