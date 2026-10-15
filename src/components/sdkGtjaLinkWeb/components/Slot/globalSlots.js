const listeners = {

};

const slots = {

};

window.globalSlots = {
    listeners,
    slots,
};

const globalSlots = {
    registerListener: (name, callback) => {
        if(!name || typeof callback !== 'function') return;
        listeners[name] = callback;
        if(slots[name]) {
            callback(slots[name]);
        }
    },
    unregisterListener: (name) => {
        if(!name) return;
        delete listeners[name];
    },
    registerSlot: (name, slot) => {
        if(!name) return;
        slots[name] = slot;
        if(typeof listeners[name] === 'function') {
            listeners[name](slot);
        }
    },
    unregisterSlot: (name) => {
        if(!name) return;
        delete slots[name];
        if(typeof listeners[name] === 'function') {
            listeners[name](null);
        }
    },
};

export default globalSlots;
