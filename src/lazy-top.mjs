import { binarySearch, insertAt  } from './utilities.mjs'

export class LazyTop {
    constructor(title, limit, metric, filter) {
        this.title = title
        this.entries = []
        this.mininum = null
        this.limit = limit
        this.metric = metric
        this.filter = filter
    }

    checkEntry(entry) {
        let metric = entry[this.metric]
        if (this.filter && this.filter(metric) == false) {
            return
        }
        if (this.mininum && this.mininum > metric) {
            return
        }
        let result = binarySearch(this.entries, entry => metric - entry.metric)
        let insertIndex = 0
        if (result.index != null) {
            if (result.result >= 0) {
                insertIndex = result.index
            } else {
                if (result.index == this.entries.length - 1) {
                    if (this.entries.length != this.limit) {
                        this.entries.push({metric, entry})
                    }
                    return
                }
                insertIndex = result.index + 1
            }
            insertAt(this.entries, insertIndex, {metric, entry}, this.limit)
        } else {
            this.entries.push({metric, entry})
        }
        if (this.limit) {
            if (this.entries.length == this.limit) {
                this.mininum = this.entries[this.entries.length - 1].metric
            } else {
                this.mininum = null
            }
        }
    }
}