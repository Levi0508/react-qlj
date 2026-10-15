import React, { Component } from 'react';
import globalSlots from './globalSlots';
import slotNames from './slotNames';

class Slot extends Component {

    static slotNames = slotNames

    static defaultProps = {
        name: null,
    }

    componentDidMount() {
        const { name } = this.props;
        globalSlots.registerSlot(name, this);
    }

    componentWillReceiveProps(nextProps) {
        const { name } = this.props;
        if (name !== nextProps.name) {
            globalSlots.unregisterSlot(name);
            globalSlots.registerSlot(nextProps.name, this);
        }
    }

    componentDidUpdate() {
        const { name } = this.props;
        globalSlots.updateSlot(name, this);
    }

    componentWillUnmount() {
        const { name } = this.props;
        globalSlots.unregisterSlot(name);
    }

    render() {
        return null;
    }
}

export default Slot;
