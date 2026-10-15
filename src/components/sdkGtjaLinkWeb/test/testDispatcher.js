import React from 'react';

import LinkFlow from '../flow/LinkFlow';
import {withFlowContext} from '../flow/LinkFlowContext';

class TestDispatcher extends React.Component {

    componentDidMount() {
        console.log('TestDispatcher.componentDidMount', this.props)
        const {
            dispatch,
        } = this.props;
        setTimeout(() => {
            dispatch({
                type: 'test'
            });
        }, 3000);
    }

    render() {
        const {
            title,
        } = this.props;
        return title || 'test dispatcher';
    }
    
}

export default withFlowContext(TestDispatcher);
