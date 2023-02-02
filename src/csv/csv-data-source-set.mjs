import { EventEmitter } from 'node:events'
import { join } from 'path'
import { stat,  readFile, writeFile } from 'fs/promises'
import { Readable } from 'node:stream'
import { finished } from 'stream/promises'
import { createWriteStream } from 'node:fs'
import { unlink } from 'node:fs/promises'

export class CsvDataSourceSet extends EventEmitter {
    constructor(basePath, csvDataSourceDefinitions) {
        super()
        this.basePath = basePath
        this.csvDataSourceDefinitions = csvDataSourceDefinitions
    }

    async load() {
        const cacheFilePath = join(this.basePath, 'cache.json')
        let cache = readFile(cacheFilePath).then(contents => JSON.parse(contents)).catch(() => null)
        const verifyCsvDataSource = async (csvDataSourceDefintion) => {
            let url = new URL(csvDataSourceDefintion.url)
            const filename = url.pathname.substring(url.pathname.lastIndexOf('/') + 1)
            const localPath = join(this.basePath, filename)
            let localFileStats = await stat(localPath).catch(() => null)
            let download = true, downloadSize
            if (localFileStats) {
                let response = await fetch(url, { method: 'HEAD'}).catch(() => null)
                let sizeMatches = false, modificationIsNewer = false
                if (response) {
                    cache[filename] = {}
                    const lastModifiedHeader = response.headers.get('last-modified')
                    if (lastModifiedHeader) {
                        cache[filename].lastModified = lastModifiedHeader
                        let lastModified = (new Date(lastModifiedHeader)).getTime()
                        if (lastModified && localFileStats.mtimeMs > lastModified) {
                            modificationIsNewer = true
                            if (this?.options?.debug) {
                                console.debug(`local csv file ${localPath} is newer (last modified: ${lastModified}) than the remote resource ${url} (last modified ${localFileStats.mtimeMs})`)
                            }
                        }
                    }
                    const eTagHeader = response.headers.get('etag')
                    if (eTagHeader) {
                        cache[filename].etag = eTagHeader
                    }
                    const contentRangeHeader = response.headers.get('content-range')
                    if (contentRangeHeader) {
                        downloadSize = parseInt(contentRangeHeader.substring(contentRangeHeader.lastIndexOf('/') + 1))
                        cache[filename].size = downloadSize
                        sizeMatches = downloadSize === localFileStats.size
                    }
                    download = modificationIsNewer === false || sizeMatches === false
                }
            }
            return {
                localPath,
                url,
                filename,
                download,
                downloadSize,
                unlinkLocalPath: localFileStats != null
            }
        }
        const downloadDataSource = (async ({localPath, url, filename, downloadSize, unlinkLocalPath}) => {
            if (unlinkLocalPath) {
                unlink(localPath)
            }
            const response = await fetch(url)
            let bytesDownloaded = 0
            const body = Readable.fromWeb(response.body)
            if (downloadSize) {
                let lastProgress = 0
                body.on('data', (data) => {
                    bytesDownloaded += data.length
                    let progress = (bytesDownloaded / downloadSize).toFixed(2)
                    if (progress - lastProgress > 0.01) {
                        this.emit('download-progress', { filename, progress })
                        lastProgress = progress
                    }
                })
            }
            const writeStream = createWriteStream(localPath)
            await finished(body.pipe(writeStream))
        })
        let result = {}
        let csvDataSourcesToDownload = []
        await Promise.all(this.csvDataSourceDefinitions.map(async (csvDataSourceDefinition) => {
            const csvDataSourceInfo = await verifyCsvDataSource(csvDataSourceDefinition)
            if (csvDataSourceInfo.download) {
                csvDataSourcesToDownload.push(csvDataSourceInfo)
            }
            result[csvDataSourceDefinition.name] = csvDataSourceInfo.localPath
        }))
        if (csvDataSourcesToDownload.length) {
            this.emit('download-list', csvDataSourcesToDownload)
        }
        await Promise.all(csvDataSourcesToDownload.map(csvDataSourcesToDownload => downloadDataSource(csvDataSourcesToDownload)))
        await writeFile(cacheFilePath, JSON.stringify(cache, null, 4))
        return result
    }
}