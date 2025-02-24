const numPicker = (boolean) => {
    var num;
    if (boolean) {
        num = Math.floor(Math.random() * 9);
    } else {
        num = Math.floor(Math.random() * 74) + 48;
    }
    return num;
}

const idGenerator = (length, onlyNumBoolean) => {
    length = length || 12;
    var id = ""
    while (id.length < length) {
        var num = numPicker(onlyNumBoolean);
        while ((num > 57 && num < 65) || (num > 90 && num < 97)) num = numPicker();
        if (onlyNumBoolean) {
            id = id + num.toString();
        } else {
            id = id + String.fromCharCode(num);
        }
    }
    return id;
};

const today = new Date();
const oneYearFromNow = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());


module.exports = { idGenerator, today, oneYearFromNow };