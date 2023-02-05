import { NaiveCsvReader } from './csv/naive-csv-reader.mjs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

let financialStatementTypes = []

await (async () => {
    let financialStatementCsvReader = new NaiveCsvReader(join(__dirname, '..', 'data', 'financial_statements.csv'))
    await financialStatementCsvReader.read()
    financialStatementCsvReader.entries.forEach(entry => {
        const financialStatementType = entry.source_type
        if (financialStatementType && financialStatementTypes.indexOf(financialStatementType) == -1) {
            financialStatementTypes.push(financialStatementType)
        }
    })
})()

console.log(financialStatementTypes)
