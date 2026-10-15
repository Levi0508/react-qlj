import React from 'react';
import _ from 'lodash';

import { withFlowContext } from '../../LinkFlowContext';

import serialNumIcon from '../../../assets/flow/serialNum.png';

class SerialNum extends React.PureComponent {

    state = {

    }

    render() {
        const {
            serialNum,
            ...restProps
        } = this.props;
        if(!serialNum) return <div {..._.pick(restProps, ['style', 'className'])} />;
        return (
            <div {..._.pick(restProps, ['style', 'className'])}>
                <img src={serialNumIcon} style={{marginRight: 8}} />
                {serialNum}
            </div>
        );
    }
}

export default withFlowContext(SerialNum, [
    'serialNum',
]);
