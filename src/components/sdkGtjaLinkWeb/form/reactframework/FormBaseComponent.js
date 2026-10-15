import React, { Component } from 'react';


class FormBaseComponent extends React.Component {
    constructor(props) {
        super(props)
    }
    handleEvent(e, event, field, value, text, object, arg) {
        if(e) {
            if(e.preventDefault) e.preventDefault();
        }
        if(this.props.handleEvent) {
            return this.props.handleEvent(event, field, value, text, object, arg);
        }
        return null;
    }
    call(func, value) {
        if(this["_" + func])
            return this["_" + func](value);
        return null;
    }
    _check() {
        return null;
    }
    render() {
        if(this.props.arg.control)
            return React.createElement(this.props.arg.control, this.props);
        else if(typeof(this.props.arg.type) == "string")
            return <this.props.arg.type {...this.props.arg}></this.props.arg.type>;
        else
            return null;
    }
}

export default FormBaseComponent