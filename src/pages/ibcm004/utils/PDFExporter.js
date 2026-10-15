// import React from 'react';
// import { Button, Modal, Spin } from 'antd';
// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';
// import moment from 'moment';

// // PDF导出样式
// const pdfStyles = `
// <style>
//   .pdf-container {
//     padding: 20px;
//     font-family: 'SimSun', 'Microsoft YaHei', 'SimHei', sans-serif;
//     font-size: 14px;
//     line-height: 1.6;
//   }
  
//   .pdf-title {
//     text-align: center;
//     font-size: 24px;
//     font-weight: bold;
//     margin-bottom: 30px;
//     padding-bottom: 15px;
//     border-bottom: 2px solid #333;
//   }
  
//   .section-title {
//     text-align: center;
//     font-size: 18px;
//     font-weight: bold;
//     margin: 25px 0 15px 0;
//     padding: 10px;
//     background-color: #f5f5f5;
//     border: 1px solid #ddd;
//   }
  
//   .info-table {
//     width: 100%;
//     border-collapse: collapse;
//     margin: 15px 0;
//   }
  
//   .info-table th,
//   .info-table td {
//     border: 1px solid #333;
//     padding: 8px 12px;
//     text-align: left;
//     vertical-align: middle;
//   }
  
//   .info-table th {
//     background-color: #f9f9f9;
//     font-weight: bold;
//     width: 25%;
//   }
  
//   .info-table td {
//     background-color: #fff;
//   }
  
//   .person-table {
//     width: 100%;
//     border-collapse: collapse;
//     margin: 15px 0;
//   }
  
//   .person-table th,
//   .person-table td {
//     border: 1px solid #333;
//     padding: 6px 8px;
//     text-align: left;
//     vertical-align: middle;
//     font-size: 12px;
//   }
  
//   .person-table th {
//     background-color: #f9f9f9;
//     font-weight: bold;
//     white-space: nowrap;
//   }
  
//   .person-table td {
//     background-color: #fff;
//   }
  
//   .empty-row {
//     text-align: center;
//     color: #999;
//     font-style: italic;
//   }
// </style>
// `;

// class PDFExporter {
//   /**
//    * 格式化字典数据
//    */
//   static formatDictValue(dictData, dictType, key) {
//     const dict = dictData[`${dictType}_list`] || [];
//     const item = dict.find(item => item.k === key);
//     return item ? item.v : key || '-';
//   }

//   /**
//    * 格式化日期
//    */
//   static formatDate(dateStr) {
//     if (!dateStr || dateStr === '-') return '-';
//     // 处理 20251101 格式的日期
//     if (dateStr.length === 8) {
//       const year = dateStr.substring(0, 4);
//       const month = dateStr.substring(4, 6);
//       const day = dateStr.substring(6, 8);
//       return `${year}-${month}-${day}`;
//     }
//     // 尝试使用 moment 格式化其他格式
//     try {
//       return moment(dateStr).format('YYYY-MM-DD');
//     } catch {
//       return dateStr;
//     }
//   }

//   /**
//    * 生成基本信息表格
//    */
//   static generateBasicInfoTable(basicInfo, dictData) {
//     const isOrganization = basicInfo.organ_flag === '1';
    
//     if (isOrganization) {
//       return `
//         <h2 class="section-title">客户基本信息</h2>
//         <table class="info-table">
//           <tr><th>客户名称</th><td>${basicInfo.client_name || '-'}</td></tr>
//           <tr><th>机构标识</th><td>${basicInfo.organ_flag === '1' ? '机构户' : '个人户'}</td></tr>
//           <tr><th>办公地址</th><td>${basicInfo.office_address || '-'}</td></tr>
//           <tr><th>注册国家</th><td>${this.formatDictValue(dictData, 'nationality', basicInfo.register_country)}</td></tr>
//           <tr><th>注册资本币种</th><td>${this.formatDictValue(dictData, 'register_money_type', basicInfo.register_money_type)}</td></tr>
//           <tr><th>注册资本</th><td>${basicInfo.register_fund || '-'}</td></tr>
//           <tr><th>行业分类</th><td>${this.formatDictValue(dictData, 'industry_type', basicInfo.industry_type)}</td></tr>
//           <tr><th>联系电话</th><td>${basicInfo.tel || '-'}</td></tr>
//           <tr><th>成立日期</th><td>${this.formatDate(basicInfo.setup_date)}</td></tr>
//           <tr><th>证件类型</th><td>${this.formatDictValue(dictData, 'id_type', basicInfo.id_type)}</td></tr>
//           <tr><th>证件号码</th><td>${basicInfo.id_no || '-'}</td></tr>
//           <tr><th>证件有效期</th><td>${this.formatDate(basicInfo.id_begindate)} 至 ${this.formatDate(basicInfo.id_enddate)}</td></tr>
//           <tr><th>经营范围</th><td>${basicInfo.busi_scope || '-'}</td></tr>
//           <tr><th>省份</th><td>${basicInfo.province || '-'}</td></tr>
//           <tr><th>城市</th><td>${basicInfo.city || '-'}</td></tr>
//           <tr><th>区县</th><td>${basicInfo.district || '-'}</td></tr>
//         </table>
//       `;
//     } else {
//       return `
//         <h2 class="section-title">客户基本信息</h2>
//         <table class="info-table">
//           <tr><th>客户名称</th><td>${basicInfo.client_name || '-'}</td></tr>
//           <tr><th>机构标识</th><td>${basicInfo.organ_flag === '1' ? '机构户' : '个人户'}</td></tr>
//           <tr><th>国籍</th><td>${this.formatDictValue(dictData, 'nationality', basicInfo.nationality)}</td></tr>
//           <tr><th>性别</th><td>${basicInfo.gender || '-'}</td></tr>
//           <tr><th>出生日期</th><td>${this.formatDate(basicInfo.birthday)}</td></tr>
//           <tr><th>职业分类</th><td>${this.formatDictValue(dictData, 'profession_code', basicInfo.profession_code)}</td></tr>
//           <tr><th>收入</th><td>${basicInfo.income || '-'}</td></tr>
//           <tr><th>证件类型</th><td>${this.formatDictValue(dictData, 'id_type', basicInfo.id_type)}</td></tr>
//           <tr><th>证件号码</th><td>${basicInfo.id_no || '-'}</td></tr>
//           <tr><th>证件有效期</th><td>${this.formatDate(basicInfo.id_begindate)} 至 ${this.formatDate(basicInfo.id_enddate)}</td></tr>
//           <tr><th>居住地址省份</th><td>${basicInfo.province1 || '-'}</td></tr>
//           <tr><th>居住地址城市</th><td>${basicInfo.city1 || '-'}</td></tr>
//           <tr><th>居住地址区县</th><td>${basicInfo.district1 || '-'}</td></tr>
//           <tr><th>通讯地址省份</th><td>${basicInfo.province2 || '-'}</td></tr>
//           <tr><th>通讯地址城市</th><td>${basicInfo.city2 || '-'}</td></tr>
//           <tr><th>通讯地址区县</th><td>${basicInfo.district2 || '-'}</td></tr>
//           <tr><th>详细地址</th><td>${basicInfo.address || '-'}</td></tr>
//         </table>
//       `;
//     }
//   }

//   /**
//    * 生成关联人信息表格
//    */
//   static generatePersonTable(title, personList, dictData) {
//     if (!personList || personList.length === 0) {
//       return `
//         <h2 class="section-title">${title}</h2>
//         <table class="person-table">
//           <tr class="empty-row"><td colspan="8">暂无数据</td></tr>
//         </table>
//       `;
//     }

//     const isOrganization = personList[0]?.organ_flag === '1';
    
//     // 根据机构/个人类型确定表格字段
//     let tableHeaders = '';
//     if (isOrganization) {
//       tableHeaders = `
//         <tr>
//           <th>关联人名称</th>
//           <th>证件类型</th>
//           <th>证件号码</th>
//           <th>证件有效期</th>
//           <th>国籍</th>
//           <th>受益所有人类型</th>
//           <th>持股比例</th>
//           <th>政府部门</th>
//         </tr>
//       `;
//     } else {
//       tableHeaders = `
//         <tr>
//           <th>关联人名称</th>
//           <th>证件类型</th>
//           <th>证件号码</th>
//           <th>证件有效期</th>
//           <th>国籍</th>
//           <th>出生日期</th>
//           <th>受益所有人类型</th>
//           <th>政府部门</th>
//         </tr>
//       `;
//     }

//     const tableRows = personList.map(person => {
//       if (isOrganization) {
//         return `
//           <tr>
//             <td>${person.related_name || '-'}</td>
//             <td>${this.formatDictValue(dictData, 'id_type', person.id_type)}</td>
//             <td>${person.id_no || '-'}</td>
//             <td>${this.formatDate(person.id_begindate)} 至 ${this.formatDate(person.id_enddate)}</td>
//             <td>${this.formatDictValue(dictData, 'nationality', person.nationality)}</td>
//             <td>${this.formatDictValue(dictData, 'beneficiary', person.beneficiary)}</td>
//             <td>${person.shareholding_retio || '-'}</td>
//             <td>${person.is_goverment_dept || '-'}</td>
//           </tr>
//         `;
//       } else {
//         return `
//           <tr>
//             <td>${person.related_name || '-'}</td>
//             <td>${this.formatDictValue(dictData, 'id_type', person.id_type)}</td>
//             <td>${person.id_no || '-'}</td>
//             <td>${this.formatDate(person.id_begindate)} 至 ${this.formatDate(person.id_enddate)}</td>
//             <td>${this.formatDictValue(dictData, 'nationality', person.nationality)}</td>
//             <td>${this.formatDate(person.birthday)}</td>
//             <td>${this.formatDictValue(dictData, 'beneficiary', person.beneficiary)}</td>
//             <td>${person.is_goverment_dept || '-'}</td>
//           </tr>
//         `;
//       }
//     }).join('');

//     return `
//       <h2 class="section-title">${title}</h2>
//       <table class="person-table">
//         ${tableHeaders}
//         ${tableRows}
//       </table>
//     `;
//   }

//   /**
//    * 生成业务关系信息表格
//    */
//   static generateBusinessRelationTable(basicInfo) {
//     return `
//       <h2 class="section-title">建立业务关系信息</h2>
//       <table class="info-table">
//         <tr><th>建立业务关系日期</th><td>${this.formatDate(basicInfo.associated_date)}</td></tr>
//       </table>
//     `;
//   }

//   /**
//    * 生成完整的PDF内容
//    */
//   static generatePDFContent(basicInfo, relatedInfo, dictData) {
//     return `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="utf-8">
//         <title>客户基本信息表</title>
//         ${pdfStyles}
//       </head>
//       <body>
//         <div class="pdf-container">
//           <h1 class="pdf-title">客户基本信息表</h1>
          
//           ${this.generateBasicInfoTable(basicInfo, dictData)}
          
//           ${this.generatePersonTable('法定代表人相关信息', relatedInfo.legalRep || [], dictData)}
          
//           ${this.generatePersonTable('控股股东相关信息', relatedInfo.controllingShareholder || [], dictData)}
          
//           ${this.generatePersonTable('实际控制人相关信息', relatedInfo.actualController || [], dictData)}
          
//           ${this.generatePersonTable('授权代表人相关信息', relatedInfo.authorizedRep || [], dictData)}
          
//           ${this.generatePersonTable('受益所有人相关信息', relatedInfo.beneficialOwner || [], dictData)}
          
//           ${this.generateBusinessRelationTable(basicInfo)}
//         </div>
//       </body>
//       </html>
//     `;
//   }

//   /**
//    * 导出PDF
//    */
//   static async exportToPDF(basicInfo, relatedInfo, dictData) {
//     try {
//       Modal.info({
//         title: '正在生成PDF',
//         content: (
//           <div style={{ textAlign: 'center', padding: '20px' }}>
//             <Spin size="large" />
//             <p style={{ marginTop: '15px' }}>PDF生成中，请稍候...</p>
//           </div>
//         ),
//         okButtonProps: { style: { display: 'none' } },
//         cancelButtonProps: { style: { display: 'none' } }
//       });

//       // 生成HTML内容
//       const htmlContent = this.generatePDFContent(basicInfo, relatedInfo, dictData);
      
//       // 创建临时容器
//       const container = document.createElement('div');
//       container.style.position = 'absolute';
//       container.style.left = '-9999px';
//       container.style.top = '-9999px';
//       container.style.width = '210mm'; // A4纸宽度
//       container.innerHTML = htmlContent;
//       document.body.appendChild(container);

//       // 等待字体加载
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // 生成canvas
//       const canvas = await html2canvas(container, {
//         scale: 2,
//         useCORS: true,
//         allowTaint: true,
//         backgroundColor: '#ffffff',
//         width: container.scrollWidth,
//         height: container.scrollHeight
//       });

//       // 生成PDF
//       const pdf = new jsPDF({
//         orientation: 'portrait',
//         unit: 'mm',
//         format: 'a4'
//       });

//       const imgData = canvas.toDataURL('image/jpeg', 0.95);
//       const imgWidth = 210; // A4宽度
//       const pageHeight = 297; // A4高度
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
//       let heightLeft = imgHeight;
//       let position = 0;

//       // 分页处理
//       pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
//       heightLeft -= pageHeight;

//       while (heightLeft >= 0) {
//         position = heightLeft - imgHeight;
//         pdf.addPage();
//         pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
//         heightLeft -= pageHeight;
//       }

//       // 清理临时容器
//       document.body.removeChild(container);
      
//       // 生成文件名
//       const fileName = `客户基本信息表_${basicInfo.client_name || basicInfo.client_id || 'unknown'}_${moment().format('YYYY-MM-DD')}.pdf`;
      
//       // 保存PDF
//       pdf.save(fileName);
      
//       Modal.destroyAll();
//       Modal.success({
//         title: '导出成功',
//         content: `PDF文件 "${fileName}" 已成功导出！`,
//         okText: '确定'
//       });

//     } catch (error) {
//       Modal.destroyAll();
//       Modal.error({
//         title: '导出失败',
//         content: `PDF导出过程中发生错误：${error.message}`,
//         okText: '确定'
//       });
//       console.error('PDF导出失败:', error);
//     }
//   }
// }

// export default PDFExporter;