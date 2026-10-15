import _ from 'lodash';

import {
    FlowEvent,
} from '../constants';

import allActions from './';

class Dispatcher {

    getState = null;

    setState = null;

    setStateSilence = null;

    onError = null;

    actions = {};

    onBeforeDispatch = null;
    onAfterDispatch = null;

    constructor(getState, setState, setStateSilence, onError, onBeforeDispatch, onAfterDispatch) {
        this.getState = getState;
        this.setState = setState;
        this.setStateSilence = setStateSilence;
        this.onError = onError;
        this.onBeforeDispatch = onBeforeDispatch;
        this.onAfterDispatch = onAfterDispatch;

        // 初始化流程的actions
        Object.keys(allActions).forEach(key => {
            const actions = allActions[key];
            Object.keys(actions).forEach(type => {
                this.registerAction(type, actions[type]);
            });
        });
    }

    registerAction(type, action) {
        this.actions[type] = action;
    }

    dispatch = async (action) => {
        if (typeof action === 'string') {
            action = { type: action };
        }
        action = this.onBeforeDispatch(this, action) || action;
        const { type, payload } = action;
        try {
            let actionResult = this.actions[type](action, {
                getState: this.getState,
                setState: this.setState,
                setStateSilence: this.setStateSilence,
                dispatch: this.dispatch,
            });
            if (typeof actionResult === 'object' && typeof actionResult.then === 'function') {
                this.setState(({ loadings }) => ({   // 更新loadings会让页面重绘，使页面反应下降，先禁用loadings
                    loadings: {
                        ...loadings,
                        [type]: true,
                    }
                }));
                actionResult = await actionResult;
                this.setState(({ loadings }) => ({
                    loadings: {
                        ...loadings,
                        [type]: false,
                    }
                }));
            }
            actionResult = this.onAfterDispatch(this, action, actionResult) || actionResult;
            return actionResult;
        } catch (e) {
            if (typeof this.onError === 'function') {
                this.onError(e, type, payload);
            }
        }
    }
}

export default Dispatcher;
