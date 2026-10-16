package com.gtja.dts.oaflow.service.impl.thfxq;

import cn.hutool.core.collection.CollectionUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.gtja.dts.oaflow.mapper.thfxq.TbFlowInstMapper;
import com.gtja.dts.oaflow.pojo.vo.thfxq.ClientFlowSubmitVO;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gtja.dts.oaflow.mapper.thfxq.ThfxqMailMapper;
import com.gtja.dts.oaflow.mapper.thfxq.ThfxqMapper;
import com.gtja.dts.oaflow.pojo.po.thfxq.*;
import com.gtja.dts.oaflow.pojo.vo.thfxq.FilePreviewVO;
import com.gtja.dts.oaflow.pojo.vo.thfxq.ApprDetailVO;
import com.gtja.dts.oaflow.pojo.vo.thfxq.FeedBackResultVO;
import com.gtja.dts.oaflow.pojo.vo.thfxq.UpdateClientStatusRequest;
import com.gtja.dts.oaflow.pojo.po.thfxq.ApprList;
import com.gtja.dts.oaflow.service.thfxq.ThfxqService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.sql.Blob;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * @author 程婧
 * @date 2025-11-25 9:47
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ThfxqServiceImpl implements ThfxqService {

    private final RestTemplate restTemplate = new RestTemplate();

    private static final Logger logger = LoggerFactory.getLogger(ThfxqServiceImpl.class);

    @Autowired
    private ThfxqMailMapper fxqMailMapper;

    @Autowired
    private TbFlowInstMapper tbFlowInstMapper;

    private final ThfxqMapper thfxqMapper;

    @Autowired
    private ApplicationContext applicationContext;

    //@Value("${libreoffice.path:D:\\LibreOffice\\program}")
    @Value("${libreoffice.path:/data/libreoffice/program}")
    private String libreOfficePath;

    @Value("${file.preview.temp.path:./temp/preview}")
    private String tempPreviewPath;

    @Value("${thfxq.client-id-expiry.user-id:035937}")
    private String clientIdExpiryUserId;

    @Value("${thfxq.client-id-expiry.user-name:chenhaiyang}")
    private String clientIdExpiryUserName;

    @Value("${server.context-path:}")
    private String contextPath;

    @Value("${server.port:8094}")
    private String serverPort;

    // 支持的文件类型
    private static final List<String> SUPPORTED_EXTENSIONS = Arrays.asList("doc", "docx", "xls", "xlsx", "ppt", "pptx", "pdf", "txt", "rtf", "odt", "ods", "odp", "jpg", "jpeg", "png", "gif", "bmp", "webp");

    // 不需要LibreOffice转换的轻量级文件类型
    private static final List<String> LIGHTWEIGHT_EXTENSIONS = Arrays.asList("txt", "jpg", "jpeg", "png", "gif", "bmp", "webp");

    // 需要LibreOffice转换的文档类型
    private static final List<String> DOCUMENT_EXTENSIONS = Arrays.asList("doc", "docx", "xls", "xlsx", "ppt", "pptx", "rtf", "odt", "ods", "odp");

    // 优化：LibreOffice可用性检查标志
    private volatile boolean libreOfficeChecked = false;

    @Override
    public List<ClientInfo> selectBasicInfo(String clientId) {
        return thfxqMapper.selectBasicInfo(clientId);
    }

    @Override
    public List<RelatedInfo> selectRelatedInfo(String clientId, String relatedType, String dataType) {
        return thfxqMapper.selectRelatedInfo(clientId, relatedType, dataType);
    }

    @Override
    public List<FileList> selectFileList(String clientId, String fileTypeNo, String objectId) {
        return thfxqMapper.selectFileList(clientId, fileTypeNo, objectId);
    }

    @Override
    public List<DictSubentry> selectDict(String entryNo) {
        return thfxqMapper.selectDict(entryNo);
    }

    @Override
    public List<WbKey> selectKey(String keyName) {
        return thfxqMapper.selectKey(keyName);
    }

    @Override
    public List<String> selectErrType(String organFlag) {
        return thfxqMapper.selectErrType(organFlag);
    }

    @Override
    public List<FeedBack> selectFeedBack(Integer clientId, String userId) {
        FeedBackResultVO vo = new FeedBackResultVO();
        vo.setClientId(clientId);
        vo.setUserId(userId);
        thfxqMapper.selectFeedBack(vo);
        return vo.getResult();
    }

    @Override
    public List<FeedBack> selectFeedBackDesc(Integer clientId, String userId) {
        FeedBackResultVO vo = new FeedBackResultVO();
        vo.setClientId(clientId);
        vo.setUserId(userId);
        thfxqMapper.selectFeedBackDesc(vo);
        return vo.getResult();
    }

    @Override
    public FeedBackResultVO selectFeedBackWithVO(Integer clientId, String userId) {
        FeedBackResultVO vo = new FeedBackResultVO();
        vo.setClientId(clientId);
        vo.setUserId(userId);
        thfxqMapper.selectFeedBack(vo);
        return vo;
    }

    @Override
    public FeedBackResultVO selectFeedBackDescWithVO(Integer clientId, String userId) {
        FeedBackResultVO vo = new FeedBackResultVO();
        vo.setClientId(clientId);
        vo.setUserId(userId);
        thfxqMapper.selectFeedBackDesc(vo);
        return vo;
    }

    @Override
    public Integer selectBatchTotal(String clientId) {
        return thfxqMapper.selectBatchTotal(clientId);
    }


    @Override
    public List<ApprDetail> selectApprDetails(String clientId, String batchNum) {
        return thfxqMapper.selectApprDetails(clientId, batchNum);
    }

    @Override
    public List<AreaCode> selectProvince() {
        return thfxqMapper.selectProvince();
    }

    @Override
    public List<AreaCode> selectCity(String proCode) {
        return thfxqMapper.selectCity(proCode);
    }

    @Override
    public List<AreaCode> selectDistrict(String proCode, String areaCode) {
        return thfxqMapper.selectDistrict(proCode, areaCode);
    }

    @Override
    public int deleteOrganEntity(String clientId, String organFlag, String relatedType, String relatedId, String dataStatus) {
        int totalDeleted = 0;
        // 同时删除正式表和临时表的数据，确保数据能被正确删除
        totalDeleted += thfxqMapper.deleteFromRelatInfo(clientId, organFlag, relatedType, relatedId);
        totalDeleted += thfxqMapper.deleteFromRelatInfoTmp(clientId, organFlag, relatedType, relatedId);
        return totalDeleted;
    }

    @Override
    public List<RelatedInfo> selectOrganEntity(String clientId, String organFlag, String relatedName) {
        return thfxqMapper.selectOrganEntity(clientId, organFlag, relatedName);
    }

    @Override
    public FilePreviewVO previewFile(MultipartFile file) {
        return previewFile(file, file.getOriginalFilename());
    }

    @Override
    public FilePreviewVO previewFile(MultipartFile file, String fileName) {

        long startTime = System.currentTimeMillis();

        try {
            if (file == null || file.isEmpty()) {
                throw new RuntimeException("文件不能为空");
            }

            String fileExtension = getFileExtension(fileName);
            if (!SUPPORTED_EXTENSIONS.contains(fileExtension.toLowerCase())) {
                throw new RuntimeException("不支持的文件类型: " + fileExtension);
            }

            // 创建临时目录
            String tempDir = createTempDirectory();
            //随机生成文件名称
            // 1. 获取毫秒级时间戳
            String timestamp = String.valueOf(System.currentTimeMillis());
            // 2. 生成UUID（随机且唯一，去掉横线提升路径简洁性）
            String uuid = UUID.randomUUID().toString().replace("-", "");
            // 3. 拼接唯一目录名：时间戳 + 下划线 + UUID（下划线分隔便于阅读）
            String uniqueFileName = timestamp + "_" + uuid;
            fileName = uniqueFileName + "." + fileExtension.trim();;

            // 保存上传的文件
            String originalFilePath = saveUploadedFile(file, tempDir, fileName);

            // 智能转换为HTML
            String htmlFilePath = convertToHtml(originalFilePath);

            // 生成预览URL
            String previewUrl = generatePreviewUrl(htmlFilePath);

            // 构建返回结果
            FilePreviewVO result = new FilePreviewVO();
            result.setPreviewUrl(previewUrl);
            result.setFileName(fileName);
            result.setFileType(fileExtension);
            result.setFileSize(file.getSize());

            long duration = System.currentTimeMillis() - startTime;

            return result;

        } catch (Exception e) {
            System.err.println("文件预览转换失败: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("文件预览转换失败: " + e.getMessage());
        }
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.lastIndexOf(".") == -1) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1);
    }

    /**
     * 判断是否为轻量级文件（不需要转换）
     */
    private boolean isLightweightFile(String extension) {
        return LIGHTWEIGHT_EXTENSIONS.contains(extension.toLowerCase());
    }

    /**
     * 判断是否为文档文件（需要LibreOffice转换）
     */
    private boolean isDocumentFile(String extension) {
        return DOCUMENT_EXTENSIONS.contains(extension.toLowerCase());
    }

    /**
     * 判断是否为文本文件
     */
    private boolean isTextFile(String extension) {
        return "txt".equalsIgnoreCase(extension);
    }

    /**
     * 判断是否为图片文件
     */
    private boolean isImageFile(String extension) {
        String ext = extension.toLowerCase();
        return Arrays.asList("jpg", "jpeg", "png", "gif", "bmp", "webp").contains(ext);
    }

    /**
     * 创建临时目录
     */
    private String createTempDirectory() throws IOException {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String tempDir = tempPreviewPath + File.separator + timestamp;

        Path path = Paths.get(tempDir);
        Files.createDirectories(path);

        return tempDir;
    }

    /**
     * 保存上传的文件
     */
    private String saveUploadedFile(MultipartFile file, String tempDir, String fileName) throws IOException {
        String filePath = tempDir + File.separator + fileName;
        File destFile = new File(filePath);
        file.transferTo(destFile);
        return filePath;
    }

    /**
     * 智能转换为HTML
     */
    private String convertToHtml(String inputFilePath) {
        try {
            File inputFile = new File(inputFilePath);
            String fileExtension = getFileExtension(inputFile.getName()).toLowerCase();

            // 轻量级文件直接处理，无需LibreOffice转换
            if (isLightweightFile(fileExtension)) {
                return createDirectPreviewHtml(inputFile, fileExtension);
            }

            // 对于PDF文件，使用直接嵌入的方式，而不是LibreOffice转换
            if ("pdf".equals(fileExtension)) {
                return convertPdfToHtml(inputFilePath);
            }

            // 对于文档文件，使用LibreOffice转换
            if (isDocumentFile(fileExtension)) {
                return convertWithLibreOffice(inputFilePath);
            }

            // 不支持的文件类型
            throw new RuntimeException("不支持的文件类型: " + fileExtension);

        } catch (Exception e) {
            System.err.println("文件转换失败: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("文件转换失败: " + e.getMessage());
        }
    }

    /**
     * 直接创建轻量级文件预览HTML
     */
    private String createDirectPreviewHtml(File inputFile, String fileExtension) throws Exception {
        System.out.println("使用直接预览模式: " + inputFile.getName());

        long startTime = System.currentTimeMillis();

        // 创建临时目录
        String timestamp = String.valueOf(System.currentTimeMillis());
        String outputDir = tempPreviewPath + File.separator + "direct_" + timestamp;
        Files.createDirectories(Paths.get(outputDir));

        String fileName = inputFile.getName();
        String htmlFileName = getBaseFileName(fileName) + ".html";
        String htmlFilePath = outputDir + File.separator + htmlFileName;

        String htmlContent;

        if (isTextFile(fileExtension)) {
            // 文本文件直接读取内容
            htmlContent = createTextFileHtml(inputFile);
        } else if (isImageFile(fileExtension)) {
            // 图片文件直接显示
            htmlContent = createImageFileHtml(inputFile, outputDir);
        } else {
            throw new RuntimeException("不支持的轻量级文件类型: " + fileExtension);
        }

        Files.write(Paths.get(htmlFilePath), htmlContent.getBytes("UTF-8"));

        long duration = System.currentTimeMillis() - startTime;
        System.out.println("轻量级文件预览完成，耗时: " + duration + "ms");

        return htmlFilePath;
    }

    /**
     * 创建文本文件预览HTML
     */
    private String createTextFileHtml(File textFile) throws Exception {
        String content = new String(Files.readAllBytes(textFile.toPath()), "UTF-8");

        // 转义HTML特殊字符
        String escapedContent = content.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");

        return "<!DOCTYPE html>\n" + "<html lang=\"zh-CN\">\n" + "<head>\n" + "    <meta charset=\"UTF-8\">\n" + "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" + "    <title>文本预览 - " + textFile.getName() + "</title>\n" + "    <style>\n" + "        body {\n" + "            margin: 0;\n" + "            padding: 20px;\n" + "            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;\n" + "            background-color: #f8f9fa;\n" + "            line-height: 1.6;\n" + "        }\n" + "        .header {\n" + "            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n" + "            color: white;\n" + "            padding: 20px;\n" + "            margin: -20px -20px 20px -20px;\n" + "            box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n" + "        }\n" + "        .filename {\n" + "            font-size: 24px;\n" + "            font-weight: bold;\n" + "            margin-bottom: 5px;\n" + "        }\n" + "        .fileinfo {\n" + "            font-size: 14px;\n" + "            opacity: 0.9;\n" + "        }\n" + "        .content {\n" + "            background: white;\n" + "            padding: 30px;\n" + "            border-radius: 8px;\n" + "            box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n" + "            white-space: pre-wrap;\n" + "            word-wrap: break-word;\n" + "            max-height: 70vh;\n" + "            overflow-y: auto;\n" + "            border: 1px solid #e9ecef;\n" + "        }\n" + "        .stats {\n" + "            margin-top: 20px;\n" + "            padding: 15px;\n" + "            background: #f8f9fa;\n" + "            border-radius: 4px;\n" + "            font-size: 14px;\n" + "            color: #6c757d;\n" + "        }\n" + "    </style>\n" + "</head>\n" + "<body>\n" + "    <div class=\"header\">\n" + "        <div class=\"filename\">📄 " + textFile.getName() + "</div>\n" + "        <div class=\"fileinfo\">文本文件 • " + String.format("%.2f", textFile.length() / 1024.0) + " KB</div>\n" + "    </div>\n" + "    <div class=\"content\">" + escapedContent + "</div>\n" + "    <div class=\"stats\">\n" + "        📊 文件信息：" + textFile.length() + " 字节 | " + content.length() + " 字符 | " + (content.split("\n").length) + " 行\n" + "    </div>\n" + "</body>\n" + "</html>";
    }

    /**
     * 创建图片文件预览HTML
     */
//    private String createImageFileHtml(File imageFile, String outputDir) throws Exception {
//        // 复制图片到预览目录
//        String imageFileName = imageFile.getName();
//        String targetImagePath = outputDir + File.separator + imageFileName;
//        Files.copy(imageFile.toPath(), Paths.get(targetImagePath), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
//        String imageUrl = imageFileName; // 相对路径引用
//
//        return "<!DOCTYPE html>\n" + "<html lang=\"zh-CN\">\n" + "<head>\n" + "    <meta charset=\"UTF-8\">\n" + "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" + "    <title>图片预览 - " + imageFile.getName() + "</title>\n" + "    <style>\n" + "        body {\n" + "            margin: 0;\n" + "            padding: 20px;\n" + "            background-color: #f8f9fa;\n" + "            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n" + "        }\n" + "        .header {\n" + "            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n" + "            color: white;\n" + "            padding: 20px;\n" + "            margin: -20px -20px 20px -20px;\n" + "            box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n" + "        }\n" + "        .filename {\n" + "            font-size: 24px;\n" + "            font-weight: bold;\n" + "            margin-bottom: 5px;\n" + "        }\n" + "        .fileinfo {\n" + "            font-size: 14px;\n" + "            opacity: 0.9;\n" + "        }\n" + "        .image-container {\n" + "            background: white;\n" + "            padding: 20px;\n" + "            border-radius: 8px;\n" + "            box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n" + "            text-align: center;\n" + "            border: 1px solid #e9ecef;\n" + "        }\n" + "        .preview-image {\n" + "            max-width: 100%;\n" + "            max-height: 70vh;\n" + "            border-radius: 4px;\n" + "            box-shadow: 0 4px 20px rgba(0,0,0,0.1);\n" + "            transition: transform 0.3s ease;\n" + "        }\n" + "        .preview-image:hover {\n" + "            transform: scale(1.02);\n" + "        }\n" + "        .stats {\n" + "            margin-top: 20px;\n" + "            padding: 15px;\n" + "            background: #f8f9fa;\n" + "            border-radius: 4px;\n" + "            font-size: 14px;\n" + "            color: #6c757d;\n" + "        }\n" + "        .download-btn {\n" + "            display: inline-block;\n" + "            margin-top: 15px;\n" + "            padding: 10px 20px;\n" + "            background: #007bff;\n" + "            color: white;\n" + "            text-decoration: none;\n" + "            border-radius: 4px;\n" + "            font-size: 14px;\n" + "        }\n" + "        .download-btn:hover {\n" + "            background: #0056b3;\n" + "        }\n" + "    </style>\n" + "</head>\n" + "<body>\n" + "    <div class=\"header\">\n" + "        <div class=\"filename\">🖼️ " + imageFile.getName() + "</div>\n" + "        <div class=\"fileinfo\">图片文件 • " + String.format("%.2f", imageFile.length() / 1024.0) + " KB</div>\n" + "    </div>\n" + "    <div class=\"image-container\">\n" + "        <img src=\"" + imageUrl + "\" class=\"preview-image\" alt=\"" + imageFile.getName() + "\" />\n" + "        <a href=\"" + imageUrl + "\" class=\"download-btn\" download>下载原图</a>\n" + "    </div>\n" + "    <div class=\"stats\">\n" + "        📊 图片信息：" + imageFile.length() + " 字节 | 支持缩放查看\n" + "    </div>\n" + "</body>\n" + "</html>";
//    }
    /**
     * 创建图片文件预览HTML（支持滚轮/按钮缩放、拖拽平移）
     */
    private String createImageFileHtml(File imageFile, String outputDir) throws Exception {
        // 复制图片到预览目录
        String imageFileName = imageFile.getName();
        String targetImagePath = outputDir + File.separator + imageFileName;
        Files.copy(imageFile.toPath(), Paths.get(targetImagePath), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        String imageUrl = imageFileName; // 相对路径引用
        String fileSizeKb = String.format("%.2f", imageFile.length() / 1024.0);

        return "<!DOCTYPE html>\n"
                + "<html lang=\"zh-CN\">\n"
                + "<head>\n"
                + "    <meta charset=\"UTF-8\">\n"
                + "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
                + "    <title>图片预览 - " + imageFileName + "</title>\n"
                + "    <style>\n"
                + "        * { box-sizing: border-box; }\n"
                + "        body {\n"
                + "            margin: 0;\n"
                + "            padding: 20px;\n"
                + "            background-color: #f8f9fa;\n"
                + "            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n"
                + "        }\n"
                + "        .header {\n"
                + "            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n"
                + "            color: white;\n"
                + "            padding: 20px;\n"
                + "            margin: -20px -20px 20px -20px;\n"
                + "            box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n"
                + "        }\n"
                + "        .filename { font-size: 24px; font-weight: bold; margin-bottom: 5px; }\n"
                + "        .fileinfo { font-size: 14px; opacity: 0.9; }\n"
                + "        .toolbar {\n"
                + "            display: flex;\n"
                + "            align-items: center;\n"
                + "            justify-content: center;\n"
                + "            gap: 8px;\n"
                + "            margin-bottom: 12px;\n"
                + "            flex-wrap: wrap;\n"
                + "        }\n"
                + "        .toolbar button, .download-btn {\n"
                + "            padding: 8px 14px;\n"
                + "            border: 1px solid #ced4da;\n"
                + "            background: #fff;\n"
                + "            border-radius: 4px;\n"
                + "            cursor: pointer;\n"
                + "            font-size: 14px;\n"
                + "            color: #333;\n"
                + "            text-decoration: none;\n"
                + "        }\n"
                + "        .toolbar button:hover, .download-btn:hover { background: #e9ecef; }\n"
                + "        .download-btn {\n"
                + "            background: #007bff;\n"
                + "            color: white;\n"
                + "            border-color: #007bff;\n"
                + "        }\n"
                + "        .download-btn:hover { background: #0056b3; color: white; }\n"
                + "        #zoomLabel {\n"
                + "            min-width: 56px;\n"
                + "            text-align: center;\n"
                + "            font-size: 14px;\n"
                + "            color: #495057;\n"
                + "            font-variant-numeric: tabular-nums;\n"
                + "        }\n"
                + "        .viewport {\n"
                + "            background: white;\n"
                + "            border-radius: 8px;\n"
                + "            box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n"
                + "            border: 1px solid #e9ecef;\n"
                + "            height: 70vh;\n"
                + "            overflow: hidden;\n"
                + "            position: relative;\n"
                + "            cursor: grab;\n"
                + "            user-select: none;\n"
                + "            touch-action: none;\n"
                + "        }\n"
                + "        .viewport.dragging { cursor: grabbing; }\n"
                + "        .preview-image {\n"
                + "            position: absolute;\n"
                + "            left: 50%;\n"
                + "            top: 50%;\n"
                + "            max-width: none;\n"
                + "            max-height: none;\n"
                + "            transform-origin: center center;\n"
                + "            pointer-events: none;\n"
                + "            box-shadow: 0 4px 20px rgba(0,0,0,0.1);\n"
                + "        }\n"
                + "        .stats {\n"
                + "            margin-top: 16px;\n"
                + "            padding: 12px 15px;\n"
                + "            background: #f8f9fa;\n"
                + "            border-radius: 4px;\n"
                + "            font-size: 13px;\n"
                + "            color: #6c757d;\n"
                + "        }\n"
                + "    </style>\n"
                + "</head>\n"
                + "<body>\n"
                + "    <div class=\"header\">\n"
                + "        <div class=\"filename\">" + imageFileName + "</div>\n"
                + "        <div class=\"fileinfo\">图片文件 · " + fileSizeKb + " KB</div>\n"
                + "    </div>\n"
                + "    <div class=\"toolbar\">\n"
                + "        <button type=\"button\" id=\"zoomOut\" title=\"缩小\">−</button>\n"
                + "        <span id=\"zoomLabel\">100%</span>\n"
                + "        <button type=\"button\" id=\"zoomIn\" title=\"放大\">+</button>\n"
                + "        <button type=\"button\" id=\"zoomReset\" title=\"重置\">重置</button>\n"
                + "        <a href=\"" + imageUrl + "\" class=\"download-btn\" download>下载原图</a>\n"
                + "    </div>\n"
                + "    <div class=\"viewport\" id=\"viewport\">\n"
                + "        <img src=\"" + imageUrl + "\" class=\"preview-image\" id=\"previewImage\" alt=\"" + imageFileName + "\" draggable=\"false\" />\n"
                + "    </div>\n"
                + "    <div class=\"stats\">图片信息：" + imageFile.length() + " 字节 · 滚轮缩放 · 拖拽平移 · 双击重置</div>\n"
                + "    <script>\n"
                + "    (function () {\n"
                + "        var viewport = document.getElementById('viewport');\n"
                + "        var img = document.getElementById('previewImage');\n"
                + "        var zoomLabel = document.getElementById('zoomLabel');\n"
                + "        var scale = 1, minScale = 0.2, maxScale = 8, step = 0.15;\n"
                + "        var tx = 0, ty = 0;\n"
                + "        var baseW = 0, baseH = 0;\n"
                + "        var dragging = false, lastX = 0, lastY = 0;\n"
                + "\n"
                + "        function fitBase() {\n"
                + "            var vw = viewport.clientWidth;\n"
                + "            var vh = viewport.clientHeight;\n"
                + "            var nw = img.naturalWidth || img.width;\n"
                + "            var nh = img.naturalHeight || img.height;\n"
                + "            if (!nw || !nh) return;\n"
                + "            var fit = Math.min(vw / nw, vh / nh, 1);\n"
                + "            baseW = nw * fit;\n"
                + "            baseH = nh * fit;\n"
                + "            img.style.width = baseW + 'px';\n"
                + "            img.style.height = baseH + 'px';\n"
                + "            applyTransform();\n"
                + "        }\n"
                + "\n"
                + "        function applyTransform() {\n"
                + "            img.style.transform = 'translate(calc(-50% + ' + tx + 'px), calc(-50% + ' + ty + 'px)) scale(' + scale + ')';\n"
                + "            zoomLabel.textContent = Math.round(scale * 100) + '%';\n"
                + "        }\n"
                + "\n"
                + "        function setScale(next, cx, cy) {\n"
                + "            var prev = scale;\n"
                + "            scale = Math.max(minScale, Math.min(maxScale, next));\n"
                + "            if (cx != null && cy != null && prev !== scale) {\n"
                + "                var rect = viewport.getBoundingClientRect();\n"
                + "                var ox = cx - rect.left - rect.width / 2;\n"
                + "                var oy = cy - rect.top - rect.height / 2;\n"
                + "                tx = ox - (ox - tx) * (scale / prev);\n"
                + "                ty = oy - (oy - ty) * (scale / prev);\n"
                + "            }\n"
                + "            if (Math.abs(scale - 1) < 0.001) { scale = 1; tx = 0; ty = 0; }\n"
                + "            applyTransform();\n"
                + "        }\n"
                + "\n"
                + "        function zoomBy(delta, cx, cy) {\n"
                + "            setScale(scale * (1 + delta), cx, cy);\n"
                + "        }\n"
                + "\n"
                + "        function resetZoom() {\n"
                + "            scale = 1; tx = 0; ty = 0;\n"
                + "            applyTransform();\n"
                + "        }\n"
                + "\n"
                + "        img.addEventListener('load', function () { fitBase(); resetZoom(); });\n"
                + "        if (img.complete) { fitBase(); }\n"
                + "        window.addEventListener('resize', function () {\n"
                + "            var s = scale, x = tx, y = ty;\n"
                + "            fitBase();\n"
                + "            scale = s; tx = x; ty = y;\n"
                + "            applyTransform();\n"
                + "        });\n"
                + "\n"
                + "        viewport.addEventListener('wheel', function (e) {\n"
                + "            e.preventDefault();\n"
                + "            zoomBy(e.deltaY < 0 ? step : -step, e.clientX, e.clientY);\n"
                + "        }, { passive: false });\n"
                + "\n"
                + "        viewport.addEventListener('mousedown', function (e) {\n"
                + "            if (e.button !== 0) return;\n"
                + "            dragging = true;\n"
                + "            lastX = e.clientX; lastY = e.clientY;\n"
                + "            viewport.classList.add('dragging');\n"
                + "        });\n"
                + "        window.addEventListener('mousemove', function (e) {\n"
                + "            if (!dragging) return;\n"
                + "            tx += e.clientX - lastX;\n"
                + "            ty += e.clientY - lastY;\n"
                + "            lastX = e.clientX; lastY = e.clientY;\n"
                + "            applyTransform();\n"
                + "        });\n"
                + "        window.addEventListener('mouseup', function () {\n"
                + "            dragging = false;\n"
                + "            viewport.classList.remove('dragging');\n"
                + "        });\n"
                + "\n"
                + "        viewport.addEventListener('dblclick', function () { resetZoom(); });\n"
                + "\n"
                + "        document.getElementById('zoomIn').addEventListener('click', function () {\n"
                + "            var r = viewport.getBoundingClientRect();\n"
                + "            zoomBy(step, r.left + r.width / 2, r.top + r.height / 2);\n"
                + "        });\n"
                + "        document.getElementById('zoomOut').addEventListener('click', function () {\n"
                + "            var r = viewport.getBoundingClientRect();\n"
                + "            zoomBy(-step, r.left + r.width / 2, r.top + r.height / 2);\n"
                + "        });\n"
                + "        document.getElementById('zoomReset').addEventListener('click', resetZoom);\n"
                + "    })();\n"
                + "    </script>\n"
                + "</body>\n"
                + "</html>";
    }
    /**
     * 将PDF文件转换为HTML（通过嵌入方式）
     */
    private String convertPdfToHtml(String inputFilePath) throws Exception {
        System.out.println("使用PDF嵌入方式转换为HTML: " + inputFilePath);

        File inputFile = new File(inputFilePath);

        // 创建临时目录 - 简化目录名生成
        String timestamp = String.valueOf(System.currentTimeMillis());
        String outputDir = tempPreviewPath + File.separator + "pdf_" + timestamp;
        Files.createDirectories(Paths.get(outputDir));

        // 复制PDF文件到临时目录 - 直接使用原文件名
        String pdfFileName = inputFile.getName();
        String tempPdfPath = outputDir + File.separator + pdfFileName;
        Files.copy(Paths.get(inputFilePath), Paths.get(tempPdfPath), java.nio.file.StandardCopyOption.REPLACE_EXISTING);

        // 创建HTML文件，嵌入PDF
        String htmlFileName = getBaseFileName(pdfFileName) + ".html";
        String htmlFilePath = outputDir + File.separator + htmlFileName;

        String htmlContent = createPdfEmbedHtml(pdfFileName);
        Files.write(Paths.get(htmlFilePath), htmlContent.getBytes("UTF-8"));

        System.out.println("PDF嵌入HTML转换完成: " + htmlFilePath);
        return htmlFilePath;
    }

    /**
     * 创建嵌入PDF的HTML内容
     */
    private String createPdfEmbedHtml(String pdfFileName) {
        return "<!DOCTYPE html>\n" + "<html lang=\"zh-CN\">\n" + "<head>\n" + "    <meta charset=\"UTF-8\">\n" + "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" + "    <title>PDF预览 - " + pdfFileName + "</title>\n" + "    <style>\n" + "        body {\n" + "            margin: 0;\n" + "            padding: 0;\n" + "            font-family: Arial, sans-serif;\n" + "            background-color: #f0f0f0;\n" + "        }\n" + "        .header {\n" + "            background-color: #2c3e50;\n" + "            color: white;\n" + "            padding: 15px 20px;\n" + "            text-align: center;\n" + "            box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n" + "        }\n" + "        .pdf-container {\n" + "            width: 100%;\n" + "            height: calc(100vh - 60px);\n" + "            display: flex;\n" + "            justify-content: center;\n" + "            align-items: center;\n" + "            background-color: #ffffff;\n" + "        }\n" + "        .pdf-viewer {\n" + "            width: 100%;\n" + "            height: 100%;\n" + "            border: none;\n" + "        }\n" + "        .fallback {\n" + "            text-align: center;\n" + "            padding: 40px;\n" + "            background-color: #fff;\n" + "            margin: 20px;\n" + "            border-radius: 8px;\n" + "            box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n" + "        }\n" + "        .download-btn {\n" + "            display: inline-block;\n" + "            background-color: #3498db;\n" + "            color: white;\n" + "            padding: 12px 24px;\n" + "            text-decoration: none;\n" + "            border-radius: 4px;\n" + "            margin-top: 20px;\n" + "        }\n" + "        .download-btn:hover {\n" + "            background-color: #2980b9;\n" + "        }\n" + "    </style>\n" + "</head>\n" + "<body>\n" + "    <div class=\"header\">\n" + "        <h1>📄 PDF预览 - " + pdfFileName + "</h1>\n" + "    </div>\n" + "    <div class=\"pdf-container\">\n" + "        <iframe src=\"" + pdfFileName + "\" class=\"pdf-viewer\" title=\"PDF预览\">\n" + "            <div class=\"fallback\">\n" + "                <h2>您的浏览器不支持PDF预览</h2>\n" + "                <p>请下载PDF文件或使用支持PDF预览的浏览器</p>\n" + "                <a href=\"" + pdfFileName + "\" class=\"download-btn\" download>下载PDF文件</a>\n" + "            </div>\n" + "        </iframe>\n" + "    </div>\n" + "</body>\n" + "</html>";
    }

    /**
     * 使用LibreOffice转换非PDF文件
     */
    private String convertWithLibreOffice(String inputFilePath) throws Exception {
        // 1. 基础校验：源文件必须存在且可读
        File inputFile = new File(inputFilePath);
        if (!inputFile.exists()) {
            throw new RuntimeException("源文件不存在: " + inputFilePath);
        }
        if (!inputFile.canRead()) {
            throw new RuntimeException("源文件无读取权限: " + inputFilePath);
        }

        // 优化：只在第一次调用时检查LibreOffice可用性
        if (!libreOfficeChecked) {
            checkLibreOfficeAvailability();
            libreOfficeChecked = true;
        }

        // 优化：使用更安全的临时目录生成（基于系统临时目录，避免权限问题）
        String timestamp = String.valueOf(System.currentTimeMillis());
        Path outputDirPath = Paths.get(tempPreviewPath, "convert_" + timestamp);
        Files.createDirectories(outputDirPath);
        String outputDir = outputDirPath.toAbsolutePath().toString(); // 强制使用绝对路径

        // 复制原文件到临时目录（使用绝对路径，确保跨平台兼容性）
        String originalFileName = inputFile.getName();
        Path originalInputPath = outputDirPath.resolve(originalFileName);
        Files.copy(Paths.get(inputFilePath), originalInputPath, StandardCopyOption.REPLACE_EXISTING);

        // 验证复制后的文件是否存在且可读
        if (!Files.exists(originalInputPath) || !Files.isReadable(originalInputPath)) {
            throw new RuntimeException("临时文件复制失败或不可读: " + originalInputPath);
        }

        // 优化：只在文件名包含特殊字符时才进行清理
        Path actualInputPath = originalInputPath;
        String safeFileName = sanitizeFileName(originalFileName);
        if (!originalFileName.equals(safeFileName)) {
            Path safeInputPath = outputDirPath.resolve(safeFileName);
            Files.copy(originalInputPath, safeInputPath, StandardCopyOption.REPLACE_EXISTING);
            // 验证重命名后的文件
            if (!Files.exists(safeInputPath) || !Files.isReadable(safeInputPath)) {
                throw new RuntimeException("安全文件名复制失败: " + safeInputPath);
            }
            actualInputPath = safeInputPath;
        }

        // 关键修复：统一使用绝对路径，避免相对路径导致的文件找不到问题
        boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
        String normalizedOutputDir = outputDirPath.toAbsolutePath().toString();
        String normalizedInputPath = actualInputPath.toAbsolutePath().toString();

        // Windows系统路径处理（替换/为\）
        if (isWindows) {
            normalizedOutputDir = normalizedOutputDir.replace("/", "\\");
            normalizedInputPath = normalizedInputPath.replace("/", "\\");
        }

        // 根据操作系统选择正确的可执行文件名
        String sofficeExecutable = isWindows ? "soffice.exe" : "soffice";
        String fullSofficePath = libreOfficePath + File.separator + sofficeExecutable;

        // 验证soffice可执行文件存在且有执行权限
        File sofficeFile = new File(fullSofficePath);
        if (!sofficeFile.exists()) {
            throw new RuntimeException("LibreOffice可执行文件不存在: " + fullSofficePath);
        }
        if (!sofficeFile.canExecute()) {
            if (!isWindows) {
                // Linux下尝试赋予执行权限（使用ProcessBuilder避免shell注入）
                ProcessBuilder chmodPb = new ProcessBuilder("chmod", "+x", fullSofficePath);
                chmodPb.redirectErrorStream(true);
                Process chmodProcess = chmodPb.start();
                if (chmodProcess.waitFor(5, TimeUnit.SECONDS) && chmodProcess.exitValue() != 0) {
                    throw new RuntimeException("赋予LibreOffice执行权限失败");
                }
            }
            if (!sofficeFile.canExecute()) {
                throw new RuntimeException("LibreOffice可执行文件无执行权限: " + fullSofficePath);
            }
        }

        // 关键修复：使用绝对路径构建命令，避免相对路径问题
        ProcessBuilder pb = new ProcessBuilder();
        List<String> commandList = new ArrayList<>();
        commandList.add(fullSofficePath);
        // 核心参数（精简且确保兼容性）
        commandList.add("--headless");
        commandList.add("--convert-to");
        commandList.add("html:HTML"); // 明确指定HTML格式（关键修复）
        commandList.add("--outdir");
        commandList.add(normalizedOutputDir);
        commandList.add(normalizedInputPath);
        // 稳定性参数
        commandList.add("--nologo");
        commandList.add("--norestore");
        commandList.add("--nodefault");
        commandList.add("--nolockcheck");
        commandList.add("--nofirststartwizard"); // 新增：避免首次启动向导
        pb.command(commandList);

        // 优化：设置进程环境（确保有足够权限）
        pb.directory(new File(outputDir));
        pb.redirectErrorStream(true);
        // 新增：设置环境变量，避免Locale问题
        pb.environment().put("LC_ALL", "en_US.UTF-8");
        pb.environment().put("LANG", "en_US.UTF-8");

        long startTime = System.currentTimeMillis();
        Process process = pb.start();

        // 超时机制
        boolean finished = process.waitFor(30, TimeUnit.SECONDS);
        if (!finished) {
            process.destroyForcibly();
            throw new RuntimeException("LibreOffice转换超时");
        }

        int exitCode = process.exitValue();
        long duration = System.currentTimeMillis() - startTime;
        System.out.println("LibreOffice转换耗时: " + duration + "ms");

        // 读取进程输出（关键：排查问题）
        String processOutput = "";
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
            processOutput = output.toString();
            System.out.println("LibreOffice执行日志: \n" + processOutput);
        } catch (Exception e) {
            System.err.println("读取LibreOffice日志失败: " + e.getMessage());
        }

        // 检查退出码
        if (exitCode != 0) {
            throw new RuntimeException("LibreOffice转换失败，退出码: " + exitCode +
                    ", 源文件路径: " + normalizedInputPath +
                    ", 执行日志: " + processOutput);
        }

        // 查找生成的HTML文件（关键修复：兼容不同命名规则）
        File outputDirFile = new File(outputDir);
        File[] htmlFiles = outputDirFile.listFiles((dir, name) ->
                name.toLowerCase().endsWith(".html") && !name.startsWith("~")); // 排除临时文件

        if (htmlFiles == null || htmlFiles.length == 0) {
            throw new RuntimeException("HTML文件生成失败: 输出目录=" + outputDir +
                    "，无HTML文件，源文件路径=" + normalizedInputPath +
                    "，LibreOffice日志=" + processOutput);
        }

        // 取第一个HTML文件
        File htmlFile = htmlFiles[0];
        String htmlFilePath = htmlFile.getAbsolutePath();
        System.out.println("找到生成的HTML文件: " + htmlFilePath);

        // 验证文件有效性
        if (htmlFile.length() == 0) {
            throw new RuntimeException("生成的HTML文件为空: " + htmlFilePath);
        }

        // 快速验证HTML内容
        try {
            String htmlContent = new String(Files.readAllBytes(htmlFile.toPath()), StandardCharsets.UTF_8);
            if (htmlContent.trim().isEmpty() || !htmlContent.toLowerCase().contains("<html")) {
                String fileName = inputFile.getName();
                htmlContent = createBasicHtmlStructure(fileName,
                        "文件转换成功，但内容无法正确显示。请下载原文件查看。");
                Files.write(htmlFile.toPath(), htmlContent.getBytes(StandardCharsets.UTF_8));
            }
        } catch (Exception e) {
            String fileName = inputFile.getName();
            String htmlContent = createBasicHtmlStructure(fileName, "文件转换完成。");
            Files.write(htmlFile.toPath(), htmlContent.getBytes(StandardCharsets.UTF_8));
        }

        return htmlFilePath;
    }

    /**
     * 检查LibreOffice是否可用
     */
    private void checkLibreOfficeAvailability() {
        // 根据操作系统选择正确的可执行文件名
        boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
        String sofficeExecutable = isWindows ? "soffice.exe" : "soffice";
        String sofficePath = libreOfficePath + File.separator + sofficeExecutable;
        File sofficeFile = new File(sofficePath);

        if (!sofficeFile.exists()) {
            throw new RuntimeException("LibreOffice未安装或路径配置错误: " + sofficePath);
        }

        System.out.println("LibreOffice可用性检查通过: " + sofficePath);
    }

    /**
     * 清理文件名，移除或替换特殊字符
     */
    private String sanitizeFileName(String fileName) {
        if (fileName == null) {
            return "unknown_file";
        }

        // 优化：只在包含明显特殊字符时才进行处理
        if (fileName.matches(".*[<>:\"/\\\\|?*].*")) {
            String nameWithoutExt = fileName;
            String extension = "";
            int lastDotIndex = fileName.lastIndexOf('.');
            if (lastDotIndex > 0) {
                nameWithoutExt = fileName.substring(0, lastDotIndex);
                extension = fileName.substring(lastDotIndex);
            }

            String sanitized = nameWithoutExt.replaceAll("[<>:\"/\\\\|?*]", "_");
            if (sanitized.trim().isEmpty()) {
                sanitized = "file_" + System.currentTimeMillis();
            }
            return sanitized + extension;
        }

        return fileName;
    }

    /**
     * 获取不带扩展名的文件名
     */
    private String getBaseFileName(String filePath) {
        File file = new File(filePath);
        String name = file.getName();
        int dotIndex = name.lastIndexOf('.');
        return dotIndex == -1 ? name : name.substring(0, dotIndex);
    }

    /**
     * 生成预览URL
     */
    private String generatePreviewUrl(String htmlFilePath) {
        try {
            File htmlFile = new File(htmlFilePath);
            if (!htmlFile.exists()) {
                throw new RuntimeException("HTML文件不存在: " + htmlFilePath);
            }

            String canonicalPath = htmlFile.getCanonicalPath();
            String projectRoot = System.getProperty("user.dir");
            String absTempPath = new File(tempPreviewPath).getCanonicalPath();

            System.out.println("=== generatePreviewUrl 调试信息 ===");
            System.out.println("项目根目录: " + projectRoot);
            System.out.println("临时目录配置值: " + tempPreviewPath);
            System.out.println("临时目录绝对路径: " + absTempPath);
            System.out.println("HTML文件规范路径: " + canonicalPath);

            // 生成相对于项目根目录的路径
            String relativePath;

            if (canonicalPath.startsWith(absTempPath)) {
                // 优先判断：文件在临时目录下，使用相对路径（包含时间戳子目录）
                relativePath = canonicalPath.substring(absTempPath.length()).replace("\\", "/");
                // 预览URL使用 ibcm_file/preview/xxx
                relativePath = "ibcm_file/preview" + relativePath;
                System.out.println("使用临时目录相对路径: " + relativePath);
            } else if (canonicalPath.startsWith(projectRoot)) {
                // 文件在项目根目录下（但不在临时目录），使用相对路径
                relativePath = canonicalPath.substring(projectRoot.length()).replace("\\", "/");
                System.out.println("使用项目根目录相对路径: " + relativePath);
            } else {
                // 其他情况，尝试构造相对路径
                System.err.println("警告：HTML文件不在预期位置，尝试使用文件名");
                String fileName = htmlFile.getName();
                relativePath = "ibcm_file/preview/" + fileName;
                System.out.println("使用备选路径: " + relativePath);
            }

            // 移除开头的斜杠
            if (relativePath.startsWith("/")) {
                relativePath = relativePath.substring(1);
            }

            System.out.println("最终相对路径: " + relativePath);

            // 构建访问URL
            String baseUrl = "http://10.116.131.13:8090";//"http://10.181.135.22:8080";//"http://localhost:" + serverPort;
            if (!contextPath.isEmpty() && !contextPath.equals("/")) {
                baseUrl += contextPath;
            }

            String fullUrl = baseUrl + "/" + relativePath;
            System.out.println("生成的预览URL: " + fullUrl);
            System.out.println("===================================");

            return fullUrl;

        } catch (Exception e) {
            throw new RuntimeException("生成预览URL失败: " + e.getMessage());
        }
    }

    @Override
    public FilePreviewVO previewFileById(String id) {

        long startTime = System.currentTimeMillis();

        try {

            // 检查文件类型
            FileList fileInfo = thfxqMapper.selectFileById(id);
            if (fileInfo == null) {
                throw new RuntimeException("文件不存在: " + id);
            }

            // 1. 获取毫秒级时间戳
            String timestamp = String.valueOf(System.currentTimeMillis());
            // 2. 生成UUID（随机且唯一，去掉横线提升路径简洁性）
            String uuid = UUID.randomUUID().toString().replace("-", "");
            // 3. 拼接唯一目录名：时间戳 + 下划线 + UUID（下划线分隔便于阅读）
            String fileName = timestamp + "_" + uuid ;
            String extension = fileInfo.getExtension();
            if (extension != null && !extension.trim().isEmpty()) {
                fileName += "." + extension.trim();
            }

            String fileExtension = getFileExtension(fileName);
            if (!SUPPORTED_EXTENSIONS.contains(fileExtension.toLowerCase())) {
                throw new RuntimeException("不支持的文件类型: " + fileExtension);
            }

            // 创建临时目录
            String tempDir = createTempDirectory();
            String newTempFilePath = tempDir + File.separator + fileName;

            // 获取文件内容
            String tempFilePath = null;
            try {
                FileDownloadResult downloadResult = downloadFile(id);

                if (downloadResult.getResource() instanceof org.springframework.core.io.ByteArrayResource) {
                    // 处理BLOB数据
                    byte[] fileBytes = ((org.springframework.core.io.ByteArrayResource) downloadResult.getResource()).getByteArray();

                    java.nio.file.Files.write(Paths.get(newTempFilePath), fileBytes);
                } else if (downloadResult.getResource() instanceof org.springframework.core.io.FileSystemResource) {
                    // 处理文件系统数据
                    org.springframework.core.io.FileSystemResource fileResource =
                            (org.springframework.core.io.FileSystemResource) downloadResult.getResource();

                    // 对于FileSystemResource，我们需要获取原始文件的完整路径
                    try {
                        tempFilePath = fileResource.getFile().getAbsolutePath();
                    } catch (Exception e) {
                        System.err.println("获取FileSystemResource文件路径失败: " + e.getMessage());
                        // 备选方案：从数据库重新查询路径
                        FileList diskFileInfo = thfxqMapper.selectFileById(id);
                        if (diskFileInfo != null && diskFileInfo.getFilePath() != null) {
                            tempFilePath = processFilePath(diskFileInfo.getFilePath());
                            System.out.println("备选方案获取文件路径: " + tempFilePath);
                        } else {
                            throw new RuntimeException("无法获取文件系统资源路径");
                        }
                    }
                    // ========== 使用 NIO Files.write 实现文件复制 ==========
                    try {
                        // 2. 读取源文件的字节数组
                        byte[] fileBytes = Files.readAllBytes(Paths.get(tempFilePath));

                        // 3. 确保目标目录存在（Files.write不会自动创建父目录）
                        File targetDir = new File(newTempFilePath).getParentFile();
                        if (!targetDir.exists()) {
                            boolean dirCreated = targetDir.mkdirs();
                            if (!dirCreated) {
                                throw new RuntimeException("创建临时目录失败: " + targetDir.getAbsolutePath());
                            }
                        }

                        // 4. 写入字节数组到新文件（覆盖已存在的文件，实现"复写"）
                        // Files.write 默认会 CREATE + TRUNCATE_EXISTING，即存在则覆盖、不存在则创建
                        Files.write(Paths.get(newTempFilePath), fileBytes);
                        System.out.println("文件复制成功，新文件路径: " + newTempFilePath);


                    } catch (IOException e) {
                        System.err.println("文件复制失败: " + e.getMessage());
                        throw new RuntimeException("使用NIO复制文件失败", e);
                    }

                } else {
                    throw new RuntimeException("不支持的资源类型: " + downloadResult.getResource().getClass().getName());
                }

                System.out.println("最终临时文件路径: " + newTempFilePath);
                System.out.println("文件是否存在检查: " + (newTempFilePath != null && new File(newTempFilePath).exists()));

                if (newTempFilePath == null || !new File(newTempFilePath).exists()) {
                    throw new RuntimeException("无法获取文件内容，newTempFilePath=" + newTempFilePath);
                }

            } catch (Exception e) {
                System.err.println("获取文件内容失败: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("获取文件内容失败: " + e.getMessage());
            }

            // 使用LibreOffice转换为HTML
            String htmlFilePath = convertToHtml(newTempFilePath);

            // 生成预览URL
            String previewUrl = generatePreviewUrl(htmlFilePath);

            // 构建返回结果
            FilePreviewVO result = new FilePreviewVO();
            result.setPreviewUrl(previewUrl);
            result.setFileName(fileName);
            result.setFileType(fileExtension);
            result.setFileSize(new File(newTempFilePath).length());

            long duration = System.currentTimeMillis() - startTime;

            return result;

        } catch (Exception e) {
            System.err.println("根据ID预览转换失败: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("根据ID预览转换失败: " + e.getMessage());
        }

    }

    @Override
    public FilePreviewVO previewFileByInfo(String clientId, String fileTypeNo, String objectId, String fileName) {

        long startTime = System.currentTimeMillis();

        try {
            System.out.println("根据文件信息预览文件: clientId=" + clientId +
                    ", fileTypeNo=" + fileTypeNo + ", objectId=" + objectId + ", fileName=" + fileName);

            // 首先根据文件名查询文件ID
            String fileId = findFileIdByName(clientId, fileTypeNo, objectId, fileName);
            if (fileId == null) {
                throw new RuntimeException("文件不存在: " + fileName);
            }

            // 检查文件类型
            String fileExtension = getFileExtension(fileName);
            if (!SUPPORTED_EXTENSIONS.contains(fileExtension.toLowerCase())) {
                throw new RuntimeException("不支持的文件类型: " + fileExtension);
            }

            // 1. 获取毫秒级时间戳
            String timestamp = String.valueOf(System.currentTimeMillis());
            // 2. 生成UUID（随机且唯一，去掉横线提升路径简洁性）
            String uuid = UUID.randomUUID().toString().replace("-", "");
            // 3. 拼接唯一目录名：时间戳 + 下划线 + UUID（下划线分隔便于阅读）
            fileName = timestamp + "_" + uuid +'.'+fileExtension;

            // 创建临时目录
            String tempDir = createTempDirectory();
            String newTempFilePath = tempDir + File.separator + fileName;

            // 获取文件内容
            String tempFilePath = null;

            try {
                FileDownloadResult downloadResult = downloadFile(fileId);

                if (downloadResult.getResource() instanceof org.springframework.core.io.ByteArrayResource) {
                    // 处理BLOB数据
                    byte[] fileBytes = ((org.springframework.core.io.ByteArrayResource) downloadResult.getResource()).getByteArray();

                    java.nio.file.Files.write(Paths.get(newTempFilePath), fileBytes);
                } else if (downloadResult.getResource() instanceof org.springframework.core.io.FileSystemResource) {
                    // 处理文件系统数据
                    org.springframework.core.io.FileSystemResource fileResource =
                            (org.springframework.core.io.FileSystemResource) downloadResult.getResource();

                    // 对于FileSystemResource，我们需要获取原始文件的完整路径
                    try {
                        tempFilePath = fileResource.getFile().getAbsolutePath();
                    } catch (Exception e) {
                        System.err.println("获取FileSystemResource文件路径失败: " + e.getMessage());
                        // 备选方案：从数据库重新查询路径
                        FileList diskFileInfo = thfxqMapper.selectFileById(fileId);
                        if (diskFileInfo != null && diskFileInfo.getFilePath() != null) {
                            tempFilePath = processFilePath(diskFileInfo.getFilePath());
                            System.out.println("备选方案获取文件路径: " + tempFilePath);
                        } else {
                            throw new RuntimeException("无法获取文件系统资源路径");
                        }
                    }
                    // ========== 使用 NIO Files.write 实现文件复制 ==========
                    try {
                        // 2. 读取源文件的字节数组
                        byte[] fileBytes = Files.readAllBytes(Paths.get(tempFilePath));

                        // 3. 确保目标目录存在（Files.write不会自动创建父目录）
                        File targetDir = new File(newTempFilePath).getParentFile();
                        if (!targetDir.exists()) {
                            boolean dirCreated = targetDir.mkdirs();
                            if (!dirCreated) {
                                throw new RuntimeException("创建临时目录失败: " + targetDir.getAbsolutePath());
                            }
                        }

                        // 4. 写入字节数组到新文件（覆盖已存在的文件，实现"复写"）
                        // Files.write 默认会 CREATE + TRUNCATE_EXISTING，即存在则覆盖、不存在则创建
                        Files.write(Paths.get(newTempFilePath), fileBytes);
                        System.out.println("文件复制成功，新文件路径: " + newTempFilePath);


                    } catch (IOException e) {
                        System.err.println("文件复制失败: " + e.getMessage());
                        throw new RuntimeException("使用NIO复制文件失败", e);
                    }

                } else {
                    throw new RuntimeException("不支持的资源类型: " + downloadResult.getResource().getClass().getName());
                }

                System.out.println("最终临时文件路径: " + newTempFilePath);
                System.out.println("文件是否存在检查: " + (newTempFilePath != null && new File(newTempFilePath).exists()));

                if (newTempFilePath == null || !new File(newTempFilePath).exists()) {
                    throw new RuntimeException("无法获取文件内容，newTempFilePath=" + newTempFilePath);
                }

            } catch (Exception e) {
                System.err.println("获取文件内容失败: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("获取文件内容失败: " + e.getMessage());
            }

            // 使用LibreOffice转换为HTML
            String htmlFilePath = convertToHtml(newTempFilePath);

            // 生成预览URL
            String previewUrl = generatePreviewUrl(htmlFilePath);

            // 构建返回结果
            FilePreviewVO result = new FilePreviewVO();
            result.setPreviewUrl(previewUrl);
            result.setFileName(fileName);
            result.setFileType(fileExtension);
            result.setFileSize(new File(newTempFilePath).length());

            long duration = System.currentTimeMillis() - startTime;

            return result;

        } catch (Exception e) {
            System.err.println("根据文件信息预览转换失败: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("根据文件信息预览转换失败: " + e.getMessage());
        }
    }

    /**
     * 根据文件名查找文件ID
     */
    private String findFileIdByName(String clientId, String fileTypeNo, String objectId, String fileName) {
        try {
            List<FileList> fileList = thfxqMapper.selectFileList(clientId, fileTypeNo, objectId);
            for (FileList fileInfo : fileList) {
                String fullFileName = fileInfo.getName() + "." + fileInfo.getExtension();
                if (fileName.equals(fullFileName) || fileName.equals(fileInfo.getName())) {
                    return fileInfo.getId();
                }
            }
            return null;
        } catch (Exception e) {
            System.err.println("查找文件ID失败: " + fileName);
            e.printStackTrace();
            return null;
        }
    }

    /**
     * 根据文件信息查找实际文件路径
     *
     * @param clientId   客户ID
     * @param fileTypeNo 文件类型编号
     * @param objectId   对象ID
     * @param fileName   文件名
     * @return 文件路径
     */
    private String findFileByInfo(String clientId, String fileTypeNo, String objectId, String fileName) {
        try {
            // 这里需要根据实际的文件存储逻辑来实现
            // 通常有以下几种方式：
            // 1. 从数据库查询文件路径
            // 2. 根据命名规则构造文件路径
            // 3. 调用文件服务接口获取文件

            // 示例实现：假设文件存储在特定目录结构中
            String baseFilePath = "/app/files/" + clientId + "/" + fileTypeNo;
            if (objectId != null && !objectId.isEmpty()) {
                baseFilePath += "/" + objectId;
            }

            String fullFilePath = baseFilePath + "/" + fileName;

            // 检查文件是否存在
            File file = new File(fullFilePath);
            if (file.exists()) {
                System.out.println("找到文件: " + fullFilePath);
                return fullFilePath;
            }

            // 如果直接路径不存在，可能需要通过数据库查询
            // 这里可以调用 mapper 查询文件的实际存储路径
            List<FileList> fileList = thfxqMapper.selectFileList(clientId, fileTypeNo, objectId);
            for (FileList fileInfo : fileList) {
                String fullFileName = fileInfo.getName() + "." + fileInfo.getExtension();
                if (fileName.equals(fullFileName) || fileName.equals(fileInfo.getName())) {
                    // 假设文件信息中包含完整路径
                    String filePath = fileInfo.getFilePath();
                    if (filePath != null && new File(filePath).exists()) {
                        return filePath;
                    }
                }
            }

            System.out.println("未找到文件: " + fileName);
            return null;

        } catch (Exception e) {
            System.err.println("查找文件失败: " + fileName);
            e.printStackTrace();
            return null;
        }
    }

    @Override
    public FileDownloadResult downloadFile(String id) {
        try {
            // 检查文件内容表中是否存在记录
            int count = thfxqMapper.countFileContent(id);

            if (count == 0) {
                // 历史数据：文件存储在服务器磁盘上
                return downloadFileFromDisk(id);
            } else {
                // 新数据：文件存储在数据库BLOB字段中
                return downloadFileFromDatabase(id);
            }

        } catch (Exception e) {
            throw new RuntimeException("文件下载失败: " + e.getMessage());
        }
    }

    /**
     * 从磁盘下载文件
     * 支持历史数据（Windows路径）和新数据（Linux路径）
     */
    private FileDownloadResult downloadFileFromDisk(String id) throws Exception {
        System.out.println("开始从磁盘下载文件，ID: " + id);

        // 查询文件基本信息
        FileList fileInfo = thfxqMapper.selectFileById(id);
        if (fileInfo == null) {
            throw new RuntimeException("文件不存在，ID: " + id);
        }

        String filePath = fileInfo.getFilePath();
        if (filePath == null || filePath.isEmpty()) {
            throw new RuntimeException("文件路径为空，ID: " + id);
        }

        System.out.println("数据库中的原始路径: " + filePath);
        System.out.println("文件名: " + fileInfo.getName());
        System.out.println("文件扩展名: " + fileInfo.getExtension());

        // 构建文件名
        String fileName = buildFileName(fileInfo);

        // 处理文件路径
        String fullFilePath = convertFilePath(filePath, fileName);

        File file = new File(fullFilePath);
        if (!file.exists()) {
            log.error("文件不存在: {}", fullFilePath);
            // 尝试使用原始路径
            file = new File(filePath);
        }

        if (!file.exists()) {
            throw new RuntimeException("文件不存在: " + fullFilePath);
        }

        String contentType = getContentType(fileName);
        Resource resource = new FileSystemResource(file);

        return new FileDownloadResult(resource, fileName, contentType, file.length());
    }

    /**
     * 构建完整文件名
     */
    private String buildFileName(FileList fileInfo) {
        String name = fileInfo.getName();
        String extension = fileInfo.getExtension();

        if (name != null && !name.trim().isEmpty()) {
            if (extension != null && !extension.trim().isEmpty()) {
                return name.trim() + "." + extension.trim();
            }
            return name.trim();
        }
        return "download_" + fileInfo.getId();
    }

    /**
     * 转换文件路径
     * 历史数据（Windows路径 D:/thfxq/40194/xxx.pdf）转换为麒麟服务器路径（/data/thfxqfiles/40194/xxx.pdf）
     * 新数据（已经是 /data/thfxqfiles/xxx）直接使用
     */
    private String convertFilePath(String originalPath, String fileName) {
        if (originalPath == null || originalPath.isEmpty()) {
            return originalPath;
        }

        // 判断是否是Windows路径（历史数据）
        if (originalPath.matches("^[A-Za-z]:[/\\\\].*")) {
            // 历史数据：Windows路径，需要转换为麒麟服务器路径
            // D:/thfxq/40194/客户基本信息表-武汉城建0926.pdf -> /data/thfxqfiles/40194/客户基本信息表-武汉城建0926.pdf
            // 或 D:\thfxq\40194\xxx.pdf -> /data/thfxqfiles/40194/xxx.pdf

            // 提取clientId之后的路径部分
            // 格式: D:/thfxq/{clientId}/{fileName}
            String normalizedPath = originalPath.replace("\\", "/");

            // 查找 /thfxq/ 之后的部分
            int thfxqIndex = normalizedPath.toLowerCase().indexOf("/thfxq/");
            if (thfxqIndex != -1) {
                // 提取 /{clientId}/{fileName} 部分
                String relativePath = normalizedPath.substring(thfxqIndex + "/thfxq".length());
                String linuxPath = "/data/thfxqfiles" + relativePath;
                return linuxPath;
            }
        }

        // 判断是否已经是新格式的Linux路径
        if (originalPath.startsWith("/data/thfxqfiles/")) {
            // 新数据：直接使用
            // 判断是目录路径还是完整文件路径
            if (originalPath.endsWith("/")) {
                // 目录路径，需要拼接文件名
                return originalPath + fileName;
            } else {
                // 可能是完整文件路径，检查是否是目录
                File pathFile = new File(originalPath);
                if (pathFile.isDirectory()) {
                    return originalPath + "/" + fileName;
                }
                return originalPath;
            }
        }

        // 其他情况，尝试使用原始路径
        log.warn("未识别的路径格式: {}", originalPath);
        return originalPath;
    }

    /**
     * 从数据库下载新文件
     */
    private FileDownloadResult downloadFileFromDatabase(String id) throws Exception {
        // 查询文件基本信息
        FileList fileInfo = thfxqMapper.selectFileById(id);
        if (fileInfo == null) {
            throw new RuntimeException("文件不存在，ID: " + id);
        }

        // 使用原生JDBC查询BLOB，避免MyBatis映射问题
        java.sql.Connection connection = null;
        java.sql.PreparedStatement pstmt = null;
        java.sql.ResultSet rs = null;
        Blob blob = null;

        try {
            // 获取数据源连接
            javax.sql.DataSource dataSource = (javax.sql.DataSource) applicationContext.getBean("dataSource");
            connection = dataSource.getConnection();

            // 使用原生SQL查询BLOB
            String sql = "SELECT CONTENT FROM thjs.t_th_client_file_content WHERE ID = ?";
            pstmt = connection.prepareStatement(sql);
            pstmt.setString(1, id);
            rs = pstmt.executeQuery();

            if (rs.next()) {
                blob = rs.getBlob("CONTENT");
                if (blob == null) {
                    throw new RuntimeException("文件内容BLOB为null，ID: " + id);
                }
            } else {
                throw new RuntimeException("未找到文件内容记录，ID: " + id);
            }

        } catch (Exception e) {
            throw new RuntimeException("原生SQL查询BLOB失败，ID: " + id, e);
        } finally {
            // 关闭资源
            try {
                if (rs != null) rs.close();
            } catch (Exception e) {
            }
            try {
                if (pstmt != null) pstmt.close();
            } catch (Exception e) {
            }
            try {
                if (connection != null) connection.close();
            } catch (Exception e) {
            }
        }

        // 转换BLOB为字节数组
        byte[] fileBytes;
        try {
            fileBytes = blob.getBytes(1, (int) blob.length());
        } catch (Exception e) {
            System.err.println("读取BLOB内容失败，ID: " + id);
            e.printStackTrace();
            throw new RuntimeException("读取文件内容失败，ID: " + id, e);
        }

        // 安全处理文件名
        String name = fileInfo.getName();
        String extension = fileInfo.getExtension();

        String fileName;
        if (name != null && !name.trim().isEmpty()) {
            if (extension != null && !extension.trim().isEmpty()) {
                fileName = name.trim() + "." + extension.trim();
            } else {
                fileName = name.trim();
            }
        } else {
            fileName = "download_" + id;
            if (extension != null && !extension.trim().isEmpty()) {
                fileName += "." + extension.trim();
            }
        }

        String contentType = getContentType(fileName);
        Resource resource = new ByteArrayResource(fileBytes);

        return new FileDownloadResult(resource, fileName, contentType, fileBytes.length);
    }

    /**
     * 处理文件路径
     * 支持从Windows路径迁移到Linux路径的转换
     */
    private String processFilePath(String originalPath) {
        // 清理路径：移除前后空白字符和制表符
        String cleanedPath = originalPath.trim();

        System.out.println("原始路径: " + originalPath);
        System.out.println("清理后路径: " + cleanedPath);

        // 判断操作系统类型
        boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
        System.out.println("操作系统类型: " + (isWindows ? "Windows" : "Linux"));

        String normalizedPath;

        if (isWindows) {
            // Windows系统：保持原有逻辑
            // 处理路径分隔符，将Unix风格的路径转换为Windows路径
            normalizedPath = cleanedPath.replace("/", "\\");
        } else {
            // Linux系统（麒麟操作系统）：需要将Windows路径映射到Linux路径
            // 识别旧的Windows路径格式：D:/thfxq/...
            if (cleanedPath.matches("(?i)^D:/thfxq/.*") || cleanedPath.matches("(?i)^D:\\\\thfxq\\\\.*")) {
                // 提取客户号及后续路径
                // 例如：D:/thfxq/1609/2-1 营业执照.pdf
                // 提取：1609/2-1 营业执照.pdf
                String relativePath = cleanedPath.replaceFirst("(?i)^D:/thfxq/", "").replaceFirst("(?i)^D:\\\\thfxq\\\\", "").replace("\\", "/");

                // 构造新的Linux路径：/data/thfxqfiles/{relativePath}
                normalizedPath = "/data/thfxqfiles/" + relativePath;
                System.out.println("路径映射: Windows路径 -> Linux路径");
                System.out.println("映射后路径: " + normalizedPath);
            } else {
                // 不是旧的Windows路径格式，直接使用（可能是相对路径或其他格式）
                // 将所有反斜杠转换为正斜杠（Linux标准）
                normalizedPath = cleanedPath.replace("\\", "/");

                // 如果是相对路径，添加项目根目录（如果需要的话）
                if (!normalizedPath.startsWith("/")) {
                    String fullPath = System.getProperty("user.dir") + "/" + normalizedPath;
                    System.out.println("相对路径处理，完整路径: " + fullPath);
                    normalizedPath = fullPath;
                }
            }
        }

        System.out.println("标准化路径: " + normalizedPath);

        // 检查文件是否存在
        File file = new File(normalizedPath);
        System.out.println("文件是否存在: " + file.exists());

        if (file.exists()) {
            return normalizedPath;
        }

        // 如果文件不存在，且是Linux系统，尝试其他可能的路径变体
        if (!isWindows) {
            // 尝试保留原路径中的反斜杠（虽然不应该在Linux中出现，但为了兼容性）
            String altPath = normalizedPath.replace("/", "\\");
            File altFile = new File(altPath);
            if (altFile.exists()) {
                System.out.println("使用替代路径（保留反斜杠）: " + altPath);
                return altPath;
            }
        }

        // 如果文件仍然不存在，返回标准化路径（让调用者处理错误）
        System.out.println("最终返回路径: " + normalizedPath);
        return normalizedPath;
    }

    /**
     * 创建基本的HTML结构
     */
    private String createBasicHtmlStructure(String fileName, String message) {
        return "<!DOCTYPE html>\n" + "<html lang=\"zh-CN\">\n" + "<head>\n" + "    <meta charset=\"UTF-8\">\n" + "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" + "    <title>文件预览 - " + fileName + "</title>\n" + "    <style>\n" + "        body {\n" + "            font-family: Arial, sans-serif;\n" + "            margin: 0;\n" + "            padding: 20px;\n" + "            background-color: #f5f5f5;\n" + "        }\n" + "        .container {\n" + "            max-width: 800px;\n" + "            margin: 0 auto;\n" + "            background-color: white;\n" + "            padding: 30px;\n" + "            border-radius: 8px;\n" + "            box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n" + "        }\n" + "        .header {\n" + "            text-align: center;\n" + "            margin-bottom: 30px;\n" + "            border-bottom: 2px solid #e0e0e0;\n" + "            padding-bottom: 20px;\n" + "        }\n" + "        .filename {\n" + "            font-size: 24px;\n" + "            font-weight: bold;\n" + "            color: #333;\n" + "            margin-bottom: 10px;\n" + "        }\n" + "        .message {\n" + "            font-size: 16px;\n" + "            color: #666;\n" + "            text-align: center;\n" + "            margin: 20px 0;\n" + "        }\n" + "        .info {\n" + "            background-color: #f8f9fa;\n" + "            padding: 15px;\n" + "            border-left: 4px solid #007bff;\n" + "            margin: 20px 0;\n" + "        }\n" + "    </style>\n" + "</head>\n" + "<body>\n" + "    <div class=\"container\">\n" + "        <div class=\"header\">\n" + "            <div class=\"filename\">📄 " + fileName + "</div>\n" + "        </div>\n" + "        <div class=\"message\">\n" + "            " + message + "\n" + "        </div>\n" + "        <div class=\"info\">\n" + "            <strong>说明：</strong>文件转换已完成，但可能由于以下原因导致内容无法正确显示：<br>\n" + "            • 原文件包含复杂的格式或图表<br>\n" + "            • LibreOffice转换过程中遇到兼容性问题<br>\n" + "            • 建议下载原文件进行查看\n" + "        </div>\n" + "    </div>\n" + "</body>\n" + "</html>";
    }

    /**
     * 根据文件名获取Content-Type
     */
    private String getContentType(String fileName) {
        if (fileName == null) {
            return "application/octet-stream";
        }

        String extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        switch (extension) {
            case "pdf":
                return "application/pdf";
            case "doc":
                return "application/msword";
            case "docx":
                return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "xls":
                return "application/vnd.ms-excel";
            case "xlsx":
                return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "ppt":
                return "application/vnd.ms-powerpoint";
            case "pptx":
                return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            case "txt":
                return "text/plain";
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "gif":
                return "image/gif";
            case "zip":
                return "application/zip";
            case "rar":
                return "application/x-rar-compressed";
            default:
                return "application/octet-stream";
        }
    }
    /**
     * 邮件发送
     *
     * @return
     */
    public void mailScheduled() throws Exception {
//        List<TbHgkhAssessorConf> list = tbHgkhAssessorConfMapper.selectList(new QueryWrapper<>());
        try {
            String txServer = "10.181.114.82:8002";
            String sysType = "n42uNK3xg1+hXrhsgyTxBKNIXKMXvHWok+bxS/XHb9nIK8l+wQNBL8UMaVCL7i3A3BEj62P0+OEb2Bq6VdHVHRb/8949rODwr9wUk2+/5qxi0hKvxvOeCpGz4LQxmNUlGRHHiZrIUCwYkpxeq4k06w+Ms3nPdduLzgnoVftKy+o=";
            String token = null;
            LambdaQueryWrapper<TbFxqMail> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(TbFxqMail::getSendMark, "0");
            List<TbFxqMail> tbFxqMails = fxqMailMapper.selectList(queryWrapper);
            if (CollectionUtil.isNotEmpty(tbFxqMails)) {
                String clientId = "aab9db9a7946ead1";
                String clientSecret = "c83f19ed34f74ec3b3749e5f5c728d8a";
                String authUrl = String.format("http://%s/oauth/token", txServer);
                MultiValueMap<String, String> body1 = new LinkedMultiValueMap<>();
                body1.add("client_id", clientId);
                body1.add("client_secret", clientSecret);
                body1.add("grant_type", "client_credentials");
                body1.add("scope", "read");
                String resTokenString = restTemplate.postForObject(authUrl, body1, String.class);
                JSONObject resToken = JSONObject.parseObject(resTokenString);
                assert resToken != null;
                token = resToken.getString("access_token");
            }

            for (TbFxqMail m : tbFxqMails) {
                JSONArray userList = new JSONArray();
                String receiver = m.getReceiveUser();
                String copper = m.getCcUser();
                String[] rs;
                if (receiver.contains(";")) {
                    rs = receiver.split(";");
                } else if (receiver.contains(",")) {
                    rs = receiver.split(",");
                } else {
                    rs = receiver.split(",");
                }
                for (String r : rs) {
                    JSONObject u = new JSONObject();
                    u.put("custId", r);
                    u.put("custType", -1);
                    u.put("mobile", null);
                    u.put("email", r);
                    u.put("ext1", "to");
                    userList.add(u);
                }

                if (!StringUtils.isEmpty(copper)) {
                    String[] ccs;
                    if (copper.contains(";")) {
                        ccs = copper.split(";");
                    } else if (copper.contains(",")) {
                        ccs = copper.split(",");
                    } else {
                        ccs = copper.split(",");
                    }
                    for (String cc : ccs) {
                        JSONObject u = new JSONObject();
                        u.put("custId", cc);
                        u.put("custType", -1);
                        u.put("mobile", null);
                        u.put("email", cc);
                        u.put("ext1", "cc");
                        userList.add(u);
                    }
                }

                JSONObject params = new JSONObject();
                params.put("subject", m.getMailTitle());
                params.put("body", m.getMailContent());
                params.put("mailFrom", m.getSendUser());
                params.put("bodyFormat", "HTML");
                String msgBody = params.toString();
                String userInfos = userList.toString();

                String emailUrl = String.format("http://%s/open_api/sendMsg/sendNew?access_token=%s", txServer, token);
                MultiValueMap<String, Object> map = new LinkedMultiValueMap<>();
                map.add("msgBody", msgBody);
                map.add("sendType", 0);
                map.add("sysType", sysType);
                map.add("userInfos", userInfos);

                String postRes = restTemplate.postForObject(emailUrl, map, String.class);
                JSONObject jsonObject = JSON.parseObject(postRes);

                String code = jsonObject.getString("code");
                m.setRecvMsg(postRes);
                if ("0".equalsIgnoreCase(code)) {
                    m.setSendMark("1");
                    m.setMailDate(new Date());
                } else {
                    m.setSendMark("2");
                }
                fxqMailMapper.updateById(m);
            }

        } catch (Exception e) {
            logger.error("组长填报邮件发送失败", e);
            throw new RuntimeException(e);
        }

    }

    @Override
    public void submitClientIdExpiryFlow() {
        String raiseCode = "fxq_khsh";
        int limit = 50;
        List<ClientFlowSubmitVO> records = tbFlowInstMapper.selectUnsentByIdExpiry(raiseCode, limit);
        if (CollectionUtil.isEmpty(records)) {
            logger.info("[证件过期流程下发] 无待发送记录");
            return;
        }
        logger.info("[证件过期流程下发] 查询到 {} 条待发送记录", records.size());

        int successCount = 0;
        int failCount = 0;
        for (ClientFlowSubmitVO vo : records) {
            try {
                boolean ok = submitClientIdExpiryFlow(vo);
                if (ok) {
                    tbFlowInstMapper.updateSendStatus(vo.getFlowId(), "1");
                    successCount++;
                } else {
                    tbFlowInstMapper.updateErrorAndStatus(vo.getFlowId(), "接口返回失败", "2");
                    failCount++;
                }
            } catch (Exception e) {
                logger.error("[证件过期流程下发] 发送异常 flowId={}, clientId={}", vo.getFlowId(), vo.getBizKey(), e);
                tbFlowInstMapper.updateErrorAndStatus(vo.getFlowId(),
                        e.getMessage() != null && e.getMessage().length() > 500
                                ? e.getMessage().substring(0, 500) : e.getMessage(), "2");
                failCount++;
            }
            try {
                Thread.sleep(100L);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
        }
        logger.info("[证件过期流程下发] 执行完毕，成功={}, 失败={}", successCount, failCount);
    }

    private boolean submitClientIdExpiryFlow(ClientFlowSubmitVO vo) {
        String clientName = vo.getClientName() == null ? "" : vo.getClientName();
        String todoTitle = clientName + "证件到期提醒";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("sysGuid", "IBCM");
        requestBody.put("flowCode", "IBCM001");
        requestBody.put("flowVer", "2");
        requestBody.put("nodeCode", "draft");
        requestBody.put("applyTable", "T_TH_CLIENT_FLOW");
        requestBody.put("todoTitle", todoTitle);
        requestBody.put("templateName", todoTitle);
        requestBody.put("candidates", "7000");

        JSONObject formJson = new JSONObject();
        formJson.put("CLIENT_ID", vo.getClientId());
        formJson.put("CLIENT_NAME", vo.getClientName());
        formJson.put("ORGAN_FLAG", vo.getOrganFlag());
        formJson.put("CLIENT_BELONG", vo.getClientBelong());
        formJson.put("CLIENT_STATUS", vo.getClientStatus());
        requestBody.put("formData", formJson.toJSONString());

        String url = "http://10.106.2.92:8094/auto/submit";
        String requestBodyJson = JSON.toJSONString(requestBody);
        logger.info("[证件过期流程下发] 请求 flowId={}, clientId={}, body={}", vo.getFlowId(), vo.getBizKey(), requestBodyJson);

        HttpResponse response = HttpRequest.post(url)
                .header("Content-Type", "application/json")
                .header("x-flow-systemId", "IBCM")
                .header("x-userId", clientIdExpiryUserId)
                .header("x-userName", clientIdExpiryUserName)
                .body(requestBodyJson)
                .timeout(10000)
                .execute();

        if (!response.isOk()) {
            logger.error("[证件过期流程下发] HTTP错误 flowId={}, status={}, body={}", vo.getFlowId(), response.getStatus(), response.body());
            return false;
        }
        String responseBody = response.body();
        logger.info("[证件过期流程下发] 响应 flowId={}, body={}", vo.getFlowId(), responseBody);
        JSONObject json = JSON.parseObject(responseBody);
        if (json == null) {
            logger.error("[证件过期流程下发] 响应解析为空 flowId={}", vo.getFlowId());
            return false;
        }
        Integer code = json.getInteger("code");
        return code != null && code == 0;
    }

    @Override
    public void updateClient(ClientInfo clientInfo) {
        thfxqMapper.updateClient(clientInfo);
    }

    @Override
    public int saveRelatedInfo(List<RelatedInfo> relatedInfoList) {
        int totalAffected = 0;
        for (RelatedInfo relatedInfo : relatedInfoList) {
            totalAffected += thfxqMapper.insertRelatedInfoTmp(relatedInfo);
        }
        return totalAffected;
    }

    @Override
    public int saveOrganEntity(List<RelatedInfo> organEntityList) {
        int totalAffected = 0;
        for (RelatedInfo organEntity : organEntityList) {
            totalAffected += thfxqMapper.insertRelatedInfoTmp(organEntity);
        }
        return totalAffected;
    }

    @Override
    public int updateOrganEntity(String clientId, String relatedName, List<RelatedInfo> organEntityList, String createUser) {
        // 1. 删除同一关联人信息（正式表和临时表）
        thfxqMapper.deleteRelatedInfoByName(clientId, relatedName);
        thfxqMapper.deleteRelatedInfoTmpByName(clientId, relatedName);

        // 2. 重新往临时表插入
        int totalAffected = 0;
        for (RelatedInfo organEntity : organEntityList) {
            organEntity.setCreateUser(createUser);
            totalAffected += thfxqMapper.insertRelatedInfoTmp(organEntity);
        }
        return totalAffected;
    }

    @Value("${file.thfxq.save.path:/data/thfxqfiles/}")
    private String thfxqFilePath;

    @Override
    public String uploadFile(String clientId, String fileTypeNo, MultipartFile file, String objectId, String createUser) {
        try {
            // 生成文件ID
            String id = java.util.UUID.randomUUID().toString().replace("-", "");

            // 获取文件名和扩展名
            String originalFileName = file.getOriginalFilename();
            String fileName = originalFileName.substring(0, originalFileName.lastIndexOf("."));
            String extension = originalFileName.substring(originalFileName.lastIndexOf(".") + 1);

            // 获取文件大小
            double fileSize = file.getSize();

            // 构建文件存储目录: /data/thfxqfiles/clientId/
            String basePath = thfxqFilePath.endsWith("/") ? thfxqFilePath : thfxqFilePath + "/";
            String dirPath = basePath + clientId + "/";

            // 创建目录（如果不存在）
            java.io.File dir = new java.io.File(dirPath);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            // 完整文件路径
            String fullFilePath = dirPath + originalFileName;
            java.io.File targetFile = new java.io.File(fullFilePath);

            // 将文件保存到磁盘
            file.transferTo(targetFile);

            // 插入文件信息到数据库（file_path字段记录完整文件路径，包含文件名和扩展名）
            thfxqMapper.insertFileInfo(clientId, fileTypeNo, id, fileName, fileSize, extension, createUser, objectId, fullFilePath);

            return id;

        } catch (Exception e) {
            log.error("文件上传失败", e);
            throw new RuntimeException("文件上传失败: " + e.getMessage(), e);
        }
    }

    @Override
    public int updateFileDir(String id, String fileTypeNo) {
        return thfxqMapper.updateFileDir(id, fileTypeNo);
    }

    @Override
    public int deleteFile(String filePkId) {
        int result = 0;
        // 先删除文件信息
        result += thfxqMapper.deleteFile(filePkId);
        // 再删除文件内容
        result += thfxqMapper.deleteFileContent(filePkId);
        return result;
    }

    @Override
    public int saveApprList(String clientId, String auditId, String remark, String createUser) {
        return thfxqMapper.saveApprList(clientId, auditId, remark, createUser);
    }

    @Override
    public int saveApprDetails(ApprDetailVO apprDetailVO) {
        String createUser = apprDetailVO.getCreateUser();
        if (createUser == null) {
            createUser = "admin";
        }
        List<ApprDetail> batchList = new java.util.ArrayList<>();
        for (ApprDetailVO.ApprDetailItem item : apprDetailVO.getBatchList()) {
            ApprDetail apprDetail = new ApprDetail();
            apprDetail.setClientId(item.getClientId());
            apprDetail.setAuditId(item.getAuditId());
            apprDetail.setAuditSeq(item.getAuditSeq());
            apprDetail.setAuditDesc(item.getAuditDesc());
            apprDetail.setDisposeDesc(item.getDisposeDesc());
            batchList.add(apprDetail);
        }
        return thfxqMapper.saveApprDetails(batchList, createUser);
    }

    @Override
    public void updateClientStatus(UpdateClientStatusRequest request) {
        thfxqMapper.updateClientStatus(request);
    }


    @Override
    public List<WbUser> selectMaintainer(String clientId,String userId) {
        return thfxqMapper.selectMaintainer(clientId,userId);
    }

    @Override
    public String selectContent(String piid) {
        return thfxqMapper.selectContent(piid);
    }

    @Override
    public List<TbProjlistCheckResult> selectSelfCheck(String projId, String piid, String checkBatchId) {
        return thfxqMapper.selectSelfCheck(projId, piid, checkBatchId);
    }

    @Override
    public List<ProjInfo> selectProjInfo(String projId, String piid, String batchId, String pkId) {
        List<ProjInfo> list = thfxqMapper.selectProjInfo(projId, piid, batchId);
        if (list != null && !list.isEmpty()) {
            List<InoutCommentFile> fileList = thfxqMapper.selectInoutCommentFileList(projId,pkId,piid);
            for (ProjInfo p : list) {
                p.setFileList(fileList);
            }
        }
        return list;
    }

    @Override
    public List<TProjSelfcheckFile> selectSelfCheckFile(String checkBatchId) {
        return thfxqMapper.selectSelfCheckFile(checkBatchId);
    }

    @Override
    public FileDownloadResult downloadSelfCheckFile(String id) {
        log.info("开始查询清单自查附件: id=[{}], length={}", id, id == null ? 0 : id.length());

        TProjSelfcheckFile fileInfo = thfxqMapper.selectSelfCheckFileById(id);
        if (fileInfo == null) {
            log.error("清单自查附件不存在: id={}", id);
            throw new RuntimeException("附件不存在，ID: " + id);
        }

        String filePath = fileInfo.getFilePath();
        log.info("查询到附件信息: id={}, dbId={}, name={}, dbExtension={}, filePath={}",
                id, fileInfo.getId(), fileInfo.getName(), fileInfo.getExtension(), filePath);

        if (filePath == null || filePath.isEmpty()) {
            log.error("附件路径为空: id={}", id);
            throw new RuntimeException("附件路径为空，ID: " + id);
        }

        File file = new File(filePath);
        log.info("检查文件是否存在: filePath={}, exists={}, canRead={}, parent={}",
                filePath, file.exists(), file.canRead(), file.getParent());

        if (!file.exists()) {
            log.error("附件在服务器上不存在: id={}, filePath={}", id, filePath);
            throw new RuntimeException("附件在服务器上不存在: " + filePath);
        }

        String realFileLeafName = file.getName();
        String realExtension = "";
        int dotIdx = realFileLeafName.lastIndexOf('.');
        if (dotIdx > 0 && dotIdx < realFileLeafName.length() - 1) {
            realExtension = realFileLeafName.substring(dotIdx + 1).toLowerCase();
        }
        log.info("物理文件真实信息: realFileName={}, realExtension={}", realFileLeafName, realExtension);

        String fileName;
        String dbName = fileInfo.getName();
        if (dbName != null && !dbName.trim().isEmpty()) {
            fileName = dbName.trim();
            int dbDot = fileName.lastIndexOf('.');
            if (dbDot > 0 && dbDot < fileName.length() - 1) {
                fileName = fileName.substring(0, dbDot);
            }
            if (!realExtension.isEmpty() && !fileName.toLowerCase().endsWith("." + realExtension)) {
                fileName += "." + realExtension;
            }
        } else {
            fileName = realFileLeafName;
        }

        String contentType = getContentType(realExtension.isEmpty() ? fileName : "a." + realExtension);
        Resource resource = new FileSystemResource(file);
        log.info("构建下载结果: id={}, fileName={}, contentType={}, size={}", id, fileName, contentType, file.length());
        return new FileDownloadResult(resource, fileName, contentType, file.length());
    }

    @Value("${thfxq.inout-comment.file-prefix:/data/bes/BES11.1STD/deployments/thhg/WEB-INF/classes/}")
    private String inoutCommentFilePrefix;

    @Override
    public FileDownloadResult downloadInoutCommentFile(String filepath) {
        log.info("开始下载审核流程附件: filepath={}", filepath);

        if (filepath == null || filepath.trim().isEmpty()) {
            throw new RuntimeException("附件路径为空");
        }

        String trimmed = filepath.trim();
        if (trimmed.startsWith("/")) {
            trimmed = trimmed.substring(1);
        }

        String fullPath = inoutCommentFilePrefix + trimmed;
        log.info("拼接完整路径: prefix={}, fullPath={}", inoutCommentFilePrefix, fullPath);

        File file = new File(fullPath);
        if (!file.exists()) {
            log.error("审核流程附件不存在: fullPath={}", fullPath);
            throw new RuntimeException("附件在服务器上不存在: " + fullPath);
        }
        if (!file.canRead()) {
            log.error("审核流程附件不可读: fullPath={}", fullPath);
            throw new RuntimeException("附件不可读: " + fullPath);
        }

        String fileName = file.getName();
        String realExtension = "";
        int dotIdx = fileName.lastIndexOf('.');
        if (dotIdx > 0 && dotIdx < fileName.length() - 1) {
            realExtension = fileName.substring(dotIdx + 1).toLowerCase();
        }

        String contentType = getContentType(realExtension.isEmpty() ? fileName : "a." + realExtension);
        Resource resource = new FileSystemResource(file);
        log.info("构建审核附件下载结果: fileName={}, contentType={}, size={}", fileName, contentType, file.length());
        return new FileDownloadResult(resource, fileName, contentType, file.length());
    }

    @Override
    public FilePreviewVO previewInoutCommentFile(String filepath) {
        long startTime = System.currentTimeMillis();
        try {
            if (filepath == null || filepath.trim().isEmpty()) {
                throw new RuntimeException("附件路径为空");
            }

            String trimmed = filepath.trim();
            if (trimmed.startsWith("/")) {
                trimmed = trimmed.substring(1);
            }
            String fullPath = inoutCommentFilePrefix + trimmed;
            log.info("审核附件预览-拼接完整路径: fullPath={}", fullPath);

            File sourceFile = new File(fullPath);
            if (!sourceFile.exists()) {
                log.error("审核附件预览-文件不存在: fullPath={}", fullPath);
                throw new RuntimeException("附件在服务器上不存在: " + fullPath);
            }
            if (!sourceFile.canRead()) {
                log.error("审核附件预览-文件不可读: fullPath={}", fullPath);
                throw new RuntimeException("附件不可读: " + fullPath);
            }

            String originalLeafName = sourceFile.getName();
            String fileExtension = getFileExtension(originalLeafName);
            if (!SUPPORTED_EXTENSIONS.contains(fileExtension.toLowerCase())) {
                throw new RuntimeException("不支持的文件类型: " + fileExtension);
            }

            String timestamp = String.valueOf(System.currentTimeMillis());
            String uuid = UUID.randomUUID().toString().replace("-", "");
            String tempFileName = timestamp + "_" + uuid;
            if (!fileExtension.isEmpty()) {
                tempFileName += "." + fileExtension;
            }

            String tempDir = createTempDirectory();
            String newTempFilePath = tempDir + File.separator + tempFileName;

            try {
                byte[] fileBytes = Files.readAllBytes(Paths.get(fullPath));
                File targetDir = new File(newTempFilePath).getParentFile();
                if (!targetDir.exists()) {
                    targetDir.mkdirs();
                }
                Files.write(Paths.get(newTempFilePath), fileBytes);
                log.info("审核附件预览-复制到临时文件: {} -> {}", fullPath, newTempFilePath);
            } catch (IOException e) {
                log.error("审核附件预览-复制文件失败: {}", e.getMessage(), e);
                throw new RuntimeException("复制文件失败: " + e.getMessage());
            }

            if (!new File(newTempFilePath).exists()) {
                throw new RuntimeException("临时文件不存在: " + newTempFilePath);
            }

            String htmlFilePath = convertToHtml(newTempFilePath);
            String previewUrl = generatePreviewUrl(htmlFilePath);

            FilePreviewVO result = new FilePreviewVO();
            result.setPreviewUrl(previewUrl);
            result.setFileName(originalLeafName);
            result.setFileType(fileExtension);
            result.setFileSize(new File(newTempFilePath).length());

            log.info("审核附件预览-完成: filepath={}, previewUrl={}, cost={}ms",
                    filepath, previewUrl, System.currentTimeMillis() - startTime);
            return result;

        } catch (Exception e) {
            log.error("审核附件预览失败: filepath={}, 错误={}", filepath, e.getMessage(), e);
            throw new RuntimeException("审核附件预览失败: " + e.getMessage());
        }
    }
}