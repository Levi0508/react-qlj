import React from 'react';

import utils from '../../../utils/utils';
import './styles.less';

export default (props) => {
    const { style, children } = props;
    return (
        <div
            style={style}
        >
            <div className={utils.getClassName('groupTitle', props)}>
                {children}
            </div>
        </div>
    )
}
