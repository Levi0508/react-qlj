import React, { useState, useEffect } from 'react'
import { Form, Input, Select, Divider } from 'antd'
import styles from './style.less'

const { Option } = Select
const { TextArea } = Input;

const WrapFromContent = ({ options, dataSource }, formRef) => {
    const [reportMsg, setReportMsg] = useState(dataSource.reportMsg || '')
    const [option, setOption] = useState(dataSource.option || '')
    const layout = {
        labelCol: { span: 3 },
        wrapperCol: { span: 21 },
    };
    const sendALLValues = () => {
        return { reportMsg, option }
    }
    const OptionsList = options.map((value, index) => (<Option key={index} value={value}>{value}</Option>))

    useEffect(() => {
        // console.log(props);
    })
    return (
        <>
        <Form
            ref={formRef}
            sendALLValues={sendALLValues}
            {...layout}
            labelAlign='left'
            name="errorReport"
        >
            <Form.Item
                label="内容"
                name="content"
                className={styles.content}
            >
                <p>{dataSource.content}</p>
            </Form.Item>
            <Divider dashed />
            <Form.Item
                label="意见"
                name="options"
            >
                <Select value={option} onChange={value => setOption(value)} placeholder='请选择'>
                    {/* <Option value="lucy">Lucy</Option> */}
                    {OptionsList}
                </Select>
            </Form.Item>

            <Form.Item
                label="详情"
                name="reportMsg"
            >
                <TextArea onChange={e => setReportMsg(e.target.value)} placeholder='请输入错误详情……' value={reportMsg} autoSize={{ maxRows: 4, minRows: 4 }} />
            </Form.Item>
        </Form>
        </>
    );
};


export default React.forwardRef(WrapFromContent)
