import React from 'react';

import { withFlowContext } from '../../LinkFlowContext';

class Comp extends React.Component {

    state = {

    }

    render() {
        return (
            <div>

            </div>
        );
    }
}

export default withFlowContext(Comp, []);
