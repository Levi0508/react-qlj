package com.gtja.dts.oaflow.mapper.thfxq;

import com.gtja.dts.oaflow.pojo.po.thfxq.*;
import com.gtja.dts.oaflow.pojo.vo.thfxq.FeedBackResultVO;
import com.gtja.dts.oaflow.pojo.vo.thfxq.UpdateClientStatusRequest;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.ResultMap;
import org.apache.ibatis.mapping.StatementType;
import org.apache.ibatis.type.JdbcType;

import java.util.List;

/**
 * @author 程婧
 * @date 2025-11-25 13:27
 */
@Mapper
public interface ThfxqMapper {
    /**
     * 通过clientId查询客户基本信息
     *
     * @param clientId
     * @return
     */
    @Select("select a.* from thjs.t_th_client_info a where a.client_id = #{clientId}")
    List<ClientInfo> selectBasicInfo(@Param("clientId") String clientId);

    /**
     * 通过clientId和relatedType查询关联人信息
     *
     * @param clientId
     * @param relatedType
     * @return
     */
    @Select("select a.* from thjs.t_th_relat_info a where a.client_id = #{clientId} and a.related_type = #{relatedType} and (a.data_status = #{dataType} or #{dataType} is null) union all select b.* from thjs.t_th_relat_info_tmp b where b.client_id = #{clientId} and b.related_type = #{relatedType}")
    List<RelatedInfo> selectRelatedInfo(@Param("clientId") String clientId, @Param("relatedType") String relatedType, @Param("dataType") String dataType);

    /**
     * 通过clientId和fileTypeNo查询客户附件信息
     *
     * @param clientId
     * @param fileTypeNo
     * @param objectId
     * @return
     */
    @Select("<script>" +
            "SELECT a.client_id, a.file_type_no, a.id, a.name, a.file_size, a.extension, coalesce(b.display_name,b1.display_name,a.create_by) as create_by, a.create_time, a.file_path, a.status, a.object_id FROM (" +
            "  SELECT t.*, " +
            "    ROW_NUMBER() OVER ( " +
            "      PARTITION BY client_id, name, file_type_no, extension, file_path " +
            "      ORDER BY create_time DESC " +
            "    ) as rn" +
            "  FROM thjs.t_th_client_file t " +
            "  WHERE client_id = #{clientId} " +
            "    AND (INSTR(','||#{fileTypeNo}||',', ',' || file_type_no || ',') > 0 OR #{fileTypeNo} IS NULL) " +
            "    AND (object_id = #{objectId} OR #{objectId} IS NULL) " +
            ")a " +
            "left join wolf.wb_user b on a.create_by = b.user_name " +
            "left join wolf.wb_user_hg b1 on a.create_by = b1.user_name WHERE rn = 1 " +
            "order by create_time desc " +
            "</script>")
    List<FileList> selectFileList(@Param("clientId") String clientId, @Param("fileTypeNo") String fileTypeNo, @Param("objectId") String objectId);

    /**
     * 通过entryNo查询thjs.t_dict_subentry字典表
     *
     * @param entryNo
     * @return
     */
    @Select("select a.subentry as k,a.comments as v from thjs.t_dict_subentry a where a.entry_no = #{entryNo}")
    List<DictSubentry> selectDict(@Param("entryNo") String entryNo);

    /**
     * 通过keyName查询wb_key键值表
     *
     * @param keyName
     * @return
     */
    @Select("select a.map_k as k,a.map_v as v from thjs.wb_key a inner join thjs.wb_KEY_TYPE b on a.rid = b.sid where b.key_name = #{keyName}")
    List<WbKey> selectKey(@Param("keyName") String keyName);

    /**
     * 查询错误类型列表
     * @return 错误类型列表
     */
    @Select("select distinct a.err_type from thjs.t_par_err_type a where a.status = '1' and (a.organ_flag = #{organFlag, jdbcType=VARCHAR} or #{organFlag, jdbcType=VARCHAR} is null) order by a.err_type")
    List<String> selectErrType(@Param("organFlag") String organFlag);

    /**
     * 通过clientId和userId调用存储过程查询反馈结果
     *
     * @param feedBackResultVO 参数对象（包含输入参数和输出参数）
     */
    void selectFeedBack(FeedBackResultVO feedBackResultVO);

    /**
     * 通过clientId和userId调用存储过程查询反馈结果详细描述
     *
     * @param feedBackResultVO 参数对象（包含输入参数和输出参数）
     */
    void selectFeedBackDesc(FeedBackResultVO feedBackResultVO);

    /**
     * 通过clientId查询审核总批次
     *
     * @param clientId
     * @return
     */
    @Select("select count(distinct audit_id) as cnt\n" +
            "  FROM thjs.T_TH_APPR_LIST \n" +
            "WHERE client_id = #{clientId}")
    Integer selectBatchTotal(@Param("clientId") String clientId);

    /**
     * 通过clientId和batchNum查询某一次审核的详情
     *
     * @param clientId
     * @param batchNum
     * @return
     */
    @Select("WITH RankedAudits AS ( " +
            "    SELECT " +
            "        a.audit_id, " +
            "        b.display_name as create_user, " +
            "        a.create_time, " +
            "        a.remark, " +
            "        ROW_NUMBER() OVER (ORDER BY a.create_time DESC) as batch_num " +
            "    FROM thjs.T_TH_APPR_LIST a " +
            "    LEFT JOIN wolf.wb_user b " +
            "    ON a.create_user = b.user_name " +
            "    WHERE a.client_id = #{clientId} " +
            ") " +
            "SELECT  " +
            "    d.*, " +
            "    ra.create_user as batch_create_user, " +
            "    ra.create_time as batch_create_time, " +
            "    ra.remark as batch_remark, " +
            "    COALESCE(u.display_name, ra.create_user) as batch_display_name " +
            "FROM RankedAudits ra " +
            "LEFT JOIN thjs.T_TH_APPR_DETAIL d ON d.audit_id = ra.audit_id AND d.client_id = #{clientId} " +
            "LEFT JOIN wolf.wb_user u ON d.create_user = u.user_name " +
            "WHERE ra.batch_num = #{batchNum}")
    List<ApprDetail> selectApprDetails(@Param("clientId") String clientId, @Param("batchNum") String batchNum);

    /**
     * 查询文件内容表中是否存在记录
     * @param id 附件ID
     * @return 记录数
     */
    @Select("SELECT COUNT(0) as cnt FROM thjs.t_th_client_file_content WHERE ID = #{id}")
    int countFileContent(@Param("id") String id);

    /**
     * 根据ID查询文件基本信息
     * @param id 附件ID
     * @return 文件信息
     */
    @Select("SELECT * FROM thjs.t_th_client_file WHERE ID = #{id}")
    FileList selectFileById(@Param("id") String id);

    @Select("select * from thjs.t_dict_area_code_v2 where pro_code = area_code order by pro_code")
    List<AreaCode> selectProvince();

    @Select("select * from thjs.t_dict_area_code_v2 t where t.pro_code != t.area_code and t.area_code like '%00' and t.pro_code = #{proCode}")
    List<AreaCode> selectCity(@Param("proCode") String proCode);

    @Select("select * from thjs.t_dict_area_code_v2 t where t.pro_code != t.area_code and t.area_code like #{areaCode} || '%' and t.area_code not like '%00' and t.pro_code = #{proCode}")
    List<AreaCode> selectDistrict(@Param("proCode") String proCode, @Param("areaCode") String areaCode);

    @Delete("delete from thjs.t_th_relat_info where client_id = #{clientId} and (organ_flag = #{organFlag} or #{organFlag} is null) and (related_type = #{relatedType} or #{relatedType} is null) and (related_id = #{relatedId})")
    int deleteFromRelatInfo(@Param("clientId") String clientId, @Param("organFlag") String organFlag, @Param("relatedType") String relatedType, @Param("relatedId") String relatedId);

    @Delete("delete from thjs.t_th_relat_info_tmp where client_id = #{clientId} and (organ_flag = #{organFlag} or #{organFlag} is null) and (related_type = #{relatedType} or #{relatedType} is null) and (related_id = #{relatedId})")
    int deleteFromRelatInfoTmp(@Param("clientId") String clientId, @Param("organFlag") String organFlag, @Param("relatedType") String relatedType, @Param("relatedId") String relatedId);

    @Select("select * from(select a.* from thjs.t_th_relat_info a where a.client_id = #{clientId, jdbcType=VARCHAR} and a.organ_flag = #{organFlag, jdbcType=VARCHAR} and (a.related_name = #{relatedName, jdbcType=VARCHAR} or #{relatedName, jdbcType=VARCHAR} is null or #{relatedName, jdbcType=VARCHAR} = '') union all select b.* from thjs.t_th_relat_info_tmp b where b.client_id = #{clientId, jdbcType=VARCHAR} and b.organ_flag = #{organFlag, jdbcType=VARCHAR} and (b.related_name = #{relatedName, jdbcType=VARCHAR} or #{relatedName, jdbcType=VARCHAR} is null or #{relatedName, jdbcType=VARCHAR} = ''))t order by t.create_time")
    List<RelatedInfo> selectOrganEntity(@Param("clientId") String clientId, @Param("organFlag") String organFlag, @Param("relatedName") String relatedName);

    /**
     * 更新客户基本信息（调用存储过程）
     * @param clientInfo 客户信息
     * @return 影响行数
     */
    @Select("{call thjs.p_th_client_info_s(" +
            "#{clientId, jdbcType=VARCHAR, mode=IN}, " +
            "#{clientName, jdbcType=VARCHAR, mode=IN}, " +
            "#{organFlag, jdbcType=VARCHAR, mode=IN}, " +
            "#{idType, jdbcType=VARCHAR, mode=IN}, " +
            "#{idNo, jdbcType=VARCHAR, mode=IN}, " +
            "#{idBegindate, jdbcType=VARCHAR, mode=IN}, " +
            "#{idEnddate, jdbcType=VARCHAR, mode=IN}, " +
            "#{clientBelong, jdbcType=VARCHAR, mode=IN}, " +
            "#{nationality, jdbcType=VARCHAR, mode=IN}, " +
            "#{birthday, jdbcType=VARCHAR, mode=IN}, " +
            "#{officeAddress, jdbcType=VARCHAR, mode=IN}, " +
            "#{province, jdbcType=VARCHAR, mode=IN}, " +
            "#{city, jdbcType=VARCHAR, mode=IN}, " +
            "#{district, jdbcType=VARCHAR, mode=IN}, " +
            "#{registerCountry, jdbcType=VARCHAR, mode=IN}, " +
            "#{registerMoneyType, jdbcType=VARCHAR, mode=IN}, " +
            "#{registerFund, jdbcType=VARCHAR, mode=IN}, " +
            "#{industryType, jdbcType=VARCHAR, mode=IN}, " +
            "#{tel, jdbcType=VARCHAR, mode=IN}, " +
            "#{setupDate, jdbcType=VARCHAR, mode=IN}, " +
            "#{busiScope, jdbcType=VARCHAR, mode=IN}, " +
            "#{isObjectReport, jdbcType=VARCHAR, mode=IN}, " +
            "#{associatedDate, jdbcType=VARCHAR, mode=IN}, " +
            "#{remark, jdbcType=VARCHAR, mode=IN}, " +
            "#{createUser, jdbcType=VARCHAR, mode=IN}, " +
            "#{createTime, jdbcType=VARCHAR, mode=IN}, " +
            "#{updateUser, jdbcType=VARCHAR, mode=IN}, " +
            "#{updateTime, jdbcType=VARCHAR, mode=IN}, " +
            "#{isSpecial, jdbcType=VARCHAR, mode=IN}, " +
            "#{clientType, jdbcType=VARCHAR, mode=IN}, " +
            "#{clientTypeOther, jdbcType=VARCHAR, mode=IN}, " +
            "#{specialMatters, jdbcType=VARCHAR, mode=IN}, " +
            "#{missingInformation, jdbcType=VARCHAR, mode=IN}, " +
            "#{missingDraft, jdbcType=VARCHAR, mode=IN}, " +
            "#{specialMattersOther, jdbcType=VARCHAR, mode=IN}, " +
            "#{specialReason, jdbcType=VARCHAR, mode=IN}, " +
            "#{completedCdd, jdbcType=VARCHAR, mode=IN}, " +
            "#{lowRiskExplanation, jdbcType=VARCHAR, mode=IN}, " +
            "#{takeMeasures, jdbcType=VARCHAR, mode=IN}, " +
            "#{communicationRecords, jdbcType=VARCHAR, mode=IN}, " +
            "#{agreeRecords, jdbcType=VARCHAR, mode=IN}, " +
            "#{otherRecords, jdbcType=VARCHAR, mode=IN}, " +
            "#{industryType1, jdbcType=VARCHAR, mode=IN}, " +
            "#{workType, jdbcType=VARCHAR, mode=IN}, " +
            "#{clientStatus, jdbcType=VARCHAR, mode=IN}, " +
            "#{dataStatus, jdbcType=VARCHAR, mode=IN}, " +
            "#{relatedProj, jdbcType=VARCHAR, mode=IN}, " +
            "#{ifRiskClient, jdbcType=VARCHAR, mode=IN}, " +
            "#{riskListType, jdbcType=VARCHAR, mode=IN}, " +
            "#{problemDesc, jdbcType=VARCHAR, mode=IN}, " +
            "#{gradeValue, jdbcType=VARCHAR, mode=IN}, " +
            "#{gender, jdbcType=VARCHAR, mode=IN}, " +
            "#{income, jdbcType=VARCHAR, mode=IN}, " +
            "#{professionCode, jdbcType=VARCHAR, mode=IN}, " +
            "#{position, jdbcType=VARCHAR, mode=IN}, " +
            "#{workPlace, jdbcType=VARCHAR, mode=IN}, " +
            "#{zipcode, jdbcType=VARCHAR, mode=IN}, " +
            "#{fillinDate, jdbcType=VARCHAR, mode=IN}, " +
            "#{idAddress, jdbcType=VARCHAR, mode=IN}, " +
            "#{province1, jdbcType=VARCHAR, mode=IN}, " +
            "#{city1, jdbcType=VARCHAR, mode=IN}, " +
            "#{district1, jdbcType=VARCHAR, mode=IN}, " +
            "#{address, jdbcType=VARCHAR, mode=IN}, " +
            "#{province2, jdbcType=VARCHAR, mode=IN}, " +
            "#{city2, jdbcType=VARCHAR, mode=IN}, " +
            "#{district2, jdbcType=VARCHAR, mode=IN}, " +
            "#{ifRiskList, jdbcType=VARCHAR, mode=IN}, " +
            "#{industryName, jdbcType=VARCHAR, mode=IN}, " +
            "#{returnMsg, jdbcType=VARCHAR, mode=OUT}, " +
            "#{returnCode, jdbcType=VARCHAR, mode=OUT})}")
    @Options(statementType = StatementType.CALLABLE)
    void updateClient(ClientInfo clientInfo);

    /**
     * 保存关联人信息到临时表
     * @param relatedInfo 关联人信息
     * @return 影响行数
     */
    @Insert("INSERT INTO thjs.t_th_relat_info_tmp " +
            "(CLIENT_ID, RELATED_TYPE, RELATED_NAME, ORGAN_FLAG, ID_TYPE, ID_NO, ID_BEGINDATE, ID_ENDDATE, " +
            "NATIONALITY, BIRTHDAY, IS_GOVERNMENT_DEPT, BENEFICIARY, SHAREHOLDING_RATIO, ADDRESS,MOBNO1, OBJECT_ID, UPDATE_USER, UPDATE_TIME, CREATE_USER, CREATE_TIME, DATA_STATUS) " +
            "VALUES " +
            "(#{clientId, jdbcType=VARCHAR}, #{relatedType, jdbcType=VARCHAR}, #{relatedName, jdbcType=VARCHAR}, #{organFlag, jdbcType=VARCHAR}, #{idType, jdbcType=VARCHAR}, #{idNo, jdbcType=VARCHAR}, #{idBegindate, jdbcType=VARCHAR}, #{idEnddate, jdbcType=VARCHAR}, " +
            "#{nationality, jdbcType=VARCHAR}, #{birthday, jdbcType=VARCHAR}, #{isGovernmentDept, jdbcType=VARCHAR}, #{beneficiary, jdbcType=VARCHAR}, #{shareholdingRatio, jdbcType=VARCHAR}, #{address, jdbcType=VARCHAR}, #{mobno1, jdbcType=VARCHAR}, #{objectId, jdbcType=VARCHAR}, TO_CHAR(" +
            "        COALESCE(" +
            "            TO_CHAR((SELECT u.user_name FROM wolf.wb_user u WHERE u.user_id = #{updateUser, jdbcType=VARCHAR}))," +
            "            TO_CHAR((SELECT u1.user_name FROM wolf.wb_user_hg u1 WHERE u1.user_id = #{updateUser, jdbcType=VARCHAR}))," +
            "            TO_CHAR(#{updateUser, jdbcType=VARCHAR}) " +
            "        )" +
            "    ),sysdate, TO_CHAR(" +
            "        COALESCE(" +
            "            TO_CHAR((SELECT u.user_name FROM wolf.wb_user u WHERE u.user_id = #{createUser, jdbcType=VARCHAR}))," +
            "            TO_CHAR((SELECT u1.user_name FROM wolf.wb_user_hg u1 WHERE u1.user_id = #{createUser, jdbcType=VARCHAR}))," +
            "            TO_CHAR(#{createUser, jdbcType=VARCHAR}) " +
            "        )" +
            "    ), sysdate, '0')")
    int insertRelatedInfoTmp(RelatedInfo relatedInfo);

    /**
     * 根据关联人ID删除关联人信息
     * @param relatedId 关联人ID
     * @return 影响行数
     */
    @Delete("DELETE FROM thjs.t_th_relat_info_tmp WHERE RELATED_ID = #{relatedId}")
    int deleteRelatedInfoTmp(@Param("relatedId") String relatedId);

    /**
     * 根据关联人名称和客户ID删除关联人信息（用于更新关联主体时）
     * @param clientId 客户ID
     * @param relatedName 关联人名称
     * @return 影响行数
     */
    @Delete("DELETE FROM thjs.t_th_relat_info WHERE client_id = #{clientId} AND related_name = #{relatedName}")
    int deleteRelatedInfoByName(@Param("clientId") String clientId, @Param("relatedName") String relatedName);

    /**
     * 根据关联人名称和客户ID删除临时表关联人信息（用于更新关联主体时）
     * @param clientId 客户ID
     * @param relatedName 关联人名称
     * @return 影响行数
     */
    @Delete("DELETE FROM thjs.t_th_relat_info_tmp WHERE client_id = #{clientId} AND related_name = #{relatedName}")
    int deleteRelatedInfoTmpByName(@Param("clientId") String clientId, @Param("relatedName") String relatedName);

    /**
     * 插入文件信息到数据库（文件保存到磁盘，不再存入blob字段）
     * @param clientId 客户ID
     * @param fileTypeNo 文件类型编号
     * @param id 文件ID
     * @param name 文件名
     * @param fileSize 文件大小
     * @param extension 文件扩展名
     * @param createBy 创建人
     * @param objectId 对象ID
     * @param filePath 文件存储路径
     * @return 影响行数
     */
    @Insert("INSERT INTO thjs.t_th_client_file " +
            "(client_id, file_type_no, id, name, file_size, extension, create_by, create_time, object_id, file_path, status) " +
            "VALUES " +
            "(#{clientId, jdbcType=VARCHAR}, #{fileTypeNo, jdbcType=VARCHAR}, #{id, jdbcType=VARCHAR}, #{name, jdbcType=VARCHAR}, #{fileSize, jdbcType=VARCHAR}, #{extension, jdbcType=VARCHAR}, (" +
            "        COALESCE(" +
            "            (SELECT u.user_name FROM wolf.wb_user u WHERE u.user_id = #{updateUser, jdbcType=VARCHAR})," +
            "            (SELECT u1.user_name FROM wolf.wb_user_hg u1 WHERE u1.user_id = #{updateUser, jdbcType=VARCHAR})," +
            "            #{updateUser, jdbcType=VARCHAR}" +
            "        )" +
            "), sysdate, #{objectId, jdbcType=VARCHAR}, #{filePath, jdbcType=VARCHAR},'0')")
    int insertFileInfo(@Param("clientId") String clientId,
                       @Param("fileTypeNo") String fileTypeNo,
                       @Param("id") String id,
                       @Param("name") String name,
                       @Param("fileSize") double fileSize,
                       @Param("extension") String extension,
                       @Param("createBy") String createBy,
                       @Param("objectId") String objectId,
                       @Param("filePath") String filePath);

    /**
     * 插入文件内容到数据库
     * @param id 文件ID
     * @param content 文件内容
     * @return 影响行数
     */
    @Insert("INSERT INTO thjs.t_th_client_file_content (id, content) VALUES (#{id}, #{content})")
    int insertFileContent(@Param("id") String id, @Param("content") byte[] content);

    /**
     * 更新文件目录
     * @param id 文件ID
     * @param fileTypeNo 文件类型编号
     * @return 影响行数
     */
    @Update("UPDATE thjs.t_th_client_file SET file_type_no = #{fileTypeNo, jdbcType=VARCHAR} WHERE id = #{id, jdbcType=VARCHAR}")
    int updateFileDir(@Param("id") String id, @Param("fileTypeNo") String fileTypeNo);

    /**
     * 删除附件（同时删除文件信息和文件内容）
     * @param filePkId 文件ID
     * @return 影响行数
     */
    @Delete("DELETE FROM thjs.t_th_client_file WHERE id = #{filePkId}")
    int deleteFile(@Param("filePkId") String filePkId);

    /**
     * 删除附件内容
     * @param filePkId 文件ID
     * @return 影响行数
     */
    @Delete("DELETE FROM thjs.t_th_client_file_content WHERE id = #{filePkId}")
    int deleteFileContent(@Param("filePkId") String filePkId);

    /**
     * 保存审核列表（使用小驼峰参数）
     * @param clientId 客户ID
     * @param auditId 审核ID
     * @param remark 备注
     * @param createUser 创建用户
     * @return 影响行数
     */
    @Insert("INSERT INTO thjs.t_th_appr_list (client_id, audit_id, remark, create_user, create_time) " +
            "VALUES (#{clientId, jdbcType=VARCHAR}, #{auditId, jdbcType=VARCHAR}, #{remark, jdbcType=VARCHAR}, " +
            "TO_CHAR((SELECT user_name FROM wolf.wb_user WHERE user_id = #{createUser, jdbcType=VARCHAR})), " +
            "sysdate)")
    int saveApprList(@Param("clientId") String clientId, @Param("auditId") String auditId, @Param("remark") String remark, @Param("createUser") String createUser);



    /**
     * 批量保存审核详情
     * 注意：createUser 入参实际为 user_id，SQL中会自动转换为 user_name 存储
     * @param batchList 审核详情数组
     * @param createUser 创建用户ID (对应 basic_thjs.wb_user 表的 user_id)
     * @return 影响行数
     */
    @Insert("<script>" +
            "INSERT ALL " +
            "<foreach collection='batchList' item='item'>" +
            "INTO thjs.t_th_appr_detail " +
            "(client_id, audit_id, audit_seq, audit_desc, dispose_desc, create_user, create_time) " +
            "VALUES " +
            "(#{item.clientId, jdbcType=VARCHAR}, #{item.auditId, jdbcType=VARCHAR}, #{item.auditSeq, jdbcType=VARCHAR}, #{item.auditDesc, jdbcType=VARCHAR}, #{item.disposeDesc, jdbcType=VARCHAR}, " +
            "TO_CHAR((SELECT user_name FROM wolf.wb_user WHERE user_id = #{createUser, jdbcType=VARCHAR})), " +
            "sysdate) " +
            "</foreach>" +
            "SELECT 1 FROM DUAL" +
            "</script>")
    int saveApprDetails(@Param("batchList") List<ApprDetail> batchList, @Param("createUser") String createUser);

    /**
     * 更新客户状态（调用存储过程）
     * @param request 请求参数
     */
    @Select("{call thjs.p_fxq_cust_rz_l(" +
            "#{clientId, jdbcType=VARCHAR, mode=IN}, " +
            "#{opFlag, jdbcType=VARCHAR, mode=IN}, " +
            "#{userName, jdbcType=VARCHAR, mode=IN}, " +
            "#{returnMsg, jdbcType=VARCHAR, mode=OUT}, " +
            "#{returnCode, jdbcType=VARCHAR, mode=OUT})}")
    @Options(statementType = StatementType.CALLABLE)
    void updateClientStatus(UpdateClientStatusRequest request);

    /**
     * 根据客户ID查询维护人员信息
     * @param clientId 客户ID
     * @return 维护人员信息列表
     */
    @Select("select u.*,u1.user_name as curUserName,u1.user_id as curUserId from wolf.WB_USER u " +
            "inner join thjs.t_maintainer_info a " +
            "on u.user_name = a.new_maintainer " +
            "left join wolf.wb_user u1 "+
            "on u1.user_id = #{userId, jdbcType=VARCHAR} "+
            "where a.client_id =#{clientId, jdbcType=VARCHAR}")
    List<WbUser> selectMaintainer(@Param("clientId") String clientId, @Param("userId") String userId);

    /**
     * 根据流程实例ID查询自检流程内容
     * @param piid 流程实例ID
     * @return 内容字符串
     */
    @Select("select content as content from T_PROJ_SELFCHECK_FLOW where sys_piid = #{piid, jdbcType=VARCHAR}")
    String selectContent(@Param("piid") String piid);

    /**
     * 根据项目ID、流程实例ID和业务日期查询自检结果
     * @param projId 项目ID
     * @param piid 流程实例ID
     * @param checkBatchId 业务日期（格式：yyyyMMdd）
     * @return 自检结果列表
     */
    @Select("SELECT * FROM thjs.tb_projlist_check_result " +
            "WHERE projid = #{projId, jdbcType=VARCHAR} " +
            "AND process_id = #{piid, jdbcType=VARCHAR} " +
            "AND check_batch_id = #{checkBatchId, jdbcType=VARCHAR}")
    List<TbProjlistCheckResult> selectSelfCheck(@Param("projId") String projId, @Param("piid") String piid, @Param("checkBatchId") String checkBatchId);


    /**
     * 查询清单审核表单数据
     * @param projId 项目ID
     * @param piid 流程实例ID
     * @param batchId 批次ID
     * @return 清单审核表单数据列表
     */
    @Select("select p.projcode," +
            "       p.projid," +
            "       p.custname as khname," +
            "       p.projname," +
            "       p.stkcode as stockcode," +
            "       p.stkname as stockname," +
            "       p.projtype," +
            "       p.projlist_status as proj_status," +
            "       case p.projlist_status" +
            "         when 'ro' then '入观察清单'" +
            "         when 'co' then '出观察清单'" +
            "         when 'rl' then '入限制清单'" +
            "         when 'cl' then '出限制清单'" +
            "         when 'rq' then '入静默'" +
            "         when 'cq' then '出静默'" +
            "         when '0'  then '0'" +
            "         else p.projlist_status" +
            "       end as proj_status_name," +
            "       p.deptmananame," +
            "       listagg(nvl(b.staff_id,a.deptmanacode),',') within group(order by b.staff_id) as staff_id," +
            "       p.deptname as dept_name," +
            "       a.deptcode as dept_code," +
            "       '' as op_content," +
            "       '' as op_time," +
            "       case " +
            "         when count(1) = sum(c.check_result) then " +
            "           '1'" +
            "         else" +
            "           '0'" +
            "       end as check_result," +
            "       max(c.update_time) as check_time" +
            "  from thjs.vw_projlist_main_all p" +
            "  left join thjs.tb_ib_cust_info a" +
            "    on p.projid = a.projid" +
            "  left join thjs.wb_user b" +
            "    on a.deptmanacode = b.user_id" +
            "  left join (select t.*," +
            "                    row_number() over(partition by t.proj_id,t.process_id,t.batch_id,t.inout_type,t.inout_direct order by t.update_time desc) as rn" +
            "               from thjs.tb_projlist_inout_comment t) c" +
            "    on p.projid = c.proj_id" +
            "    and (c.process_id = #{piid,jdbcType=VARCHAR} or c.process_id = 'beforedraft') "+
            "    and c.batch_id = #{batchId, jdbcType=VARCHAR} "+
            "    and c.rn = 1 "+
            " where 1 = 1 " +
            "   and p.projid = #{projId, jdbcType=VARCHAR}" +
            " group by p.projcode," +
            "       p.projid," +
            "       p.custname," +
            "       p.projname," +
            "       p.stkcode," +
            "       p.stkname," +
            "       p.projtype," +
            "       p.projlist_status," +
            "       p.deptmananame," +
            "       p.deptname," +
            "       a.deptcode"
            )
    List<ProjInfo> selectProjInfo(@Param("projId") String projId, @Param("piid") String piid, @Param("batchId") String batchId);

    @Select("SELECT t.create_user, " +
            "       t.create_time, " +
            "       t.filepath, " +
            "       t.process_id, " +
            "       t.check_id, " +
            "       t.pk_id " +
            "  FROM thjs.tb_projlist_inout_comment t " +
            " WHERE t.proj_id = #{projId, jdbcType=VARCHAR} " +
            "   AND (t.pk_id = #{pkId, jdbcType=VARCHAR} or t.process_id = #{piid, jdbcType=VARCHAR}) " +
            "   AND t.check_result = '1' " +
            "   AND TRIM(t.filepath) IS NOT NULL")
    List<InoutCommentFile> selectInoutCommentFileList(@Param("projId") String projId,@Param("pkId") String pkId,@Param("piid") String piid);

    /**
     * 根据清单自查批次号查询附件列表
     * @param checkBatchId 清单自查批次号
     * @return 附件列表
     */
    @Select("select f.*, f.name || '.' || f.extension as fullFileName, u.display_name from thjs.t_proj_selfcheck_file f " +
            "left join wolf.wb_user u " +
            "on u.user_name = f.create_by " +
            "where f.check_batch_id =  #{checkBatchId, jdbcType=VARCHAR} " +
            "ORDER BY create_time DESC")
    List<TProjSelfcheckFile> selectSelfCheckFile(@Param("checkBatchId") String checkBatchId);

    /**
     * 根据ID查询清单自查附件
     * @param id 附件ID
     * @return 附件信息
     */
    @Select("SELECT check_batch_id, id, name, file_size, extension, create_by, " +
            "TO_CHAR(create_time, 'YYYY-MM-DD HH24:MI:SS') AS create_time, file_path, status " +
            "FROM thjs.T_PROJ_SELFCHECK_FILE " +
            "WHERE id = #{id, jdbcType=VARCHAR}")
    TProjSelfcheckFile selectSelfCheckFileById(@Param("id") String id);

}
