import { NaiveCsvReader } from './csv/naive-csv-reader.mjs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

let entity_types = new Map()

await (async () => {
    let registerCsvReader = new NaiveCsvReader(join(__dirname, '..', 'data', 'register.csv'))
    await registerCsvReader.read()
    registerCsvReader.entries.forEach(entry => {
        if (!entity_types.get(entry.type)) {
            entity_types.set(entry.type, entry.type_text)
        }
    })
})()

for (const [key, value] of entity_types) {
    console.log(`${key}: '${value}',`)
}
console.log()

let forms = []
await (async () => {
    let taxesCsvReader = new NaiveCsvReader(join(__dirname, '..', 'data', 'pdb_nm_komersantu_samaksato_nodoklu_kopsumas_odata.csv'), { separator: ',', smartSplit: true})
    await taxesCsvReader.read()
    taxesCsvReader.entries.forEach(entry => {
        const form = entry['Uzņēmējdarbības forma']
        if (forms.indexOf(form) == -1) {
            forms.push(form)
        }
    })
})()

console.log(forms)
