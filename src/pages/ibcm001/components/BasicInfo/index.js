import { Checkbox, Col, DatePicker, Form, Icon, Input, Radio, Row, Select, Tooltip, Button, Popconfirm, message, Modal, Card, Table } from 'antd';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import React, { useState, useEffect } from 'react';
import moment from 'moment';
import styles from './index.module.less';
import dataManager from '../../utils/dataManager';
import services from '../../services/index';
import useFilePreviewWindow from '@/hooks/useFilePreviewWindow';

const ResizeableTitle = (props) => {
    const { onResize, width, ...restProps } = props;
    if (!width) {
        return <th {...restProps} />;
    }
    return (
        <Resizable
            width={width}
            height={0}
            onResize={onResize}
            draggableOpts={{ enableUserSelectHack: false }}
        >
            <th {...restProps} />
        </Resizable>
    );
};

function BasicInfo({ basicInfo, dictData, clientId, editable = false, form, attachmentUpdateTime = 0, isSpecial = '0', curNode = {} }) {
    // 格式化数据字典显示
    const formatDictMap = (dictType, key) => {
        const dict = dictData[dictType] || [];
        const item = dict.find(item => item.k === key);
        return item ? item.v : '-';
    };

    // 内部维护的isSpecial状态，用于动态响应表单值变化
    const [currentIsSpecial, setCurrentIsSpecial] = useState(isSpecial);

    const [attachmentColumnWidths, setAttachmentColumnWidths] = useState({
        name: 280,
        extension: 120,
        create_by: 140,
        create_time: 180,
        action: 120
    });

    const handleAttachmentColumnResize = (columnKey) => (e, { size }) => {
        setAttachmentColumnWidths(prev => ({
            ...prev,
            [columnKey]: size.width
        }));
    };

    const attachmentTableComponents = {
        header: {
            cell: ResizeableTitle,
        },
    };

    useEffect(() => {
        const styleId = 'basic-info-attachment-resize-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                .basic-info-attachment-table .ant-table-thead > tr > th {
                    position: relative;
                }
                .basic-info-attachment-table .react-resizable {
                    position: relative;
                    background-clip: padding-box;
                }
                .basic-info-attachment-table .react-resizable-handle {
                    position: absolute;
                    right: -5px;
                    bottom: 0;
                    z-index: 1;
                    width: 10px;
                    height: 100%;
                    cursor: col-resize;
                    background-image: none;
                }
                .basic-info-attachment-table .react-resizable-handle::after {
                    content: '';
                    position: absolute;
                    right: 4px;
                    top: 20%;
                    height: 60%;
                    width: 2px;
                    background: #d9d9d9;
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    // 监听表单中is_special字段的变化

    // 根据反洗钱特殊情况判断字段是否必填（用于显示星号）
    // currentIsSpecial === '1' 时，客户基本信息不做必填校验
    // currentIsSpecial === '0' 时，客户基本信息全部必填
    const isFieldRequired = () => {
        return currentIsSpecial === '0';
    };

    // 千分位格式化金额 - 保留n位小数
    const formatMoney = (s, n) => {
        if (!s && s !== 0) return '';
        let str = String(s);
        let cleaned = str.replace(/[^\d\.]/g, "") // 移除所有非数字、非小数点的字符
            .replace(/\.{2,}/g, '.') // 多个小数点合并为一个
            .replace(/^\./, ""); // 移除开头的小数点

        if (!cleaned) return "";
        let num = parseFloat(cleaned);
        if (isNaN(num)) return "";
        let fixedNum = num.toFixed(n);
        let [integerPart, decimalPart] = fixedNum.split('.');
        let integerWithComma = integerPart.replace(/(?=(\B)(\d{3})+$)/g, ',');
        return decimalPart ? `${integerWithComma}.${decimalPart}` : integerWithComma;
    };

    // 详细地址状态
    const [officeAddressDetail, setOfficeAddressDetail] = useState(basicInfo.office_address || '');

    // 注册资本金失去焦点时格式化为千分位
    const handleRegisterFundBlur = (e) => {
        const value = e.target.value;
        if (!value) return;
        const formatted = formatMoney(value, 4);
        // 更新显示值为格式化后的值（带千分位）
        form.setFieldsValue({ register_fund: formatted });
    };

    // 注册资本金获得焦点时显示原始值（去掉千分位，方便编辑）
    const handleRegisterFundFocus = (e) => {
        const value = e.target.value;
        if (!value) return;
        // 去掉逗号，方便用户编辑
        const rawValue = value.replace(/,/g, '');
        form.setFieldsValue({ register_fund: rawValue });
    };

    // 格式化地址
    const formatAddress = (province, city, district, address) => {
        const provinceName = province//formatDictMap('nationality_list', province);
        const cityName = city//formatDictMap('nationality_list', city);
        const districtName = district//formatDictMap('nationality_list', district);
        return `${provinceName || ''}${cityName || ''}${districtName || ''}${address || '-'}`;
    };

    const isOrganization = basicInfo.organ_flag === '1';
    const [attachmentList, setAttachmentList] = useState([]);
    const [loading, setLoading] = useState(false);

    // 省市区相关状态
    const [provinceOptions, setProvinceOptions] = useState([]);
    const [cityOptions, setCityOptions] = useState([]);
    const [districtOptions, setDistrictOptions] = useState([]);
    // 个人户地址相关状态（证件地址和联系地址）
    const [cityOptions1, setCityOptions1] = useState([]);
    const [districtOptions1, setDistrictOptions1] = useState([]);
    const [cityOptions2, setCityOptions2] = useState([]);
    const [districtOptions2, setDistrictOptions2] = useState([]);
    const [province, setProvince] = useState(basicInfo.province || '');
    const [city, setCity] = useState(basicInfo.city || '');
    const [district, setDistrict] = useState(basicInfo.district || '');

    // 个人户地址相关状态 - 注意接口返回的字段名：province1/city1/district1(证件地址)、province2/city2/district2(联系地址)
    const [contactProvince, setContactProvince] = useState(basicInfo.province2 || basicInfo.contact_province || '');
    const [contactCity, setContactCity] = useState(basicInfo.city2 || basicInfo.contact_city || '');
    const [contactDistrict, setContactDistrict] = useState(basicInfo.district2 || basicInfo.contact_district || '');
    const [idProvince, setIdProvince] = useState(basicInfo.province1 || basicInfo.id_province || '');
    const [idCity, setIdCity] = useState(basicInfo.city1 || basicInfo.id_city || '');
    const [idDistrict, setIdDistrict] = useState(basicInfo.district1 || basicInfo.id_district || '');

    // 地址中文名称状态（用于提交时传参）- 接口返回的就是中文名称，直接使用
    const [provinceName, setProvinceName] = useState(basicInfo.province || '');
    const [cityName, setCityName] = useState(basicInfo.city || '');
    const [districtName, setDistrictName] = useState(basicInfo.district || '');
    const [contactProvinceName, setContactProvinceName] = useState(basicInfo.province2 || basicInfo.contact_province || '');
    const [contactCityName, setContactCityName] = useState(basicInfo.city2 || basicInfo.contact_city || '');
    const [contactDistrictName, setContactDistrictName] = useState(basicInfo.district2 || basicInfo.contact_district || '');
    const [idProvinceName, setIdProvinceName] = useState(basicInfo.province1 || basicInfo.id_province || '');
    const [idCityName, setIdCityName] = useState(basicInfo.city1 || basicInfo.id_city || '');
    const [idDistrictName, setIdDistrictName] = useState(basicInfo.district1 || basicInfo.id_district || '');

    const [addressLoading, setAddressLoading] = useState(false);

    // 预览相关状态
    const { previewLoading, handlePreview: openPreviewInWindow } = useFilePreviewWindow();

    // 获取省份数据
    const fetchProvinces = async () => {
        try {
            setAddressLoading(true);
            const response = await services.selectProvince();
            if (response && response.success && response.data) {
                const items = JSON.parse(response.data);
                const options = items.map(item => ({
                    value: item.areaCode,
                    label: item.areaName
                }));
                setProvinceOptions(options);
            }
        } catch (error) {
            console.error('获取省份数据失败:', error);
        } finally {
            setAddressLoading(false);
        }
    };

    // 获取城市数据（机构户）
    const fetchCities = async (provinceCode) => {
        try {
            setAddressLoading(true);
            const response = await services.selectCity({ proCode: provinceCode });
            if (response && response.success && response.data) {
                const items = JSON.parse(response.data);
                const options = items.map(item => ({
                    value: item.areaCode,
                    label: item.areaName
                }));
                setCityOptions(options);
            } else {
                setCityOptions([]);
            }
        } catch (error) {
            console.error('获取城市数据失败:', error);
            setCityOptions([]);
        } finally {
            setAddressLoading(false);
        }
    };

    // 获取区县数据（机构户）
    const fetchDistricts = async (provinceCode, cityCode) => {
        try {
            setAddressLoading(true);
            const response = await services.selectDistrict({
                proCode: provinceCode,
                areaCode: cityCode ? cityCode.substring(0, 4) : ''
            });
            if (response && response.success && response.data) {
                const items = JSON.parse(response.data);
                const options = items.map(item => ({
                    value: item.areaCode,
                    label: item.areaName
                }));
                setDistrictOptions(options);
            } else {
                setDistrictOptions([]);
            }
        } catch (error) {
            console.error('获取区县数据失败:', error);
            setDistrictOptions([]);
        } finally {
            setAddressLoading(false);
        }
    };

    // 获取城市数据（个人户证件地址）
    const fetchCities1 = async (provinceCode) => {
        try {
            setAddressLoading(true);
            const response = await services.selectCity({ proCode: provinceCode });
            if (response && response.success && response.data) {
                const items = JSON.parse(response.data);
                const options = items.map(item => ({
                    value: item.areaCode,
                    label: item.areaName
                }));
                setCityOptions1(options);
            } else {
                setCityOptions1([]);
            }
        } catch (error) {
            console.error('获取城市数据失败:', error);
            setCityOptions1([]);
        } finally {
            setAddressLoading(false);
        }
    };

    // 获取区县数据（个人户证件地址）
    const fetchDistricts1 = async (provinceCode, cityCode) => {
        try {
            setAddressLoading(true);
            const response = await services.selectDistrict({
                proCode: provinceCode,
                areaCode: cityCode ? cityCode.substring(0, 4) : ''  // 使用完整的6位城市编码
            });
            if (response && response.success && response.data) {
                const items = JSON.parse(response.data);
                const options = items.map(item => ({
                    value: item.areaCode,
                    label: item.areaName
                }));
                setDistrictOptions1(options);
            } else {
                setDistrictOptions1([]);
            }
        } catch (error) {
            console.error('获取区县数据失败:', error);
            setDistrictOptions1([]);
        } finally {
            setAddressLoading(false);
        }
    };

    // 获取城市数据（个人户联系地址）
    const fetchCities2 = async (provinceCode) => {
        try {
            setAddressLoading(true);
            const response = await services.selectCity({ proCode: provinceCode });
            if (response && response.success && response.data) {
                const items = JSON.parse(response.data);
                const options = items.map(item => ({
                    value: item.areaCode,
                    label: item.areaName
                }));
                setCityOptions2(options);
            } else {
                setCityOptions2([]);
            }
        } catch (error) {
            console.error('获取城市数据失败:', error);
            setCityOptions2([]);
        } finally {
            setAddressLoading(false);
        }
    };

    // 获取区县数据（个人户联系地址）
    const fetchDistricts2 = async (provinceCode, cityCode) => {
        try {
            setAddressLoading(true);
            const response = await services.selectDistrict({
                proCode: provinceCode,
                areaCode: cityCode ? cityCode.substring(0, 4) : ''
            });
            if (response && response.success && response.data) {
                const items = JSON.parse(response.data);
                const options = items.map(item => ({
                    value: item.areaCode,
                    label: item.areaName
                }));
                setDistrictOptions2(options);
            } else {
                setDistrictOptions2([]);
            }
        } catch (error) {
            console.error('获取区县数据失败:', error);
            setDistrictOptions2([]);
        } finally {
            setAddressLoading(false);
        }
    };

    // 处理省份变化
    const handleProvinceChange = (value, option) => {
        setProvince(value);
        setProvinceName(option ? option.props.children : ''); // 存储中文名称
        setCity('');
        setDistrict('');
        setCityName('');
        setDistrictName('');
        setCityOptions([]);
        setDistrictOptions([]);
        if (value) {
            fetchCities(value);
        }
    };

    // 处理城市变化
    const handleCityChange = (value, option) => {
        setCity(value);
        setCityName(option ? option.props.children : ''); // 存储中文名称
        setDistrict('');
        setDistrictName('');
        setDistrictOptions([]);
        if (value && province) {
            fetchDistricts(province, value);
        }
    };

    // 处理区县变化
    const handleDistrictChange = (value, option) => {
        setDistrict(value);
        setDistrictName(option ? option.props.children : ''); // 存储中文名称
    };

    // 处理个人户联系地址省份变化
    const handleContactProvinceChange = (value, option) => {
        setContactProvince(value);
        setContactProvinceName(option ? option.props.children : ''); // 存储中文名称
        setContactCity('');
        setContactDistrict('');
        setContactCityName('');
        setContactDistrictName('');
        setCityOptions2([]);
        setDistrictOptions2([]);
        if (value) {
            fetchCities2(value);
        }
    };

    // 处理个人户联系地址城市变化
    const handleContactCityChange = (value, option) => {
        setContactCity(value);
        setContactCityName(option ? option.props.children : ''); // 存储中文名称
        setContactDistrict('');
        setContactDistrictName('');
        setDistrictOptions2([]);
        if (value && contactProvince) {
            fetchDistricts2(contactProvince, value);
        }
    };

    // 处理个人户联系地址区县变化
    const handleContactDistrictChange = (value, option) => {
        setContactDistrict(value);
        setContactDistrictName(option ? option.props.children : ''); // 存储中文名称
    };

    // 处理个人户证件地址省份变化
    const handleIdProvinceChange = (value, option) => {
        setIdProvince(value);
        setIdProvinceName(option ? option.props.children : ''); // 存储中文名称
        setIdCity('');
        setIdDistrict('');
        setIdCityName('');
        setIdDistrictName('');
        setCityOptions1([]);
        setDistrictOptions1([]);
        if (value) {
            fetchCities1(value);
        }
    };

    // 处理个人户证件地址城市变化
    const handleIdCityChange = (value, option) => {
        setIdCity(value);
        setIdCityName(option ? option.props.children : ''); // 存储中文名称
        setIdDistrict('');
        setIdDistrictName('');
        setDistrictOptions1([]);
        if (value && idProvince) {
            fetchDistricts1(idProvince, value);
        }
    };

    // 处理个人户证件地址区县变化
    const handleIdDistrictChange = (value, option) => {
        setIdDistrict(value);
        setIdDistrictName(option ? option.props.children : ''); // 存储中文名称
    };

    // 初始化省份数据

    // 根据区域代码获取中文名称的辅助函数
    const getAddressNameByCode = (code, options) => {
        if (!code || !options || !options.length) return code || '';
        const item = options.find(opt => opt.value === code);
        return item ? item.label : code;
    };

    // 暴露地址代码转名称的方法给全局使用（用于提交时转换）

    // 当省份变化时，获取城市数据

    // 当城市变化时，获取区县数据

    // 机构户：当 options 加载完成后，更新地址名称（处理初始化数据）



    // 个人户联系地址数据初始化


    // 个人户证件地址数据初始化


    // 个人户联系地址：当 options 加载完成后，更新地址名称（处理初始化数据）



    // 个人户证件地址：当 options 加载完成后，更新地址名称（处理初始化数据）



    // 获取附件数据 - 参考FileManage的方式

    // 下载附件
    const handleDownload = async (file) => {
        // 验证文件信息
        if (!file || !file.id) {
            message.error('文件信息不完整，无法下载');
            return;
        }

        // 显示加载状态
        const hideLoading = message.loading(`正在下载: ${file.name}.${file.extension}`, 0);

        try {
            // 构建完整文件名
            const fullFileName = file.extension
                ? `${file.name}.${file.extension}`
                : file.name;

            // 使用服务中的下载方法，传递文件名和ID
            const result = await services.downloadFile(fullFileName, file.id);
            hideLoading();

            if (result && result.success) {
                message.success(`下载开始: ${fullFileName}`);
            } else {
                message.success(`下载已开始: ${fullFileName}`);
            }
        } catch (error) {
            hideLoading();
            message.error(`下载失败: ${error.message || '未知错误'}`);
        }

    };

    // 预览附件（在独立的浏览器窗口打开）
    const handlePreview = (file) => {
        openPreviewInWindow(file, async (f) => {
            const fileTypeNo = isOrganization ? '1,2,21,22' : '1,2';
            const fileName = `${f.name}.${f.extension}`;
            const result = await services.previewFile({
                id: f.id,
                clientId: clientId,
                fileTypeNo: fileTypeNo,
                fileName: fileName,
                extension: f.extension
            });
            if (result && result.success && result.data && result.data.previewUrl) {
                return result.data.previewUrl;
            }
            return null;
        });
    };

    // 附件表格列定义（支持拖拽调整列宽）
    const attachmentColumns = [
        {
            title: '附件名称',
            dataIndex: 'name',
            key: 'name',
            width: attachmentColumnWidths.name,
            sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
            render: (text) => text || '-',
            onHeaderCell: (column) => ({
                width: column.width,
                onResize: handleAttachmentColumnResize('name'),
            }),
        },
        {
            title: '附件类型',
            dataIndex: 'extension',
            key: 'extension',
            width: attachmentColumnWidths.extension,
            sorter: (a, b) => (a.extension || '').localeCompare(b.extension || ''),
            render: (text) => text || '-',
            onHeaderCell: (column) => ({
                width: column.width,
                onResize: handleAttachmentColumnResize('extension'),
            }),
        },
        {
            title: '上传人',
            dataIndex: 'create_by',
            key: 'create_by',
            width: attachmentColumnWidths.create_by,
            sorter: (a, b) => (a.create_by || '').localeCompare(b.create_by || ''),
            render: (text) => text || '-',
            onHeaderCell: (column) => ({
                width: column.width,
                onResize: handleAttachmentColumnResize('create_by'),
            }),
        },
        {
            title: '上传时间',
            dataIndex: 'create_time',
            key: 'create_time',
            width: attachmentColumnWidths.create_time,
            sorter: (a, b) => (a.create_time || '').localeCompare(b.create_time || ''),
            render: (text) => text || '-',
            onHeaderCell: (column) => ({
                width: column.width,
                onResize: handleAttachmentColumnResize('create_time'),
            }),
        },
        {
            title: '操作',
            key: 'action',
            width: attachmentColumnWidths.action,
            render: (_, record) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => handleDownload(record)}
                        style={{ padding: '0 4px', color: '#1890ff' }}
                    >
                        下载
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => handlePreview(record)}
                        style={{ padding: '0 4px', color: '#1890ff' }}
                        loading={previewLoading[record.id] || false}
                    >
                        预览
                    </Button>
                </div>
            ),
            onHeaderCell: (column) => ({
                width: column.width,
                onResize: handleAttachmentColumnResize('action'),
            }),
        }
    ];

    return (
        <Card className="box-card" id="basicInfo" title={
            <span>
                客户基本信息详情
                <span style={{ marginLeft: '25px', fontSize: '14px', color: '#999' }}>
                    客户状态：{ formatDictMap('client_status_list', basicInfo.client_status) || '-' }
                </span>
           </span>
        }>
            {isOrganization ? (
                // 机构户信息
                <Form layout="vertical" style={{ padding: '20px', border: 'none' }}>
                    <Row gutter={20}>
                        <Col span={8}>
                            <Form.Item label="客户名称" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('client_name', {
                                    initialValue: basicInfo.client_name || '',
                                    rules: [{ required: false }]
                                })(<Input disabled={!editable}/>)}
                            </Form.Item>
                        </Col>
                        <Col span={16}>
                            <Form.Item label="办公住所" required={isFieldRequired() && editable}>
                                <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
                                    <div style={{ display: 'flex', flex: 1, gap: '8px' }}>
                                        {form.getFieldDecorator('province', {
                                            initialValue: province,
                                            rules: [{ required: false }]
                                        })(
                                            <Select
                                                placeholder="请选择省份"
                                                allowClear
                                                showSearch
                                                optionFilterProp="children"
                                                loading={addressLoading}
                                                onChange={handleProvinceChange}
                                                disabled={!editable}
                                            >
                                                {provinceOptions.map(item => (
                                                    <Option key={item.value} value={item.value}>{item.label}</Option>
                                                ))}
                                            </Select>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flex: 1, gap: '8px' }}>
                                        {form.getFieldDecorator('city', {
                                            initialValue: city,
                                            rules: [{ required: false }]
                                        })(
                                            <Select
                                                placeholder="请选择城市"
                                                allowClear
                                                showSearch
                                                optionFilterProp="children"
                                                loading={addressLoading}
                                                onChange={handleCityChange}
                                                disabled={!province || !editable}
                                            >
                                                {cityOptions.map(item => (
                                                    <Option key={item.value} value={item.value}>{item.label}</Option>
                                                ))}
                                            </Select>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flex: 1, gap: '8px' }}>
                                        {form.getFieldDecorator('district', {
                                            initialValue: district,
                                            rules: [{ required: false }]
                                        })(
                                            <Select
                                                placeholder="请选择区县"
                                                allowClear
                                                showSearch
                                                optionFilterProp="children"
                                                loading={addressLoading}
                                                disabled={!city || !editable}
                                                onChange={handleDistrictChange}
                                            >
                                                {districtOptions.map(item => (
                                                    <Option key={item.value} value={item.value}>{item.label}</Option>
                                                ))}
                                            </Select>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flex: 2 }}>
                                        {form.getFieldDecorator('office_address', {
                                            initialValue: officeAddressDetail,
                                            rules: [{ required: false }]
                                        })(
                                            <Input
                                                placeholder="请输入详细地址"
                                                disabled={!editable}
                                            />
                                        )}
                                    </div>
                                </div>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={20}>
                        <Col span={8}>
                            <Form.Item label="注册国家地区" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('register_country', {
                                    initialValue: basicInfo.register_country,
                                    rules: [{ required: false }]
                                })(
                                    <Select disabled={!editable} allowClear showSearch optionFilterProp="children">
                                        {dictData.nationality_list && dictData.nationality_list.map(item => (
                                            <Option key={item.k} value={item.k}>{item.v}</Option>
                                        ))}
                                    </Select>
                                )}
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="注册资本币种" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('register_money_type', {
                                    initialValue: basicInfo.register_money_type,
                                    rules: [{ required: false }]
                                })(
                                    <Select disabled={!editable} allowClear showSearch optionFilterProp="children">
                                        {dictData.register_money_type_list && dictData.register_money_type_list.map(item => (
                                            <Option key={item.k} value={item.k}>{item.v}</Option>
                                        ))}
                                    </Select>
                                )}
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="注册资本金（单位：万元）" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('register_fund', {
                                    initialValue: basicInfo.register_fund ? formatMoney(basicInfo.register_fund, 4) : '',
                                    rules: [{ required: false }]
                                })(
                                    <Input
                                        disabled={!editable}
                                        placeholder="请输入金额(万元)"
                                        onBlur={handleRegisterFundBlur}
                                        onFocus={handleRegisterFundFocus}
                                    />
                                )}
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={20}>
                        <Col span={form.getFieldValue('industry_type') === '26' ? 4 : 8}>
                            <Form.Item label="行业分类" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('industry_type', {
                                    initialValue: basicInfo.industry_type,
                                    rules: [{ required: false }]
                                })(
                                    <Select disabled={!editable} allowClear showSearch optionFilterProp="children">
                                        {dictData.industry_type_list && dictData.industry_type_list.map(item => (
                                            <Option key={item.k} value={item.k}>{item.v}</Option>
                                        ))}
                                    </Select>
                                )}
                            </Form.Item>
                        </Col>
                        {form.getFieldValue('industry_type') === '26' && (
                            <Col span={4}>
                                <Form.Item label="行业注明" required={isFieldRequired() && editable}>
                                    {form.getFieldDecorator('industry_name', {
                                        initialValue: basicInfo.industry_name || '',
                                        rules: [{ 
                                            required: false,
                                            validator: (rule, value, callback) => {
                                                const industryType = form.getFieldValue('industry_type');
                                                if (industryType === '26' && !value) {
                                                    callback(new Error('请注明行业分类'));
                                                } else {
                                                    callback();
                                                }
                                            }
                                        }]
                                    })(<Input disabled={!editable} placeholder="请注明具体行业" />)}
                                </Form.Item>
                            </Col>
                        )}
                        <Col span={8}>
                            <Form.Item label="联系电话" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('tel', {
                                    initialValue: basicInfo.tel || '',
                                    rules: [{ required: false }]
                                })(<Input disabled={!editable} />)}
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="成立日期" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('setup_date', {
                                    initialValue: basicInfo.setup_date ? moment(basicInfo.setup_date) : null,
                                    rules: [{ required: false }]
                                })(
                                    <DatePicker
                                        disabled={!editable}
                                        style={{ width: '100%' }}
                                        format="YYYY-MM-DD"
                                    />
                                )}
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={20}>
                        <Col span={8}>
                            <Form.Item label="证照类型" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('id_type', {
                                    initialValue: basicInfo.id_type,
                                    rules: [{ required: false }]
                                })(
                                    <Select
                                        disabled={!editable}
                                        allowClear
                                        showSearch
                                        optionFilterProp="children"
                                    >
                                        {dictData.id_type_jg_list && dictData.id_type_jg_list.map(item => (
                                            <Option key={item.k} value={item.k}>{item.v}</Option>
                                        ))}
                                    </Select>
                                )}
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="证照号码" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('id_no', {
                                    initialValue: basicInfo.id_no || '',
                                    rules: [{ required: isFieldRequired() && editable, message: '请输入证照号码' }]
                                })(
                                    <Input disabled={!editable} />
                                )}
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="证照有效期" required={isFieldRequired() && editable}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {form.getFieldDecorator('id_begindate', {
                                        initialValue: basicInfo.id_begindate ? moment(basicInfo.id_begindate) : null,
                                        rules: [{ required: false }]
                                    })(
                                        <DatePicker
                                            disabled={!editable}
                                            style={{ flex: 1 }}
                                            format="YYYY-MM-DD"
                                        />
                                    )}
                                    <span>至</span>
                                    {form.getFieldDecorator('id_enddate', {
                                        initialValue: basicInfo.id_enddate ? moment(basicInfo.id_enddate) : null,
                                        rules: [{ required: false }]
                                    })(
                                        <DatePicker
                                            disabled={!editable}
                                            style={{ flex: 1 }}
                                            format="YYYY-MM-DD"
                                            renderExtraFooter={() => {
                                                // 创建一个ref来存储DatePicker实例
                                                let datePickerRef = null;

                                                return (
                                                    <div style={{ padding: '8px', textAlign: 'center' }}>
                                                        <a
                                                            onClick={() => {
                                                                const longTermDate = moment('2100-12-31');
                                                                form.setFieldsValue({
                                                                    id_enddate: longTermDate
                                                                });
                                                                // 手动触发change事件，确保表单验证
                                                                form.validateFields(['id_enddate']);

                                                                // 方法1：尝试关闭弹窗 - 查找antd的日历弹窗并模拟点击外部
                                                                const calendarPanel = document.querySelector('.ant-calendar-picker-container');
                                                                if (calendarPanel) {
                                                                    // 模拟点击弹窗外部来关闭
                                                                    const event = new MouseEvent('mousedown', {
                                                                        view: window,
                                                                        bubbles: true,
                                                                        cancelable: true
                                                                    });
                                                                    document.body.dispatchEvent(event);
                                                                }

                                                                // 方法2：查找并关闭所有打开的DatePicker
                                                                const datePickerInputs = document.querySelectorAll('.ant-calendar-picker-input');
                                                                datePickerInputs.forEach(input => {
                                                                    if (input.classList.contains('ant-calendar-picker-input-active')) {
                                                                        input.blur();
                                                                    }
                                                                });
                                                            }}
                                                            style={{ margin: '0 8px', color: '#0962c1', cursor: 'pointer' }}
                                                        >
                                                            长期
                                                        </a>
                                                    </div>
                                                );
                                            }}
                                        />
                                    )}
                                </div>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row>
                        <Col span={24}>
                            <Form.Item label="经营范围" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('busi_scope', {
                                    initialValue: basicInfo.busi_scope || '',
                                    rules: [{ required: false }]
                                })(<Input.TextArea disabled={!editable} rows={4} />)}
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            ) : (
                // 个人户信息
                <Form layout="vertical" style={{ padding: '20px', border: 'none' }}>
                    <Row gutter={20}>
                        <Col span={8}>
                            <Form.Item label="姓名" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('client_name', {
                                    initialValue: basicInfo.client_name || '',
                                    rules: [{ required: false }]
                                })(<Input disabled={!editable}/>)}
                            </Form.Item>
                        </Col>
                        <Col span={16}>
                            <Form.Item label="联系地址" required={isFieldRequired() && editable}>
                                <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
                                    <div style={{ flex: 3, display: 'flex', gap: '8px' }}>
                                        {form.getFieldDecorator('contact_province', {
                                            initialValue: basicInfo.province2 || basicInfo.contact_province,
                                            rules: [{ required: false }]
                                        })(
                                            <Select
                                                disabled={!editable}
                                                placeholder="省"
                                                style={{ flex: 1 }}
                                                showSearch
                                                optionFilterProp="children"
                                                optionLabelProp="children"
                                                filterOption={(input, option) => {
                                                    // 支持中文名称匹配
                                                    return option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                                                }}
                                                loading={addressLoading}
                                                onChange={handleContactProvinceChange}
                                            >
                                                {provinceOptions.map(item => (
                                                    <Option key={item.value} value={item.value}>{item.label}</Option>
                                                ))}
                                            </Select>
                                        )}
                                        {form.getFieldDecorator('contact_city', {
                                            initialValue: basicInfo.city2 || basicInfo.contact_city,
                                            rules: [{ required: false }]
                                        })(
                                            <Select
                                                disabled={!editable || !contactProvince}
                                                placeholder="市"
                                                style={{ flex: 1 }}
                                                showSearch
                                                optionFilterProp="children"
                                                optionLabelProp="children"
                                                filterOption={(input, option) => {
                                                    return option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                                                }}
                                                loading={addressLoading}
                                                onChange={handleContactCityChange}
                                            >
                                                {cityOptions2.map(item => (
                                                    <Option key={item.value} value={item.value}>{item.label}</Option>
                                                ))}
                                            </Select>
                                        )}
                                        {form.getFieldDecorator('contact_district', {
                                            initialValue: basicInfo.district2 || basicInfo.contact_district,
                                            rules: [{ required: false }]
                                        })(
                                            <Select
                                                disabled={!editable || !contactCity}
                                                placeholder="区"
                                                style={{ flex: 1 }}
                                                showSearch
                                                optionFilterProp="children"
                                                optionLabelProp="children"
                                                filterOption={(input, option) => {
                                                    return option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                                                }}
                                                loading={addressLoading}
                                                onChange={handleContactDistrictChange}
                                            >
                                                {districtOptions2.map(item => (
                                                    <Option key={item.value} value={item.value}>{item.label}</Option>
                                                ))}
                                            </Select>
                                        )}
                                    </div>
                                    {form.getFieldDecorator('address', {
                                        initialValue: basicInfo.address || '',
                                        rules: [{ required: false }]
                                    })(
                                        <Input disabled={!editable} placeholder="详细地址" style={{ flex: 2 }} />
                                    )}
                                </div>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={20}>
                        <Col span={8}>
                            <Form.Item label="国籍" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('nationality', {
                                    initialValue: basicInfo.nationality,
                                    rules: [{ required: false }]
                                })(
                                    <Select disabled={!editable} allowClear showSearch optionFilterProp="children">
                                        {dictData.nationality_list && dictData.nationality_list.map(item => (
                                            <Option key={item.k} value={item.k}>{item.v}</Option>
                                        ))}
                                    </Select>
                                )}
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="性别" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('gender', {
                                    initialValue: basicInfo.gender,
                                    rules: [{ required: false }]
                                })(
                                    <Radio.Group disabled={!editable}>
                                        <Radio value="1">男</Radio>
                                        <Radio value="2">女</Radio>
                                        <Radio value="3">未知</Radio>
                                    </Radio.Group>
                                )}
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="出生年月" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('birthday', {
                                    initialValue: basicInfo.birthday ? moment(basicInfo.birthday) : null,
                                    rules: [{ required: false }]
                                })(
                                    <DatePicker
                                        disabled={!editable}
                                        style={{ width: '100%' }}
                                        format="YYYY-MM-DD"
                                    />
                                )}
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={20}>
                        <Col span={8}>
                            <Form.Item label="联系电话" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('tel', {
                                    initialValue: basicInfo.tel || '',
                                    rules: [{ required: false }]
                                })(<Input disabled={!editable} />)}
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="年收入" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('income', {
                                    initialValue: basicInfo.income,
                                    rules: [{ required: false }]
                                })(
                                    <Select disabled={!editable} allowClear showSearch optionFilterProp="children">
                                        {dictData.year_income_list && dictData.year_income_list.map(item => (
                                            <Option key={item.k} value={item.k}>{item.v}</Option>
                                        ))}
                                    </Select>
                                )}
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="职业分类" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('profession_code', {
                                    initialValue: basicInfo.profession_code,
                                    rules: [{ required: false }]
                                })(
                                    <Select disabled={!editable} allowClear showSearch optionFilterProp="children">
                                        {dictData.profession_code_list && dictData.profession_code_list.map(item => (
                                            <Option key={item.k} value={item.k}>{item.v}</Option>
                                        ))}
                                    </Select>
                                )}
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={20}>
                        <Col span={8}>
                            <Form.Item label="证件类型" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('id_type', {
                                    initialValue: basicInfo.id_type,
                                    rules: [{ required: false }]
                                })(
                                    <Select
                                        disabled={!editable}
                                        allowClear
                                        showSearch
                                        optionFilterProp="children"
                                    >
                                        {dictData.id_type_gr_list && dictData.id_type_gr_list.map(item => (
                                            <Option key={item.k} value={item.k}>{item.v}</Option>
                                        ))}
                                    </Select>
                                )}
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="证件号码" required={isFieldRequired() && editable}>
                                {form.getFieldDecorator('id_no', {
                                    initialValue: basicInfo.id_no || '',
                                    rules: [{ required: isFieldRequired() && editable, message: '请输入证件号码' }]
                                })(
                                    <Input disabled={!editable} />
                                )}
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="证件有效期" required={isFieldRequired() && editable}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {form.getFieldDecorator('id_begindate', {
                                        initialValue: basicInfo.id_begindate ? moment(basicInfo.id_begindate) : null,
                                        rules: [{ required: false }]
                                    })(
                                        <DatePicker
                                            disabled={!editable}
                                            style={{ flex: 1 }}
                                            format="YYYY-MM-DD"
                                        />
                                    )}
                                    <span>至</span>
                                    {form.getFieldDecorator('id_enddate', {
                                        initialValue: basicInfo.id_enddate ? moment(basicInfo.id_enddate) : null,
                                        rules: [{ required: false }]
                                    })(
                                        <DatePicker
                                            disabled={!editable}
                                            style={{ flex: 1 }}
                                            format="YYYY-MM-DD"
                                            renderExtraFooter={() => {
                                                // 创建一个ref来存储DatePicker实例
                                                let datePickerRef = null;

                                                return (
                                                    <div style={{ padding: '8px', textAlign: 'center' }}>
                                                        <a
                                                            onClick={() => {
                                                                const longTermDate = moment('2100-12-31');
                                                                form.setFieldsValue({
                                                                    id_enddate: longTermDate
                                                                });
                                                                // 手动触发change事件，确保表单验证
                                                                form.validateFields(['id_enddate']);

                                                                // 方法1：尝试关闭弹窗 - 查找antd的日历弹窗并模拟点击外部
                                                                const calendarPanel = document.querySelector('.ant-calendar-picker-container');
                                                                if (calendarPanel) {
                                                                    // 模拟点击弹窗外部来关闭
                                                                    const event = new MouseEvent('mousedown', {
                                                                        view: window,
                                                                        bubbles: true,
                                                                        cancelable: true
                                                                    });
                                                                    document.body.dispatchEvent(event);
                                                                }

                                                                // 方法2：查找并关闭所有打开的DatePicker
                                                                const datePickerInputs = document.querySelectorAll('.ant-calendar-picker-input');
                                                                datePickerInputs.forEach(input => {
                                                                    if (input.classList.contains('ant-calendar-picker-input-active')) {
                                                                        input.blur();
                                                                    }
                                                                });
                                                            }}
                                                            style={{ margin: '0 8px', color: '#0962c1', cursor: 'pointer' }}
                                                        >
                                                            长期
                                                        </a>
                                                    </div>
                                                );
                                            }}
                                        />
                                    )}
                                </div>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={20}>
                        <Col span={24}>
                            <Form.Item label="证件地址" required={isFieldRequired() && editable}>
                                <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
                                    <div style={{ flex: 3, display: 'flex', gap: '8px' }}>
                                        {form.getFieldDecorator('id_province', {
                                            initialValue: basicInfo.province1 || basicInfo.id_province,
                                            rules: [{ required: false }]
                                        })(
                                            <Select
                                                disabled={!editable}
                                                placeholder="省"
                                                style={{ flex: 1 }}
                                                showSearch
                                                optionFilterProp="children"
                                                optionLabelProp="children"
                                                filterOption={(input, option) => {
                                                    return option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                                                }}
                                                loading={addressLoading}
                                                onChange={handleIdProvinceChange}
                                            >
                                                {provinceOptions.map(item => (
                                                    <Option key={item.value} value={item.value}>{item.label}</Option>
                                                ))}
                                            </Select>
                                        )}
                                        {form.getFieldDecorator('id_city', {
                                            initialValue: basicInfo.city1 || basicInfo.id_city,
                                            rules: [{ required: false }]
                                        })(
                                            <Select
                                                disabled={!editable || !idProvince}
                                                placeholder="市"
                                                style={{ flex: 1 }}
                                                showSearch
                                                optionFilterProp="children"
                                                optionLabelProp="children"
                                                filterOption={(input, option) => {
                                                    return option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                                                }}
                                                loading={addressLoading}
                                                onChange={handleIdCityChange}
                                            >
                                                {cityOptions1.map(item => (
                                                    <Option key={item.value} value={item.value}>{item.label}</Option>
                                                ))}
                                            </Select>
                                        )}
                                        {form.getFieldDecorator('id_district', {
                                            initialValue: basicInfo.district1 || basicInfo.id_district,
                                            rules: [{ required: false }]
                                        })(
                                            <Select
                                                disabled={!editable || !idCity}
                                                placeholder="区"
                                                style={{ flex: 1 }}
                                                showSearch
                                                optionFilterProp="children"
                                                optionLabelProp="children"
                                                filterOption={(input, option) => {
                                                    return option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                                                }}
                                                loading={addressLoading}
                                                onChange={handleIdDistrictChange}
                                            >
                                                {districtOptions1.map(item => (
                                                    <Option key={item.value} value={item.value}>{item.label}</Option>
                                                ))}
                                            </Select>
                                        )}
                                    </div>
                                    {form.getFieldDecorator('id_address', {
                                        initialValue: basicInfo.id_address || '',
                                        rules: [{ required: false }]
                                    })(
                                        <Input disabled={!editable} placeholder="详细地址" style={{ flex: 2 }} />
                                    )}
                                </div>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            )}

            {/* 附件信息表格 */}
            <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>附件信息&nbsp;
                    <Tooltip placement="right" title="请上传基本信息表签章版、客户营业执照复印件、客户公司章程复印件、在工商外部数据库（如“企查查”）查验的报告。">
                        <Icon type="question-circle" />
                    </Tooltip>
                </div>
                <Table
                    className="basic-info-attachment-table"
                    columns={attachmentColumns}
                    components={attachmentTableComponents}
                    dataSource={attachmentList}
                    rowKey="id"
                    pagination={false}
                    size="middle"
                    bordered={false}
                    loading={loading}
                    scroll={{ x: 840 }}
                    locale={{
                        emptyText: '暂无附件信息'
                    }}
                />
            </div>

            {/* 修复Antd 3.x图标显示问题的样式 */}
            <style jsx>{`
                
                /* 修复Antd 3.x图标显示问题 */
                .ant-btn .anticon {
                    display: inline-block;
                    font-style: normal;
                    font-weight: normal;
                    line-height: 1;
                    text-rendering: optimizeLegibility;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    font-family: anticon !important;
                }
                
                .ant-btn-icon-only {
                    min-width: 32px;
                    height: 32px;
                    padding: 0;
                    font-size: 16px;
                    border-radius: 4px;
                    display: inline-flex !important;
                    align-items: center;
                    justify-content: center;
                    vertical-align: middle;
                }
                
                .ant-btn-icon-only .anticon {
                    font-size: 14px !important;
                    line-height: 1 !important;
                    margin: 0 !important;
                    display: block !important;
                }
                
                .ant-btn-circle.ant-btn-icon-only {
                    border-radius: 50%;
                    min-width: 32px;
                    width: 32px;
                    height: 32px;
                }
                
                .ant-btn-sm.ant-btn-icon-only {
                    min-width: 24px;
                    height: 24px;
                    font-size: 14px;
                }
                
                .ant-btn-sm.ant-btn-icon-only .anticon {
                    font-size: 12px !important;
                }
                
                /* 确保图标字体正确加载 */
                @font-face {
                    font-family: 'anticon';
                    src: url('https://at.alicdn.com/t/font_148784_v4ggb6wrjmkotj4i.eot');
                    src: url('https://at.alicdn.com/t/font_148784_v4ggb6wrjmkotj4i.eot?#iefix') format('embedded-opentype'),
                         url('https://at.alicdn.com/t/font_148784_v4ggb6wrjmkotj4i.woff2') format('woff2'),
                         url('https://at.alicdn.com/t/font_148784_v4ggb6wrjmkotj4i.woff') format('woff'),
                         url('https://at.alicdn.com/t/font_148784_v4ggb6wrjmkotj4i.ttf') format('truetype'),
                         url('https://at.alicdn.com/t/font_148784_v4ggb6wrjmkotj4i.svg#iconfont') format('svg');
                }
            `}</style>

        </Card>
    );
}

export default BasicInfo;