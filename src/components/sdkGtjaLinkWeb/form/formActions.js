const formActions = {

    /**
     * 校验表单,通过返回true,不通过返回错误信息字符串
     */
    async checkForm({ payload }, { getState, setState, dispatch }) {
        const { formRef } = getState();
        if (!formRef.current) {
            return '未找到表单';
        }

        const uncheckedFields = await formRef.current.callSync('check');
        if (Array.isArray(uncheckedFields) && uncheckedFields.length) {
            return uncheckedFields.map(n => n.message);
            // return '请完善申请单';
        }

        return true;
    },

    /**
     * 由具体继承flowBase的model来重写提交表单的方法
     * 将formValues保存并提交表单方法
     * 通过返回true,不通过返回错误信息字符串
     */
    async submitForm({ payload }, { getState, setState, dispatch }) {
        const { formRef, piid } = getState();
        const {type, } = payload;
        if(formRef.current) {
            const result = await formRef.current.callSync('submit', { type, piid });
            if(Array.isArray(result) && result.length > 0) {
                return '请完善申请单';
            }
            if(typeof result === 'string' || typeof result === 'boolean') {
                return result;
            }
            return JSON.stringify(result);
        }
        return '未找到表单';
    },

    /**
     * 由具体继承flowBase的model来重写提交成功之后的方法
     * 返回true时，将执行默认方法（关闭或者刷新页面）
     */
     async completeTaskAfter({ payload }, { getState, setState, dispatch }) {
        const { formRef, piid } = getState();
        if(formRef.current) {
            const result = await formRef.current.call('completeTaskAfter', payload);
            if(result === false) return false;
            return true;
        }
        return true;
    },
};

export default formActions;
