import { Card, Form, DatePicker, Input, Row, Col } from 'antd';
import React from 'react';
import moment from 'moment';

function BusinessRelation({ basicInfo, editable = false, form, organ_flag }) {
    // 使用传入的 basicInfo 数据
    const businessRelationData = {
        associated_date: basicInfo.associatedDate || basicInfo.associated_date || '',      // 建立业务关系日期
        remark: basicInfo.remark || '' // 备注信息
    };

    // 根据客户类型确定声明内容
    const isOrganization = organ_flag === '1';
    const declarationText = isOrganization
        ? `本机构保证所提供资料的真实性、准确性、完整性、有效性，并对其承担责任；
如上述内容发生变更时将及时以书面方式通知贵公司，如因为不能及时完成变更由此产生的一切后果将由本机构承担。<br/><br/>

机构盖章：`
        : `本人保证前述所填信息以及所提供资料的真实性、准确性、完整性、有效性，并对其承担责任；
如上述内容发生变更时将及时以书面方式通知贵公司，如因为不能及时完成变更由此产生的一切后果将由本人承担。<br/><br/>
签名：`;

    return (
        <Card
            id="businessRelation"
            title=""
            style={{
                marginTop: '20px',
                scrollMarginTop: '290px'
            }}
        >
            {/* 声明内容 */}
            <div style={{
                padding: '16px 20px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '13px',
                lineHeight: '1.8',
                color: '#333'
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>声明：</div>
                <div dangerouslySetInnerHTML={{ __html: declarationText }} />
            </div>

            <Form layout="vertical" style={{ border: 'none', padding: '20px' }}>
                <Row gutter={20}>
                    <Col span={8}>
                        <Form.Item label="建立业务关系日期">
                            {form.getFieldDecorator('associated_date', {
                                initialValue: businessRelationData.associated_date ? moment(businessRelationData.associated_date) : null
                            })(
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="YYYY-MM-DD"
                                    disabled={true}
                                    placeholder="请选择日期"
                                />
                            )}
                        </Form.Item>
                    </Col>
                </Row>

                <Row>
                    <Col span={24}>
                        <Form.Item label="备注">
                            {form.getFieldDecorator('business_remark', {
                                initialValue: businessRelationData.remark || ''
                            })(
                                <Input.TextArea
                                    rows={4}
                                    placeholder="请输入备注"
                                    disabled={!editable}
                                />
                            )}
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Card>
    );
}

export default BusinessRelation;