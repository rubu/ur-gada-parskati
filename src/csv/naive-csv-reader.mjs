import { open } from 'node:fs/promises'
import { once } from 'events'

export class NaiveCsvReader {
    constructor(path, options = { separator: ';'}) {
        this.path = path
        this.options = options
    }

    async read() {
        const file = await open(this.path)
        let readLineInterface = file.readLines()
        let lineIndex = 0
        let keys = []
        this._entries = []
        readLineInterface.on('line', (line) => {
            let values = line.split(this.options.separator)
            if (lineIndex == 0) {
                keys = values
            } else {
                if (keys.length != values.length) {
                    throw new Error(`csv value/column count mismatch (${values.length} vs ${keys.length}) in file ${this.path}, line ${lineIndex}`)
                }
                const entry = Object.fromEntries(keys.map((key, index)=> [key, values[index]]))
                this._entries.push(entry)
            }
            lineIndex++
        })
        await once(readLineInterface, 'close')
    }

    get entries() {
        return this._entries
    }
}