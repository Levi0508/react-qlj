import React from 'react';
import _ from 'lodash';
import globalSlots from './globalSlots';
import slotNames from './slotNames';

// class SlotContent extends React.Component {

//     static slotNames = slotNames
    
//     state = {
//         content: null,
//     }

//     // constructor(props) {
//     //     super(props);
//     //     const {name} = this.props;
//     //     globalSlots.registerListener(name, (content) => this.setState({content}));
//     // }

//     componentDidMount() {
//         const {name} = this.props;
//         globalSlots.registerListener(name, this.handleUpdateContent);
//     }

//     componentWillReceiveProps(nextProps) {
//         const {name} = this.props;
//         if(name !== nextProps.name) {
//             globalSlots.unregisterListener(name);
//             globalSlots.registerListener(nextProps.name, this.handleUpdateContent);
//         }
//     }

//     componentWillUnmount() {
//         const {name} = this.props;
//         globalSlots.unregisterListener(name);
//     }

//     handleUpdateContent = (event, content) => {
//         const {content: oldContent} = this.state;
//         if(oldContent !== content) {
//             this.setState({content});
//         }
//     }

//     render() {
//         const {children} = this.props;
//         const {content} = this.state;
//         return _.get(content, 'props.children') || children || null;
//     }
// }

class SlotContent extends React.Component {

    static slotNames = slotNames

    render() {
        const {content, children} = this.props;
        return content || children || null;
    }
}

export default SlotContent;
