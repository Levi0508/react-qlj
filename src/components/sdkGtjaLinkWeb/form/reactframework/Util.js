function checkAll(field, checklist, rule, value) {
    let message = checkLength(rule, value);
    if(message) checklist.add(message);

    message = checkPattern(rule, value);
    if(message) checklist.add(message);

    if(field.displaytype === "number") { // 如果是数字类型才去验证数字大小
        message = checkNumber(rule, value);
        if(message) checklist.add(message);
    }
    if(field.type === "data") { // 如果是日期类型去验证日期大小
        //todo：验证日期大小

        //todo：验证前后日期大小
    }
    return checklist;
}
function checkLength(rule, value) {
    if(value === null || value === undefined) return "";
    if(rule.maxlength != undefined && value.toString().length > (parseInt(rule.maxlength) || Number.MAX_VALUE)) {
        return `${rule.maxlengthMessage}${rule.maxlength}`;
    }
    if(rule.minlength != undefined && value.toString().length < (parseInt(rule.minlength) || 0)) {
        return `${rule.minlengthMessage}${rule.minlength}`;
    }
    return "";
}
function checkNumber(rule, value) {
    if(isNaN(value)) return "不是数字";

    if(rule.max !== undefined && parseFloat(value) > rule.max) {
        return `${rule.maxMessage}${rule.max}`;
    }
    if(rule.min !== undefined && parseFloat(value) < rule.min) {
        return `${rule.minMessage}${rule.min}`;
    }
    return "";
}
function checkPattern(rule, value) {
    if(!rule.pattern) return "";
    let r = new RegExp(rule.pattern);
    if(!r.test(value)) {
        return rule.patternMessage;
    }
    return "";
}
function checkDiff(rule, currIndex, values) {
    let currValue = parseFloat(values[currIndex]);
    let message = "";
    values.forEach((value, index) => {
        if(index < currIndex) {
            let bValue = parseFloat(value);
            if(bValue > currValue) {
                message = rule.diffMessage;
                return false;
            }
        }
    });
    return message;
}

function checkRequire(rule, value) {// 返回true标识通过，返回false标识不通过
    if(typeof(value) === "undefined" ||
        value === ""||
        value === null ||
        (Array.isArray(value) && value.length === 0)) {
            // 先获取必须的错误信息
            return rule.requireMessage;
    }
    return "";
}

function convertRule(field) {
    var convertRule = {};
    if(field.rules) {
        if(Array.isArray(field.rules) && field.rules.length > 0) { // 兼容老设置
            field.rules.forEach(rule => {
                [["require",`请输入${field.labelname}`],["diff", `${field.labelname}区间数据有误`],
                    ["min",`${field.labelname}需大于:`],["max",`${field.labelname}不能超过:`],
                    ["minlength",`${field.labelname}不低于:`],["maxlength",`${field.labelname}不能超过:`],
                    ["pattern",`${field.labelname}数据格式不正确`]].forEach((t) => {
                    if(rule[t[0]] !== undefined) {
                        convertRule[t[0]] = rule[t[0]];
                        convertRule[t[0] + "Message"] = rule.message || t[1];
                    }
                });
            });
            if(field.type === "select") {
                [["require",`请选择${field.labelname}`]].forEach((t) => {
                    if(rule[t[0]] !== undefined) {
                        convertRule[t[0]] = rule[t[0]];
                        convertRule[t[0] + "Message"] = rule.message || t[1];
                    }
                });
            }
        } else {
            convertRule = field.rules;
            [["require",`请输入${field.labelname}`],["diff", `${field.labelname}区间数据有误`],
                    ["min",`${field.labelname}需大于:`],["max",`${field.labelname}不能超过:`],
                    ["minlength",`${field.labelname}不低于:`],["maxlength",`${field.labelname}不能超过:`],
                    ["pattern",`${field.labelname}数据格式不正确`]].forEach((t) => {
                    if(convertRule[t[0]] !== undefined && !convertRule[t[0] + "Message"]) {
                        convertRule[t[0] + "Message"] = t[1];
                    }
            });
            if(field.type === "select") {
                [["require",`请选择${field.labelname}`]].forEach((t) => {
                    if(convertRule[t[0]] !== undefined && !convertRule[t[0] + "Message"]) {
                        convertRule[t[0] + "Message"] = t[1];
                    }
                });
            }

        }
    }
    if(field.require) {
        convertRule.require = field.require;
        convertRule.requireMessage = convertRule.requireMessage || (field.type === "select" ? `请选择${field.labelname}` : `请输入${field.labelname}`);
    }
    if(JSON.stringify(convertRule) !== '{}')
        return convertRule;
    return null;
}
// rules: { require: true, requireMessage: "请填写",
//          min: 1, max: 1000, minMessage: "低于最小值", maxMessage: "超过最大值",
//          diff: true, diffMessage: "前后数据异常",
//          minlength: 1, maxlength: 20, minlengthMessage: "长度不在区间内", maxlengthMessage: "长度不在区间内",
//          pattern: "[0-9]", patternMessage: "格式不正确"
//        }
// 不再建议使用[{require: true, message:"请填写"},
//              {min: 1, max: 10, message: "不在区间内"}]
export default function check (field, value) {
    var checklist = new Set();// 为了去除重复错误
    var rules = convertRule(field); // 为了兼容老设置
    if(rules === null) return null;

    // 判断必填
    if(!field.hidden && field.require) {
        let message = checkRequire(rules, value);
        if(message) {// 先判断一下值是否存在
            checklist.add(message);
        } else if(field.field.indexOf("-") > 0) {// 判断是否是数组形式
            let fieldArr=field.field.split("-");
            if(!Array.isArray(value) || value.length != fieldArr.length) {
                checklist.add("数据异常");
            }
            fieldArr.forEach((fieldname, index) => { // 遍历数据进行验证
                let message = checkRequire(rules, value[index]);
                if(message) {
                    checklist.add(message);
                    return false; //必填只需要判断一个就可以截至，否则会出现两条必填消息
                }
            });
        }
    }
    if(checklist.size > 0) return Array.from(checklist);

    // 依据rule进行判断
    if(rules) {
        if(field.field.indexOf("-") > 0) { // 如果是区间
            let filedArr=field.field.split("-");
            if(!Array.isArray(value) || value.length != filedArr.length) {
                checklist.add("数据不正确");
            }
            filedArr.forEach((fieldname, index) => { // 遍历数据进行验证
                checkAll(field, checklist, rules, value[index]);

                if(field.displaytype === "number" && index > 0 &&
                    (typeof(value[index]) !== "undefined" && value[index] !== "" && value[index] !== null) ) { // 如果是数字类型要验证前后大小
                    let message = checkDiff(rules, index, value);
                    if(message) checklist.add(message);
                }
            });
        } else {
            checkAll(field, checklist, rules, value);
        }
    }
    return Array.from(checklist);
}