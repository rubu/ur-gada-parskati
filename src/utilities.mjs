export function binarySearch(array, callback) {
    let start = 0, end = array.length - 1, index = null, value = null, result
    while (start <= end) {
        index = Math.floor((end + start) / 2)
        result = callback(array[index])
        if (result == 0) {
            value = array[index]
            break;
        } else if (result < 0) {
            start = index + 1
        } else if (result > 0) {
            end = index - 1
        }
    }
    return {
        index,
        value,
        result
    }
}

export function insertAt(array, index, value, limit) {
    const end = (limit && array.length < limit ? array.length + 1: limit) - 1
    if (index > end) {
        throw new Error(`insertion position ${index} is outside array bounds [0..${end}]`)
    }
    if (limit &&  array.length > limit) {
        array.splice(limit, array.length - limit + 1)
    }
    for (let position = end; position > index; --position) {
        array[position] = array[position - 1]
    }
    array[index] = value
}

String.prototype.smartSplit = function(separator) {
    let items = [], item = ''
    let closeQuotes = false, isEscapedQuote = false
    let index = 0
    for (; index < this.length; ++index) {
        const character = this[index]
        if (closeQuotes) {
            if (character == '"' && isEscapedQuote == false) {
                if (index < this.length - 1 && this[index+1] == '"') {
                    isEscapedQuote = true
                    continue
                } else {
                    closeQuotes = false
                }
            } else {
                item += character
            }
        } else {
            if (character == '"') {
                closeQuotes = true
            } else if (character == separator) {
                items.push(item)
                item = ''
            } else {
                item += character
            }
        }
        isEscapedQuote = false
    }
    items.push(item)
    return items
}

export function parseNumberWithSpaces(text) {
    return parseFloat(text.split(/\s+/).join(''))
}

export function safeDivide(dividend, divisor) {
    if (divisor == 0) {
        return dividend >= 0 ? +Infinity : -Infinity
    }
    const result = dividend / divisor
    return isNaN(result) ? null : result
}