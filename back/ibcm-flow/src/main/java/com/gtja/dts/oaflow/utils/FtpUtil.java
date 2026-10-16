package com.gtja.dts.oaflow.utils;

import com.gtja.dts.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.net.ftp.FTP;
import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPReply;
import org.springframework.http.HttpStatus;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * @author wxx
 * @date 2023-05-15 15:17
 */
@Slf4j
public class FtpUtil {

    /**
     * 登录  和linux 账号密码一致即可，也可以单独设置
     * @param server ip
     * @param port  端口
     * @param user 账号
     * @param password 密码
     * @return 是否登录成功
     */
    public static FTPClient login(String server, Integer port, String user, String password) {
        // 创建FTPClient对象
        FTPClient ftpClient = new FTPClient();
        try {
            // 连接FTP服务器
            ftpClient.connect(server, port);
            // 登录FTP服务器
            ftpClient.login(user, password);
            // 获取FTP服务器的响应码
            int replyCode = ftpClient.getReplyCode();
            // 如果响应码不是“正常”，返回
            if (!FTPReply.isPositiveCompletion(replyCode)) {
                log.debug("server{}", "port{}", "user{}", "pwd{}", server, port, user, password);
                throw new BusinessException("ftp登入失败");
            }
            // 设置被动模式（passive mode）
            ftpClient.enterLocalPassiveMode();
            // 设置文件传输类型为二进制文件类型
            ftpClient.setFileType(FTP.BINARY_FILE_TYPE);

        } catch (IOException e) {
            e.printStackTrace();
        }
        return ftpClient;
    }

    public static void ftpFinally(FTPClient ftpClient) {
        // 关闭FTP连接
        if (ftpClient.isConnected()) {
            try {
                ftpClient.logout();
                ftpClient.disconnect();
            } catch (IOException ex) {
                ex.printStackTrace();
            }
        }
    }


    /**
     * 下载
     * @param ftpClient ftp 客户端
     * @param response 响应
     * @param remoteFile 远程文件路径
     * @param remoteName 远程文件名
     */
    public static void downLoad(FTPClient ftpClient, HttpServletResponse response,String remoteFile,String remoteName){
        // 下载文件
        InputStream inputStream;
        try {
            inputStream = ftpClient.retrieveFileStream(remoteFile);
            if (inputStream == null) {
                response.setStatus(HttpStatus.NOT_FOUND.value());
                throw new BusinessException("下载失败");
            }
            response.setContentType("application/octet-stream");
            response.setHeader("Content-Disposition", "attachment;filename=" + remoteName);
            byte[] buffer = new byte[1024];
            int len;
            while ((len = inputStream.read(buffer)) != -1) {
                // 输出到浏览器响应
                response.getOutputStream().write(buffer, 0, len);
            }
            inputStream.close();
            ftpClient.logout();
            response.getOutputStream().flush();
        } catch (IOException e) {
            e.printStackTrace();
            response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
        }

    }

    public static void downLoadPlus(FTPClient ftpClient,HttpServletResponse response,String remoteFile, String remoteName) {
        ServletOutputStream outputStream = null;
        InputStream inputStream = null;
        try {
            ftpClient.enterLocalPassiveMode();
            ftpClient.setFileType(FTP.BINARY_FILE_TYPE);
            // 获取输入流
            inputStream = ftpClient.retrieveFileStream(remoteFile);
            // 设置响应头信息
            response.setContentType("application/octet-stream");
            response.setHeader("Content-Disposition", "attachment; filename=" + remoteName);
            // 获取响应输出流
            outputStream = response.getOutputStream();
            // 写入数据到响应输出流
            // 每次读取1MB数据
            byte[] buffer = new byte[1024 * 1024];
            // 设置缓冲区大小为1MB
            ftpClient.setBufferSize(1024 * 1024);
            int bytesRead = -1;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }

        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            // 关闭流
            try {
                if (null != outputStream) {
                    outputStream.close();
                }
                if (null != inputStream) {
                    inputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}

