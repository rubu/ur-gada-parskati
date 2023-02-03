import { open } from 'node:fs/promises'
import { once } from 'events'
import '../utilities.mjs'

export class NaiveCsvReader {
    constructor(path, options = { separator: ';', smartSplit: true}) {
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
            let values = this.options.smartSplit ? line.smartSplit(this.options.separator) : line.split(this.options.separator)
            if (lineIndex == 0) {
                // skip empty lines until we get a header line
                if (line.length == 0) {
                    return
                }
                keys = values
            } else {
                if (keys.length != values.length) {
                    console.error(`csv value/column count mismatch (${values.length} vs ${keys.length}) in file ${this.path}, line ${lineIndex}: ${line}`)
                } else {
                    const entry = Object.fromEntries(keys.map((key, index)=> [key, values[index]]))
                    this._entries.push(entry)
                }
            }
            lineIndex++
        })
        await once(readLineInterface, 'close')
    }

    get entries() {
        return this._entries
    }
}