
import React, { Component } from 'react';

import FormExtraLabel from '../reactframework/FormExtraLabel';
import FormLabel from '../reactframework/FormLabel';
import FormBaseComponent from '../reactframework/FormBaseComponent';
import { Tooltip, Icon } from 'antd';
import _ from 'lodash';

const TimeTabBlock = (props) => {
    return (
        <button
            onClick={props.onClick}
            style={{
                width: 50,
                height: 30,
                backgroundColor: props.selected ? "#00BFFF" : props.disabled ? '#DCDCDC' : 'white',
                margin: 5,
                border: '1px solid 	#A9A9A9',
                borderRadius: 4,
                opacity: props.disabled ? .5 : 1
            }}
            disabled={props.disabled}
        >
            <div>{props.time}</div>
        </button>
    );
};



class TimeLine extends FormBaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            error: false,
            errormsg: "",
            serverDataLoading: false,
            serverData: [],
            selectTimes: [],
            disTimes: [],
            startTime: '',
            endTime: '',
            times: [],
            defaultTimes: [],
            oldData: [],
        };
    }
    __renderTemplete = (style, children) => {
        const {
            error,
            errormsg,
        } = this.state;

        const {
            require,
            field,
            labelname,
            tip,
        } = this.props.arg;


        return <div data-field={field}
            className={style.contentstyle.className}
            draggable={this.props.draggable}
            onDragStart={(e) => this.props.onDragStart(e, this.props.arg)}
        >
            <FormLabel labelname={labelname} labelStyle={style.labelStyle} tip={tip}>
                {!!require && <FormExtraLabel></FormExtraLabel>}
            </FormLabel>
            <div className="fieldcontent">
                {children}
                {error ? <Tooltip title={errormsg}><Icon className="errormsg" style={{ color: "#FF0000" }} type="exclamation-circle" /></Tooltip> : null}
            </div>
        </div>;
    }
    __getStyle = () => { // 获取样式
        // 主要是layout，如果layout
        const {
            layout, // 如果layout存在，并且layout.normal存在，则表示为固定布局
            style, // 如果未固定布局，需要根据style.width来进行计算宽度
            field,
            labelStyle,
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
            let controlstyle;
            if (field.indexOf("-") > 0) {
                controlstyle = { innerflex: _.get(this.props.arg, "layout.grid.col.innerflex", 1) };
            } else {
                controlstyle = { innerflex: _.get(this.props.arg, "layout.grid.col.innerflex", 2) };
            }

            controlstyle.minWidth = _.get(this.props.arg, "style.minWidth", _.get(this.props.arg, "style.width", "120")) + "px";
            let width = _.get(this.props.arg, "style.width", null);
            if (width !== null) {
                controlstyle.width = width + "px";
            }

            return {
                contentstyle: { className: className },
                labelStyle: labelStyle,
                style: {},
                groupstyle: { display: "flex" },
                controlstyle
            };
        } else {
            let width = _.get(this.props.arg, "style.width", 230); // 默认为230
            if (this.props.arg.field.indexOf("-") > 0) {
                width = (width - 30) / 2;
            }
            return {
                contentstyle: { className: className },
                labelStyle: labelStyle,
                style: {},
                groupstyle: {},
                controlstyle: { width: width + "px" }
            };
        }
    }

    //页面刷新后调用
    _setValue(value) {
        if (value === undefined) return;
        this.setState({ startTime: value[0], endTime: value[1] })
        const { startTime, endTime } = this.state;

        if (startTime && endTime) {
            const { defaultTimes, selectTimes } = this.state;
            const newTimes = { ...defaultTimes };
            let started = false;
            for (const [time] of Object.entries(selectTimes)) {
                if (time === startTime) started = true;
                if (started) newTimes[time] = true;
                if (time === endTime) break;
                if (startTime === endTime) break;
            }
            this.setState({ times: newTimes });
        }


    }
    componentDidMount() {
        this.setState({ oldData: this.props.arg.data })
        if (this.props.onRef && this.props.arg.field) {
            this.props.onRef(this, this.props.arg.field);
        }

        if (this.props.arg.data) {
            this.setState({ oldData: this.props.arg.data });
        }
    }

    //兼容内核版本不到73，不支持fromEntries的问题
    fromEntries(arrArg) {
        // Map
        if (Object.prototype.toString.call(arrArg) === '[object Map]') {
            const resMap = {};
            for (const key of arrArg.keys()) {
                resMap[key] = arrArg.get(key);
            }
            return resMap;
        }
        // array
        if (Array.isArray(arrArg)) {
            const resArr = {}
            arrArg.map(([key, value]) => {
                resArr[key] = value
            })
            return resArr
        }
        throw 'Uncaught TypeError: argument is not iterable';
    }

    //选择日期或数据源改变后调用，生成时间条相关数据
    componentWillReceiveProps(nextProps) {
        const { data } = nextProps.arg;
        const { edit } = this.props;
        const { oldData, startTime, endTime } = this.state;
        let disTimes = {};
        let selectTimes = {};

        const flag = !!data && !_.isEqual(data, oldData);

        if (data && !_.isEqual(data, oldData) || flag) {
            this.setState({ oldData: data })
            let serverData = data[0];

            const res = serverData;
            if (res) {
                const sjdData = res.P_CURSOR_SJD; //删除无用项
                for (let i = 0; i < sjdData.length; i++) {
                    if (sjdData[i].FLAG == 1 && sjdData[i].ZT == 2) {
                        disTimes[`${sjdData[i].SJD}`] = false;
                    } else {
                        selectTimes[`${sjdData[i].SJD}`] = false;
                    }
                }
                let showTimes = Object.assign({}, disTimes, selectTimes);
                let showTimesSort = Object.entries(showTimes).sort(); //合并之后的对象排序
                if (!Object.fromEntries) Object.fromEntries = this.fromEntries;
                if (!_.isEmpty(showTimes)) {
                    showTimes = Object.fromEntries(showTimesSort); //将排序之后的新数组转换为对象
                    this.setState({ times: { ...showTimes }, defaultTimes: { ...showTimes } });
                }
                const disTimesSort = Object.entries(disTimes).sort();
                const selectTimesSort = Object.entries(selectTimes).sort();
                this.setState({ disTimes: Object.fromEntries(disTimesSort), selectTimes: Object.fromEntries(selectTimesSort) });
                // if (startTime && endTime) {
                //     const newTimes = { ...showTimes };
                //     let started = false;
                //     for (const [time] of Object.entries(Object.fromEntries(selectTimesSort))) {
                //         if (time === startTime) started = true;
                //         if (started) newTimes[time] = true;
                //         if (time === endTime) break;
                //     }
                //     this.setState({ times: newTimes })
                // }
                if (!edit) {
                    // const newTimes = { ...showTimes };
                    // let started = false;
                    // for (const [time] of Object.entries(showTimes)) {
                    //     if (time === startTime) started = true;
                    //     if (started) newTimes[time] = true;
                    //     if (time === endTime) break;
                    // }
                    // this.setState({ times: newTimes })
                    startTime && endTime && this.changeTimeLine(startTime, endTime, showTimes, showTimes);// 3-11
                } else {
                    startTime && endTime && this.changeTimeLine(startTime, endTime, showTimes, Object.fromEntries(selectTimesSort));
                }
            }else{
                this.setState({ disTimes: [], selectTimes: [],times:[],defaultTimes:[]});
            }
        }
    }

    changeTimeLine(startTime, endTime, showTimes, selectTimes) {
        const newTimes = { ...showTimes };
        let started = false;
        for (const [time] of Object.entries(selectTimes)) {
            if (time === startTime) started = true;
            if (started) newTimes[time] = true;
            if (time === endTime) break;
            if (startTime === endTime) break;
        }
        this.setState({ times: newTimes })
        return newTimes;
    }

    // 选择时间改变后调用
    componentWillUpdate(nextProps, nextState) {
        const { startTime, endTime, defaultTimes, selectTimes } = this.state;
        const { edit } = this.props;
        if (nextState.startTime !== startTime || nextState.endTime !== endTime) {
            if (nextState.startTime && nextState.endTime && edit) {
                // const newTimes = { ...defaultTimes };
                // let started = false;
                // for (const [time] of Object.entries(selectTimes)) {
                //     if (time === startTime) started = true;
                //     if (started) newTimes[time] = true;
                //     if (time === nextState.endTime) break;
                //     if (startTime === nextState.endTime) break;
                // }
                const newTimes = this.changeTimeLine(nextState.startTime, nextState.endTime, defaultTimes, selectTimes)
                this.setState({ times: newTimes }, () => {
                    super.handleEvent(null, { type: "change", source: this.props.arg.field, target: this.props.arg.field }, this.props.arg.field, { 'startTime': startTime, 'endTime': nextState.endTime });
                })
            } else if (nextState.startTime && edit) {
                this.setState({ times: { ...defaultTimes, [nextState.startTime]: true } }, () => {
                    super.handleEvent(null, { type: "change", source: this.props.arg.field, target: this.props.arg.field }, this.props.arg.field, { 'startTime': nextState.startTime });
                })

            }
        }
    }

    //页面保存的时候调用
    _getValue() {
        const {
            field,
        } = this.props.arg;
        let timeValue = [];
        const { startTime, endTime } = this.state;
        if (startTime === '' || endTime === '' || startTime === endTime) return null;
        if (field.indexOf("-") > 0) {//区间，但是分别绑定两个字段
            let fields = field.split("-");
            fields.forEach((item, index) => {
                if (typeof (fields[index]) != "undefined" && fields[index] !== null) {
                    if (startTime !== endTime) {
                        index === 0 ? timeValue.push({ field: fields[index], value: startTime }) : timeValue.push({ field: fields[index], value: endTime });
                    }

                }
            });
        }
        return timeValue;
    };

    __renderDisplay = () => {
        let style = this.__getStyle();
        const {

            startTime,
            endTime
        } = this.state;

        return this.__renderTemplete(style, <div className="displaycontent">{`${startTime}~${endTime}`}</div>);

    }

    //渲染时间条
    renderTimeLine = () => {
        let style = this.__getStyle();
        const { startTime, endTime, times, disTimes } = this.state;
        const { edit } = this.props;
        const disTimesArr = Object.keys(disTimes);

        return (
            this.__renderTemplete(style, <div style={{ display: "flex", flexWrap: 'wrap' }}>
                {Object.entries(times).map(([time, selected]) => {
                    let disabled = null;
                    if (disTimesArr.length > 0 && disTimesArr.includes(time)) {
                        disabled = true;
                    }



                    // 渲染每一个时间格
                    return (
                        <TimeTabBlock
                            time={time}
                            selected={selected}
                            key={time}
                            disabled={disabled}
                            onClick={() => {
                                if (startTime && endTime && edit) {
                                    this.setState({ startTime: time, endTime: '' });
                                } else if (startTime && edit) {
                                    this.setState({ endTime: time });
                                } else if (edit) {
                                    this.setState({ startTime: time });
                                }
                            }}
                        />)
                })}
            </div>
            )
        );
    }

    render() {
        let edit = _.get(this.props, "edit", true);
        return !edit ? this.__renderDisplay() : this.renderTimeLine(); //兼容移动端
        //  return this.renderTimeLine();3-11
    }


}


export default TimeLine;