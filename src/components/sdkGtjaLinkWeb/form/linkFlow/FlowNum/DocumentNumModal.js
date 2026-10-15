import React from 'react';
import { Button, Input, Select, Modal, Col, Row } from 'antd';
import linkRequest from '../../../utils/linkRequest';

import FormBaseComponent from '../../reactframework/FormBaseComponent';
import FormSelect from '../../reactframework/FormSelect';
import FormLabel from '../../reactframework/FormLabel';

class DocumentNum extends FormBaseComponent {

    static defaultProps = {
        arg: "{ labelname: '文号', field: '', flowoption: {piid:'',tiid:'',flowCode:''}}",
    }

    state = {
        selectedDocument: null,
        documentStr: "",
        distributeDocument: null, // 已经分配的
        documentData: [],
        optionsNums: [],
        missingNums: [],
    };

    componentDidMount() {
        if (this.props.onRef)
            this.props.onRef(this, null);

        this.__getDocumentData();
    }

    __getDocumentData = () => {
        const {
            flowoption
        } = this.props.arg;
        let param = _.pick(flowoption, ["ruleType"]);
        if (!param.ruleType) param.ruleType = "0";

        if (flowoption.ruleCode) {
            param.ruleCodes = flowoption.ruleCode.split(',');
        } else {
            param.flowCode = flowoption.flowCode;
        }

        let promises = [linkRequest("FLOW_DOCNUMBER_Q0002", param)];
        const piid = _.get(flowoption, "piid", "");
        if (piid) {
            let qparam = _.pick(flowoption, ["piid", "tiid", "ruleCode", "ruleType"]);
            if (!qparam.ruleType) qparam.ruleType = "0";
            promises.push(linkRequest("FLOW_DOCNUMBER_Q0006", qparam));
        }
        Promise.all(promises).then(values => {
            var serverDocumentData = null;
            if (values[0].State === 0 && values[0].Data && values[0].Data.length > 0) {
                serverDocumentData = values[0].Data;
            }
            if (serverDocumentData === null) return;
            if (values.length > 1) { // 如果有piid，那就先检查是否已经分配
                if (values[1].State === 0 && values[1].Data && values[1].Data.length === 1) {
                    return this.setState({ distributeDocument: values[1].Data[0] }, () => {
                        this.__initDocumentData(serverDocumentData);
                    })
                }
            }
            this.__initDocumentData(serverDocumentData);
        });
    }
    __getMonth=()=>{
       return new Date().getMonth() < 9 ? `0${new Date().getMonth()+1}` : `${new Date().getMonth() + 1}`
    }
    __initDocumentData = (data) => {
        var selectedDocument = null;
        var documentData = [];
        if (data.length > 0) {
            documentData = data;
            selectedDocument = { ruleCode: documentData[0].ruleCode };
            if (documentData[0].docYear) { // 年份
                // 如果arg有年份，以arg年份为准
                selectedDocument.year = _.get(this.props.arg, "flowoption.year", ((new Date()).getFullYear()).toString());
            }
            if (documentData[0].docMonth) {
                selectedDocument.month = _.get(this.props.arg, "flowoption.month", this.__getMonth());
            }
        }
        this.setState({ documentData, selectedDocument }, () => {
            this.__getNums();
        });
    }

    __getNums = () => {
        const {
            selectedDocument,
            distributeDocument,
        } = this.state;
        const {
            flowoption
        } = this.props.arg;

        const piid = _.get(flowoption, "piid", "");

        const param = _.extend({ piid }, selectedDocument);

        Promise.all([
            linkRequest("FLOW_DOCNUMBER_Q0003", param),
            linkRequest("FLOW_DOCNUMBER_Q0004", param)
        ]).then(values => {
            if (values && values.length == 2 && values[0].State === 0 && values[1].State === 0) {
                const missingNums = !_.isArray(values[1].Data) ? [] : values[1].Data.filter((v, i) => i >= values[1].Data.length - 5);
                const currNum = values[0].Data;

                let optionsNums = [];
                if (distributeDocument) { // 已经分配过的话，优先是原来已经分配的
                    optionsNums.push(distributeDocument.docSn);
                    selectedDocument.sn = distributeDocument.docSn;
                } else {
                    selectedDocument.sn = currNum;
                }

                const optionsNumLength = optionsNums.length;
                for (let i = 0; i < 5 - optionsNumLength; i++) {
                    optionsNums.push(i + currNum);
                }
                this.setState({ selectedDocument, optionsNums, missingNums }, () => {
                    this.__previewDocumentNum();
                });
            }
        });
    }

    __previewDocumentNum = () => {
        const {
            selectedDocument,
        } = this.state;

        const {
            flowoption
        } = this.props.arg;

        const piid = _.get(flowoption, "piid", "");

        const param = {
            ruleCode: selectedDocument.ruleCode,
            year: selectedDocument.year,
            month: selectedDocument.month,
            sn: selectedDocument.sn,
            piid,
        };

        linkRequest("FLOW_DOCNUMBER_Q0005", param).then((data) => {
            if (data.State === 0) {
                this.setState({ documentStr: data.Data });
            }
        });
    }

    _getValue() {
        const {
            field
        } = this.props.arg;
        const {
            documentStr,
            selectedDocument,
            distributeDocument,// 如果这个不是null，那就说明没有变更
        } = this.state;

        if (_.isEmpty(documentStr) || distributeDocument !== null) {
            return null;
        }
        return { field, value: documentStr, valueObj: selectedDocument };
    }

    render() {

        const {
            documentStr,
            selectedDocument,
            distributeDocument,
        } = this.state;

        let style = this.__getStyle();

        return <div className="queryform">
            <Row>
                <Col span={3}>
                    <div className="formfield">
                        <span className="fieldlabel" style={{ width: "80px" }}>文件字：</span>
                    </div>
                </Col>
                <Col span={14}>
                    {this.__renderDocument()}
                </Col>
                <Col span={3}>
                    <div className="formfield">
                        <span className="fieldlabel" style={{ width: "80px" }}>序号：</span>
                    </div>
                </Col>
                <Col span={4} style={{ lineHeight: "43px", height: "43px" }}>
                    {distributeDocument ? distributeDocument.docSn : (selectedDocument && selectedDocument.sn)}
                </Col>
            </Row>
            <Row>
                <Col span={3}>
                    <div className="formfield">
                        <span className="fieldlabel" style={{ width: "80px" }}>可选序号：</span>
                    </div>
                </Col>
                <Col span={14} style={{ flexWrap: "wrap", alignItems: "center" }}>
                    {this.__renderOptioinNum()}
                </Col>
                <Col span={3}>
                    <div className="formfield">
                        <span className="fieldlabel" style={{ width: "80px" }}>可选漏号：</span>
                    </div>
                </Col>
                <Col span={4} style={{ flexWrap: "wrap", alignItems: "center" }}>
                    {this.__renderMissingNum()}
                </Col>
            </Row>
            <Row>
                <Col span={3}>
                    <div className="formfield">
                        <span className="fieldlabel" style={{ width: "80px" }}>文件编号：</span>
                    </div>
                </Col>
                <Col span={21} style={{ lineHeight: "42px", height: "42px" }}>
                    {distributeDocument ? distributeDocument.docNumber : documentStr}
                </Col>
            </Row>
        </div>;
    }

    __getStyle = () => {
        // 主要是layout，如果layout
        const {
            layout, // 如果layout存在，并且layout.normal存在，则表示为固定布局
            style, // 如果未固定布局，需要根据style.width来进行计算宽度
            field
        } = this.props.arg;
        const {
            error,
            errormsg,
        } = this.state;

        let normal = _.get(this.props.arg, "layout.normal", "");
        let className = _.get(this.props.arg, "layout.grid.direction", "") === "v" ? "vformfield" : "formfield";
        if (error) {
            className += " has-error";
        }
        if (normal == "") { //为空表示不是固定布局
            let innerflex;
            if (field.indexOf("-") > 0) {
                innerflex = _.get(this.props.arg, "layout.grid.col.innerflex", 1)
            } else {
                innerflex = _.get(this.props.arg, "layout.grid.col.innerflex", 2)
            }
            return {
                contentstyle: { className: className },
                labelstyle: { paddingLeft: "10px" },
                style: {},
                groupstyle: { display: "flex" },
                controlstyle: { flex: innerflex },
                selectstyle: { width: 100 },
            };
        } else {
            let width = _.get(this.props.arg, "style.width", 230); // 默认为230
            if (this.props.arg.field.indexOf("-") > 0) {
                width = (width - 30) / 2;
            }
            return {
                contentstyle: { className: className },
                labelstyle: { paddingLeft: "10px" },
                style: {},
                groupstyle: {},
                controlstyle: { width: width + "px" },
                selectstyle: { width: 100 },
            };
        }
    }

    // 生成文件相关控件
    __renderDocument = () => {
        let controls = [];
        const {
            documentData,
            selectedDocument,
        } = this.state;

        const style = this.__getStyle();

        const documentArg = { labelname: "", require: true, field: "ruleCode", type: "select", displaytype: "select", data: documentData, style: { width: 150 }, defval: { index: 0 }, options: { textfield: "docWord", valuefield: "ruleCode" } };

        // 年份
        let yyyyData = [-1, 0, 1].map(i => {
            return { value: ((new Date()).getFullYear() + i).toString(), text: ((new Date()).getFullYear() + i).toString() };
        });
        let yyyyArg = null;
        if (selectedDocument && selectedDocument.year) {
            let yyyyindex = yyyyData.findIndex(y => y.value == selectedDocument.year);
            if (yyyyindex < 0) {
                yyyyData.push({ value: selectedDocument.year, text: selectedDocument.year });
            }
            yyyyArg = { labelname: "年度", require: true, field: "year", type: "select", displaytype: "select", data: yyyyData, defval: selectedDocument.year, style: { width: 70 }, labelStyle: { width: 60 } };
        } else {
            yyyyArg = { labelname: "年度", require: true, field: "year", type: "select", displaytype: "select", data: yyyyData, defval: { index: 1 }, style: { width: 70 }, labelStyle: { width: 60 } };
        }

        // 月份
        let mmData = [];
        for (let i = 1; i <= 12; i++) {
            if (i < 10) {
                mmData.push({ text: "0" + i.toString(), value: "0" + i.toString() })

            } else {
                mmData.push({ text: i.toString(), value: i.toString() })
            }
        };
        let mmArg = null;
        if (selectedDocument && selectedDocument.month) {
            mmArg = { labelname: "月度", require: true, field: "month", type: "select", displaytype: "select", data: mmData, defval: selectedDocument.month, style: { width: 60 }, labelStyle: { width: 60 } };
        } else {
            mmArg = { labelname: "月度", require: true, field: "month", type: "select", displaytype: "select", data: mmData, defval: this.__getMonth(), style: { width: 60 }, labelStyle: { width: 60 } };
        }

        return <>
            <FormSelect arg={documentArg} handleEvent={(event, field, value) => { this.__handleChangeDocument(event, field, value) }}></FormSelect>
            {selectedDocument && selectedDocument.year ?
                <FormSelect arg={yyyyArg} handleEvent={(event, field, value) => { this.__handleChangeDocument(event, field, value) }}></FormSelect>
                : null}
            {selectedDocument && selectedDocument.month ?
                <FormSelect arg={mmArg} handleEvent={(event, field, value) => { this.__handleChangeDocument(event, field, value) }}></FormSelect>
                : null
            }
        </>;
    }
    __renderOptioinNum = () => {
        const {
            optionsNums
        } = this.state;
        const that = this;
        return optionsNums.map(n => <a onClick={() => { this.__handleChangeCurrNum(n) }} style={{ marginRight: "5px" }}>{n}</a>);
    }
    __renderMissingNum = () => {
        const {
            missingNums
        } = this.state;
        const that = this;
        return missingNums.map(n => <a onClick={() => { this.__handleChangeCurrNum(n) }} style={{ marginRight: "5px" }}>{n}</a>);
    }
    __handleChangeCurrNum = (currNum) => {
        let {
            selectedDocument,
            distributeDocument,
        } = this.state;
        if (distributeDocument) { // 如果当前已分配，那需要先作废，再设置
            if (distributeDocument.docSn !== currNum) {
                Modal.confirm({
                    title: '作废文号？',
                    content: `确认作废"${distributeDocument.docNumber}"？`,
                    onOk: () => {
                        selectedDocument.oldsn = distributeDocument.docSn;
                        selectedDocument.sn = currNum;
                        this.setState({ distributeDocument: null, selectedDocument }, () => {
                            this.__previewDocumentNum();
                        });
                        // linkRequest("FLOW_DOCNUMBER_D0009", param).then((data) => {
                        //     if(data.State === 0) {
                        //         selectedDocument.sn = currNum;
                        //         this.setState({distributeDocument: null, selectedDocument}, () => {
                        //             this.__previewDocumentNum();
                        //         });
                        //     }
                        // });
                    }
                });
            }
        } else { //
            selectedDocument.sn = currNum;
            this.setState({ selectedDocument }, () => {
                this.__previewDocumentNum();
            });
        }
    }
    __handleChangeDocument = (event, field, value) => {
        let {
            selectedDocument,
        } = this.state;
        selectedDocument[field] = value;

        this.setState({ selectedDocument }, () => {
            this.__getNums();
        })
    }
}

export default DocumentNum;