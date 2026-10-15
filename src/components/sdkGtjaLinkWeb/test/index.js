import React from 'react';

import LinkFlow from '../flow/LinkFlow';
import TestDispatcher from './testDispatcher';

class Test extends React.Component {

    componentDidMount() {
        console.log('Test.componentDidMount')
    }

    render() {
        return (
            <LinkFlow>
                <TestDispatcher />
            </LinkFlow>
        );
    }
    
}

export default (Test);
