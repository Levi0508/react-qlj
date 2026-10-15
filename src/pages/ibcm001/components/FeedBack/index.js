/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-11-25 17:56:25
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-11-26 08:52:27
 * @FilePath: \ibcm-flow-ui\src\pages\ibcm001\componens\fileManage\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Checkbox, Col, DatePicker, Form, Icon, Input, Radio, Row, Select, Tooltip, Button, Space, Popconfirm, message, Modal, Card } from 'antd';
import React from 'react';

function FeedBack({ feedback = {}, dictData = {} }) {

    /**
     * 格式化字典数据 - 参考参考文件中的 formatDictMap 方法
     * @param {string} dictType - 字典类型
     * @param {string} key - 键值
     * @returns {string} 格式化后的值
     */
    const formatDictMap = (dictType, key) => {
        const dict = dictData[`${dictType}_list`] || [];
        const item = dict.find(item => item.k === key);
        return item ? item.v : '-';
    };

    return (
        <Card className="box-card" id="feedbackResult" title="反馈结果">
            <Form layout="vertical" style={{ padding: '20px' }}>
                <Form.Item label="风险名单筛查">
                    {feedback.screenName || '-'}
                </Form.Item>
                <Form.Item label="问题描述（如有）">
                    {feedback.problem_desc || '-'}
                </Form.Item>
                <Form.Item label="风险等级">
                    {feedback.gradeName || formatDictMap('grade_value_list',feedback.gradeValue) || '-'}
                </Form.Item>
            </Form>
        </Card>
    );
}

export default FeedBack;
