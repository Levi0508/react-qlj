import React from 'react';
import { pick } from 'lodash';

export default function (Context) {
    return function (WrappedComponent, mapStateToProps = contextState => ({})) {

        let mapper = mapStateToProps;
        if (Array.isArray(mapStateToProps)) {
            // key数组方式注入stateProps，外带一个dispatch
            mapper = (state) => pick(state, [...mapStateToProps, 'dispatch']);
        } else if(typeof mapStateToProps === 'function') {
            // 方法方式注入stateProps，外带一个dispatch
            mapper = contextState => {
                const stateProps = mapStateToProps(contextState);
                stateProps.dispatch = contextState.dispatch;
                return stateProps;
            }
        }

        const InjectContext = props => {
            const { forwardRef, ...rest } = props;

            let refProp = {};

            if (WrappedComponent.prototype.isReactComponent) {
                refProp = {
                    ref: forwardRef,
                };
            } else {
                refProp = {
                    forwardRef,
                };
            }

            return (
                <Context.Consumer>
                    {context =>
                        <WrappedComponent {...refProp} {...(rest)} {...mapper(context)} />
                    }
                </Context.Consumer>
            );
        };

        return React.forwardRef((props, ref) => <InjectContext forwardRef={ref} {...props} />);
    };
}
