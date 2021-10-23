function wrap(value, minimum, maximum){
    const range = maximum - minimum;
    return value < minimum ?
            minimum + range :
            value >= maximum ?
            value - range :
            value;
}

function toggle(bool){
    let newVal;
    switch(typeof bool){
        case 'number': newVal = bool === 0 ? 1 : 0; break;
        case 'boolean': newVal = bool === false ? true : false; break;
    }
    return newVal;
}