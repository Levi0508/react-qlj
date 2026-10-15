import React, { Component } from 'react';

class FormExtraLabel extends React.Component {
    constructor(props) {
        super(props)
    }
    render() {
        return <span style={{color:"red"}}>*</span>;
    }
}

export default FormExtraLabel