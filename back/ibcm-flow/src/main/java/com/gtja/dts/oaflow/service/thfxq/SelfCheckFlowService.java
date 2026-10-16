package com.gtja.dts.oaflow.service.thfxq;

/**
 * 清单自查流程服务
 * 负责批量下发清单自查流程到 OA 系统
 * 
 * @author AI Assistant
 * @date 2026-08-04
 */
public interface SelfCheckFlowService {

    /**
     * 执行清单自查流程批量下发任务
     * 扫描未发送记录并调用本地 HTTP 接口下发流程
     * 
     * @return 处理结果摘要（成功数、失败数）
     */
    ProcessResult executeBatchSubmit();

    /**
     * 进程结果封装
     */
    class ProcessResult {
        private int total;      // 总处理数量
        private int success;    // 成功数量
        private int failed;     // 失败数量
        private String errorMsg; // 错误信息（如有）

        public ProcessResult() {}

        public ProcessResult(int total, int success, int failed) {
            this.total = total;
            this.success = success;
            this.failed = failed;
        }

        // Getters and Setters
        public int getTotal() { return total; }
        public void setTotal(int total) { this.total = total; }

        public int getSuccess() { return success; }
        public void setSuccess(int success) { this.success = success; }

        public int getFailed() { return failed; }
        public void setFailed(int failed) { this.failed = failed; }

        public String getErrorMsg() { return errorMsg; }
        public void setErrorMsg(String errorMsg) { this.errorMsg = errorMsg; }

        @Override
        public String toString() {
            return String.format("ProcessResult{total=%d, success=%d, failed=%d}", total, success, failed);
        }
    }
}
