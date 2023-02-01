import { stat } from 'fs/promises'

export class CsvDataSource {
    constructor(localPath, remotePath, options = null) {
        this.localPath = localPath
        this.remotePath = remotePath
        this.options = options
    }

    async initialize() {
        let localFileStats = await stat(this.localPath)
        if (localFileStats) {
            let response = await fetch(this.remotePath, { method: 'HEAD'})
            if (response) {
                const lastModifiedHeader = response.headers.get('last-modified')
                let lastModified = lastModifiedHeader ? (new Date(lastModifiedHeader)).getTime() : null
                if (lastModified && localFileStats.mtimeMs > lastModified) {
                    if (this?.options?.debug) {
                        console.debug(`local csv file ${this.localPath} is newer (last modified: ${lastModified}) than the remote resource ${this.remotePath} (last modified ${localFileStats.mtimeMs})`)
                    }
                } else {
                    if (this?.options?.debug) {
                        console.debug(`will refetch csv file ${this.localPath} from ${this.remotePath}`)
                    }
                }
            }
        }
    }

    get path() {
        return this.localPath
    }

    static async create(localPath, remotePath) {
        let csvDataSource = new CsvDataSource(localPath, remotePath)
        await csvDataSource.initialize()
        return csvDataSource
    }
}