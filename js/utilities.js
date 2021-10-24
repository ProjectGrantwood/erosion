function wrap(value, minimum, maximum){
    let wrappedValue = value;
    const range = maximum - minimum;
    while (wrappedValue < minimum) {
            wrappedValue += range;
    }
    while (wrappedValue > maximum) {
        wrappedValue -= range;
    }
    return wrappedValue;
}

function toggle(bool){
    let newVal;
    switch(typeof bool){
        case 'number': newVal = bool === 0 ? 1 : 0; break;
        case 'boolean': newVal = bool === false ? true : false; break;
    }
    return newVal;
}