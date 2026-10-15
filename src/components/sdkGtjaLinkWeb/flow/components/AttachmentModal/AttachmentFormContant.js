import React, { useEffect } from 'react'
import { Upload, Button, Input, Row, Col, Divider, Select, message } from 'antd'
const { Option } = Select;
const AttachmentFormContant = ({ onChangeForm, formData, isDivider = true, uploadProps }) => {
    const { uploadFileName, description, attachmentType, setUploadFileName, setDescription, setAttachmentType } = formData
    return (
        <>
            <Row gutter={16}>
                <Col span={8}>
                    <Upload {...uploadProps} onChange={info => onChangeForm(info.file.name, setUploadFileName)}>
                        <Button>选择文件</Button>{
                            uploadFileName ? <span style={{ paddingLeft: '10px', color: 'rgba(0,0,0,0.85)' }}>{uploadFileName}</span> : <span style={{ paddingLeft: '10px', color: 'rgba(0,0,0,0.2)' }}>暂未选择文件</span>
                        }
                    </Upload>
                </Col>
                <Col span={12}>
                    <span style={{ paddingRight: '20px' }}>附件描述:</span>
                    <Input onChange={e => onChangeForm(e.target.value, setDescription)} value={description} style={{ width: 'calc(100% - 100px)' }} placeholder="请输入附件描述" />
                </Col>
                <Col span={4}>
                    <Select onChange={values => onChangeForm(values, setAttachmentType)} defaultValue={attachmentType} style={{ width: '100%' }}>
                        <Option key='普通附件' value="普通附件">普通附件</Option>
                    </Select>
                </Col>
            </Row>
            {isDivider ? <Divider dashed /> : <></>}
        </>
    )
}

export default AttachmentFormContant