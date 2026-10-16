package com.gtja.dts.oaflow.service.thfxq;

import com.baomidou.mybatisplus.extension.service.IService;
import com.gtja.dts.oaflow.pojo.po.thfxq.*;
import com.gtja.dts.oaflow.pojo.vo.thfxq.FilePreviewVO;
import com.gtja.dts.oaflow.pojo.vo.thfxq.ApprDetailVO;
import com.gtja.dts.oaflow.pojo.vo.thfxq.FeedBackResultVO;
import com.gtja.dts.oaflow.pojo.vo.thfxq.UpdateClientStatusRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ThfxqService {

    List<ClientInfo> selectBasicInfo(String clientId);

    List<RelatedInfo> selectRelatedInfo(String clientId, String relatedType, String dataType);

    List<FileList> selectFileList(String clientId, String fileTypeNo, String objectId);

    List<DictSubentry> selectDict(String entryNo);

    List<String> selectErrType(String organFlag);

    List<WbKey> selectKey(String keyName);

    List<FeedBack> selectFeedBack(Integer clientId, String userId);

    List<FeedBack> selectFeedBackDesc(Integer clientId, String userId);

    /**
     * 通过clientId和userId调用存储过程查询反馈结果（使用VO）
     */
    FeedBackResultVO selectFeedBackWithVO(Integer clientId, String userId);

    /**
     * 通过clientId和userId调用存储过程查询反馈结果详细描述（使用VO）
     */
    FeedBackResultVO selectFeedBackDescWithVO(Integer clientId, String userId);

    Integer selectBatchTotal(String clientId);

    List<ApprDetail> selectApprDetails(String clientId,String batchNum);
    /*
    2026
    流程可编辑
    变更
    start
    */
    List<AreaCode> selectProvince();

    List<AreaCode> selectCity(String proCode);

    List<AreaCode> selectDistrict(String proCode, String areaCode);
    /*
    2026
    流程可编辑
    变更
    end
    */

    int deleteOrganEntity(String clientId, String organFlag, String relatedType, String relatedId, String dataStatus);

    List<RelatedInfo> selectOrganEntity(String clientId, String organFlag, String relatedName);
    //----20260310 start
    /**
     * 邮件发送
     */
    public void mailScheduled() throws Exception;

    /**
     * 证件过期客户批量下发OA流程（IBCM001）
     * 从 thjs.tb_flow_inst 查询 send_status='0' 且 raise_code='fxq_khsh' 的记录，
     * 关联客户信息和维护人后调用 /auto/submit 接口下发流程。
     */
    void submitClientIdExpiryFlow();

    //----20260310 end
    /**
     * 预览文件
     * @param file 上传的文件
     * @return 预览信息
     */
    FilePreviewVO previewFile(MultipartFile file);

    /**
     * 通过文件名预览文件
     * @param file 上传的文件
     * @param fileName 文件名
     * @return 预览信息
     */
    FilePreviewVO previewFile(MultipartFile file, String fileName);

    /**
     * 根据文件ID预览已存在的文件
     * @param id 文件ID
     * @return 预览信息
     */
    FilePreviewVO previewFileById(String id);

    /**
     * 根据文件信息预览已存在的文件
     * @param clientId 客户ID
     * @param fileTypeNo 文件类型编号
     * @param objectId 对象ID
     * @param fileName 文件名
     * @return 预览信息
     */
    FilePreviewVO previewFileByInfo(String clientId, String fileTypeNo, String objectId, String fileName);

    /**
     * 下载文件
     * @param id 附件ID
     * @return 文件下载结果
     */
    FileDownloadResult downloadFile(String id);

    /**
     * 更新客户信息
     * @param clientInfo 客户信息对象
     */
    void updateClient(ClientInfo clientInfo);

    /**
     * 保存关联人信息（批量保存到临时表）
     * @param relatedInfoList 关联人信息列表
     * @return 影响行数
     */
    int saveRelatedInfo(List<RelatedInfo> relatedInfoList);

    /**
     * 保存关联主体（批量保存到临时表）
     * @param organEntityList 关联主体列表
     * @return 影响行数
     */
    int saveOrganEntity(List<RelatedInfo> organEntityList);

    /**
     * 更新关联主体（先删除后插入）
     * @param clientId 客户ID
     * @param relatedName 关联人名称
     * @param organEntityList 关联主体列表
     * @return 影响行数
     */
    int updateOrganEntity(String clientId, String relatedName, List<RelatedInfo> organEntityList, String createUser);

    /**
     * 上传文件
     * @param clientId 客户ID
     * @param fileTypeNo 文件类型编号
     * @param file 上传的文件
     * @param objectId 对象ID
     * @param createUser 创建用户
     * @return 文件ID
     */
    String uploadFile(String clientId, String fileTypeNo, MultipartFile file, String objectId, String createUser);

    /**
     * 更新文件目录
     * @param id 文件ID
     * @param fileTypeNo 文件类型编号
     * @return 影响行数
     */
    int updateFileDir(String id, String fileTypeNo);

    /**
     * 删除附件（同时删除文件信息和文件内容）
     * @param filePkId 文件ID
     * @return 影响行数
     */
    int deleteFile(String filePkId);

    /**
     * 批量保存审核详情
     * @param apprDetailVO 审核详情VO
     * @return 影响行数
     */
    int saveApprDetails(ApprDetailVO apprDetailVO);

    /**
     * 保存审核列表（使用小驼峰参数）
     * @param clientId 客户ID
     * @param auditId 审核ID
     * @param remark 备注
     * @param createUser 创建用户
     * @return 影响行数
     */
    int saveApprList(String clientId, String auditId, String remark, String createUser);


    /**
     * 文件下载结果内部类
     */
    class FileDownloadResult {
        private final org.springframework.core.io.Resource resource;
        private final String fileName;
        private final String contentType;
        private final long contentLength;

        public FileDownloadResult(org.springframework.core.io.Resource resource, String fileName, String contentType, long contentLength) {
            this.resource = resource;
            this.fileName = fileName;
            this.contentType = contentType;
            this.contentLength = contentLength;
        }

        public org.springframework.core.io.Resource getResource() {
            return resource;
        }

        public String getFileName() {
            return fileName;
        }

        public String getContentType() {
            return contentType;
        }

        public long getContentLength() {
            return contentLength;
        }
    }

    /**
     * 更新客户状态
     * @param request 请求参数
     */
    void updateClientStatus(UpdateClientStatusRequest request);


    /**
     * 根据客户ID查询维护人员信息
     * @param clientId 客户ID
     * @return 维护人员信息列表
     */
    List<WbUser> selectMaintainer(String clientId,String userId);

    /**
     * 根据流程实例ID查询自检流程内容
     * @param piid 流程实例ID
     * @return 内容字符串
     */
    String selectContent(String piid);

    /**
     * 根据项目ID、流程实例ID和批次编号查询自检结果
     * @param projId 项目ID
     * @param piid 流程实例ID
     * @param checkBatchId 
     * @return 自检结果列表
     */
    List<TbProjlistCheckResult> selectSelfCheck(String projId, String piid, String checkBatchId);

    /**
     * 根据项目ID、流程实例ID和批次ID查询清单审核表单数据
     * @param projId 项目ID
     * @param piid 流程实例ID
     * @param batchId 批次ID
     * @return 清单审核表单数据列表
     */
    List<ProjInfo> selectProjInfo(String projId, String piid, String batchId, String pkId);

    /**
     * 根据清单自查批次号查询附件列表
     * @param checkBatchId 清单自查批次号
     * @return 附件列表
     */
    List<TProjSelfcheckFile> selectSelfCheckFile(String checkBatchId);

    /**
     * 下载清单自查附件（直接从应用服务器文件系统读取）
     * @param id 附件ID（T_PROJ_SELFCHECK_FILE.id）
     * @return 文件下载结果
     */
    FileDownloadResult downloadSelfCheckFile(String id);

    /**
     * 下载审核流程附件（filepath是相对路径，需拼接部署前缀）
     * @param filepath 相对路径，如 projlistFile/20260701/admin/xxx.pdf
     * @return 文件下载结果
     */
    FileDownloadResult downloadInoutCommentFile(String filepath);

    /**
     * 预览审核流程附件（filepath是相对路径，后台拼接部署前缀）
     * @param filepath 相对路径，如 projlistFile/20260701/admin/xxx.pdf
     * @return 文件预览结果
     */
    FilePreviewVO previewInoutCommentFile(String filepath);
}
