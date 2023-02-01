import test from 'node:test'
import assert from 'node:assert'

import { binarySearch, insertAt } from '../src/utilities.mjs'

test('binary search with result', () => {
    let array = [1, 2, 3, 4, 5, 6]
    let result = binarySearch(array, (value) => value - 4)
    assert.deepStrictEqual(result, {value: 4, index: 3, result: 0})
    result = binarySearch(array, (value) => value - 6)
    assert.deepStrictEqual(result, {value: 6, index: 5, result: 0})
})

test('binary search without result', () => {
    let array = [1, 3, 5, 7, 9, 11]
    let result = binarySearch(array, (value) => value - 4)
    assert.deepStrictEqual(result, {value: null, index: 1, result: -1})
    result = binarySearch(array, (value) => value - 6)
    assert.deepStrictEqual(result, {value: null, index: 3, result: 1})
});

test('insert at position', () => {
    let array = [1, 3, 5]
    const limit = 4
    insertAt(array, 2, 4, limit)
    assert.deepStrictEqual(array, [1,3,4,5])
    insertAt(array, 3, 6, limit)
    assert.deepStrictEqual(array, [1,3,4,6])
    insertAt(array, 0, 0, limit)
    assert.deepStrictEqual(array, [0,1,3,4])
    insertAt(array, 3, 7, limit)
    assert.deepStrictEqual(array, [0,1,3,7])
    insertAt(array, 3, 4, limit)
    assert.deepStrictEqual(array, [0,1,3,4])
    insertAt(array, 4, 5)
    assert.deepStrictEqual(array, [0,1,3,4,5])
});
  