
const formActions = {

    /**
     * 校验表单,通过返回false,不通过返回错误信息字符串
     */
    async checkForm({ payload }, { getState, setState, dispatch }) {
        // const { formRef } = getState();
        // if (!formRef || !formRef.current) {
        //     message.warn('系统未获得表单对象', formRef);
        //     return false;
        // }

        // const uncheckedFields = formRef.current.call('check');
        // if (Array.isArray(uncheckedFields) && uncheckedFields.length) {
        //     message.warn(`表单校验不通过:${uncheckedFields.map(n => n.message).join()}`);
        //     return false;
        // }

        // return true;
        return true;
    },

    /**
     * 由具体继承flowBase的model来重写提交表单的方法
     * 将formValues保存并提交表单方法
     * 表单校验通过时返回true，不通过时返回错误信息字符串
     */
    async submitForm({ payload }, { getState, setState, dispatch }) {
        // const { formRef, piid } = getState();
        // return formRef.current.callSync('submit', { piid });
        return true;    // 表单校验通过时返回null，不通过时返回错误信息字符串
    },

    /**
     * 由具体继承flowBase的model来重写提交成功之后的方法
     * 返回true时，将执行默认方法（关闭或者刷新页面）
     */
    async completeTaskAfter({ payload }, { getState, setState, dispatch }) {
        // const { formRef, piid } = getState();
        // return formRef.current.callSync('submit', { piid });
        return true;    // 若想继续执行默认方法，返回true
    },
}

export default formActions;
