import readXlsxFile from 'read-excel-file/node'
import { createReadStream } from 'fs'

const schema = {
    'Nodokļu maksātāja reģistrācijas kods': {
        prop: 'registrationNumber',
        type: Number
    },
    'Nodokļu maksātāja nosaukums\n(* PVN grupas dalībnieks)': {
        prop: 'name',
        type: String
    },
    'Iedzīvotāju ienākuma nodoklis': {
        prop: 'incomeTaxes',
        type: Number
    },
    'Valsts sociālās apdrošināšanas obligātās iemaksas': {
        prop: 'socialTaxes',
        type: Number
    },
    'Vidējais darbinieku skaits, cilv.': {
        prop: 'employees',
        type: Number
    },
    'NACE kods': {
        prop: 'nace',
        type: String
    },
    'Nodokļu maksātāja uzņēmējdarbības formas nosaukums': {
        prop: 'type',
        type: String
    }
}

export class XlsxTaxDataReader {
    path
    entries

    constructor(path) {
        this.path = path
        this.data = new Map()
    }

    async load() {
        let transformData = (rows) => {
            /*
                remove first title line, merge 2nd and 3rd to make a header
            */
            let headers = rows[1], subHeaders = rows[2]
            for (let i = 0; i < subHeaders.length; ++i) {
                if (subHeaders[i] === null) {
                    subHeaders[i] = headers[i]
                }
            }
            return [ subHeaders, ...rows.slice(3)];
        }
        const { rows, errors } = await readXlsxFile(createReadStream(this.path), { schema, transformData })
        if (errors.length !== 0) {
            //throw new Error(`failed to load ${this.path}`)
        }
        for (const row of rows) {
            this.data.set(row.registrationNumber, row)
        }
        this.entries = rows
    }

    get(legalRegistrationNumber) {
        return this.data.get(legalRegistrationNumber)
    }

    static async create(path) {
        const xlsxTaxDataReader = new XlsxTaxDataReader(path)
        await xlsxTaxDataReader.load()
        return xlsxTaxDataReader
    }
}