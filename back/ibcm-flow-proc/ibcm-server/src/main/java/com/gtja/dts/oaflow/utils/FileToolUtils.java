package com.gtja.dts.oaflow.utils;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.CharsetUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.net.ftp.FTP;
import org.apache.commons.net.ftp.FTPClient;
import org.springframework.util.Assert;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.URLEncoder;

/**
 * @author aileaile
 * @date 2022/8/10
 * @description
 */
@Slf4j
public class FileToolUtils {
    public static String convertFile(MultipartFile multipartFile){
        //文件上传前的名称
        String fileName = multipartFile.getOriginalFilename();
        assert fileName != null;
        File file = new File(fileName);
        OutputStream out = null;
        try{
            //获取文件流，以文件流的方式输出到新文件
            out = new FileOutputStream(file);
            byte[] ss = multipartFile.getBytes();
            for (byte s : ss) {
                out.write(s);
            }
        }catch(IOException e){
            e.printStackTrace();
        }finally {
            if (out != null){
                try {
                    out.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
        return file.getPath();
    }

    /**
     * 用于下载附件
     *
     * @param response
     * @param filePath
     * @param name
     * @throws UnsupportedEncodingException
     */
    public static void downloadFileByPath(HttpServletResponse response, String filePath, String name) throws UnsupportedEncodingException {
        File file = new File(filePath + name);

        Assert.isTrue(FileUtil.exist(file), "文件不存在");

        response.setContentType("application/octet-stream");
        response.setHeader("Content-Disposition", "attachment;filename=" + URLEncoder.encode(name, CharsetUtil.UTF_8));

        try (OutputStream os = response.getOutputStream(); BufferedInputStream bis = new BufferedInputStream(new FileInputStream(file))) {
            byte[] buff = new byte[1024];
            int read;
            while ((read = bis.read(buff, 0, buff.length)) != -1) {
                os.write(buff, 0, read);
            }
            os.flush();
        } catch (IOException e) {
            log.error(e.getMessage(), e);
        }
    }


    public static boolean fileUtil(MultipartFile file, String path) {
        boolean result = false;
//        if (!file.isEmpty()) {
            try {
                File dir = new File(path);
                if(dir.mkdirs()){
                    byte[] bytes = file.getBytes();
                    BufferedOutputStream bufferedOutputStream = new BufferedOutputStream(new FileOutputStream(
                            new File(path + "\\" + file.getOriginalFilename())));
                    bufferedOutputStream.write(bytes);
                    bufferedOutputStream.close();
                    result = true;
                }else {
                    log.error(path + "文件路径创建失败");
                }
            } catch (Exception e) {
               log.error(file.getOriginalFilename() + "failed to upload ---> " + e);
            }
//        } else {
//           log.error(file.getOriginalFilename() + "You failed to upload file was empty.");
//        }
        return result;
    }
}
