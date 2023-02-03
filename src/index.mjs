import { CsvDataSourceSet } from './csv/csv-data-source-set.mjs'
import { fileURLToPath } from 'url'
import { join } from 'path'
import { NaiveCsvReader } from './csv/naive-csv-reader.mjs'
import { Entity } from './entity.mjs';
import { LazyTop } from './lazy-top.mjs';
import { YearlyTops } from './yearly-tops.mjs';
import { open } from 'fs/promises'
import { parseNumberWithSpaces } from './utilities.mjs'
import { ENTITY_TYPES, entityTypeFromString  } from './entity-type.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const csvDataSourceSet = new CsvDataSourceSet(join(__dirname, '..', 'data'), [
    //{ name: 'balanceSheets', url: 'https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/50ef4f26-f410-4007-b296-22043ca3dc43/download/balance_sheets.csv'},
    //{ name: 'cashFlowStatements', url: 'https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/1a11fc29-ba7c-4e5a-8edc-7a28cea24988/download/cash_flow_statements.csv'},
    { name: 'financialStatements', url: 'https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/27fcc5ec-c63b-4bfd-bb08-01f073a52d04/download/financial_statements.csv' },
    { name: 'incomeStatements', url: 'https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv'},
    { name: 'register', url: 'https://data.gov.lv/dati/dataset/4de9697f-850b-45ec-8bba-61fa09ce932f/resource/25e80bf3-f107-4ab4-89ef-251b5b9374e9/download/register.csv' },
    { name: 'taxes', url: 'https://data.gov.lv/dati/dataset/5ed74664-b49d-4b28-aacb-040931646e9b/resource/a42d6e8c-1768-4939-ba9b-7700d4f1dd3a/download/pdb_nm_komersantu_samaksato_nodoklu_kopsumas_odata.csv'}
])
console.log('checking csv files')
csvDataSourceSet.on('download-list', (downloadList) => {
    downloadList.forEach(downloadListItem => { 
        console.log(`will download ${downloadListItem.url} to ${downloadListItem.localPath}`)
    })
})
csvDataSourceSet.on('download-progress', ({filename, progress}) => {
    console.log(`${filename} - ${progress * 100}%`)
})
const csvDataSources = await csvDataSourceSet.load()

let entities = new Map()
let yearlyStatisticsIds = new Map()

const startYear = 2021, endYear = 2021
let minYear, maxYear

let register = new Map()
await (async () => {
    let registerCsvReader = new NaiveCsvReader(csvDataSources.register)
    await registerCsvReader.read()
    registerCsvReader.entries.forEach(entry => {
        if (Object.keys(ENTITY_TYPES).indexOf(entry.type) == -1) {
            throw new Error(`unknown entity type ${entry.type}`)
        }
        register.set(parseInt(entry.regcode), entry)
    })
})()

let financialStatementCsvReader = new NaiveCsvReader(csvDataSources.financialStatements)
await financialStatementCsvReader.read()
financialStatementCsvReader.entries.forEach(entry => {
    const year = parseInt(entry.year)
    if (year) {
        if (year >= startYear && year <= endYear) {
            if (maxYear == null || year > maxYear) {
                maxYear = year
            }
            if (minYear == null || year < minYear) {
                minYear = year
            }
            let registrationNumber = parseInt(entry.legal_entity_registration_number)
            let entity = entities.get(registrationNumber)
            if (!entity) {
                const registerInfo = register.get(registrationNumber)
                if (!registerInfo) {
                    console.error(`register info data not present for entity with registration number ${registrationNumber}`)
                }
                entity = new Entity(registrationNumber, registerInfo?.name ?? '', registerInfo.type)
                entities.set(registrationNumber, entity)
            }
            let entityYearylyStatistics = entity.statisticsForYear(year)
            entityYearylyStatistics.id = entry.id
            entityYearylyStatistics.employees = parseInt(entry.employees)
            let multiplier = entry.rounded_to_nearest
            if (multiplier === 'THOUSANDS') {
                entityYearylyStatistics.multiplier = 1000    
            } else if (multiplier === 'MILLIONS') {
                entityYearylyStatistics.multiplier = 1000000  
            }
            yearlyStatisticsIds.set(entry.id, entityYearylyStatistics)
        }
    }
})

let topLimit = 10
let yearlyTops = new YearlyTops([
    { create: () => new LazyTop('Pēc apgrozījuma', topLimit, 'netTurnover') },
    { create: () => new LazyTop('Pēc peļņas', topLimit, 'netIncome') }, 
    { create: () => new LazyTop('Pēc peļņas/apgrozījuma attiecības', topLimit, 'netIncomeToTurnover', (metric) => isFinite(metric)) },
    { create: () => new LazyTop('Pēc apgrozījuma uz darbinieku', topLimit, 'netTurnoverPerEmployee', (metric) => isFinite(metric)) },
    { create: () => new LazyTop('Pēc peļņas uz darbinieku', topLimit, 'netIncomePerEmployee', (metric) => isFinite(metric)) },
])

let incomeStatementsCsvReader = new NaiveCsvReader(csvDataSources.incomeStatements)
await incomeStatementsCsvReader.read()
incomeStatementsCsvReader.entries.forEach(entry => {
    let entityFinancialStatistics = yearlyStatisticsIds.get(entry.statement_id)
    if (entityFinancialStatistics) {
        entityFinancialStatistics.setIncome(entry)
        yearlyTops.checkEntry(entityFinancialStatistics)
    }
})

await (async () => {
    let taxesCsvReader = new NaiveCsvReader(csvDataSources.taxes, { separator: ',', smartSplit: true})
    await taxesCsvReader.read()
    taxesCsvReader.entries.forEach(entry => {
        let registrationNumber = parseInt(entry['Reģistrācijas kods'])
        let entity = entities.get(registrationNumber)
        if (entity) {
            let year = parseInt(entry['Taksācijas gads'])
            let statisticsForYear = entity.statisticsForYear(year, true)
            if (statisticsForYear) {
                const type = entityTypeFromString(entry['Uzņēmējdarbības forma'])
                statisticsForYear.type = type
                statisticsForYear.nace = entry['Pamatdarbības NACE kods']
                statisticsForYear.socialTaxes = parseNumberWithSpaces(entry['Tajā skaitā, VSAOI']) * 1000
                statisticsForYear.incomeTaxes = parseNumberWithSpaces(entry['Tajā skaitā, IIN']) * 1000
                const employees = parseInt(entry['Vidējais nodarbināto personu skaits, cilv.'])
                if (statisticsForYear.employees == null) {
                    statisticsForYear.employees = employees
                } else if (statisticsForYear.employees != employees) {
                    console.error(`data mismatch between UR and VID (employees) - ${statisticsForYear.employees} vs ${employees}`)
                }
                statisticsForYear.socialTaxesPerEmployee = statisticsForYear.socialTaxes / statisticsForYear.employees
                statisticsForYear.incomeTaxesPerEmployee = statisticsForYear.incomeTaxes / statisticsForYear.employees
            }
        }
    })
})()

yearlyTops.print()

if (minYear) {
    let csvSeparator = ';'
    let fileName
    if (maxYear && maxYear > minYear) {
        fileName = `dump_${minYear}_${maxYear}.csv`
    } else {
        fileName = `dump_${minYear}.csv`
    }
    let fileHandle = await open(join(__dirname, '..', fileName), 'w')
    const entity_keys = [ 'name', 'legalRegistrationNumber', 'currentType']
    const year_keys = [ 'nace', 'type', 'employees', 'netIncome',  'netIncomePerEmployee', 'netTurnover', 'netTurnoverPerEmployee', 'socialTaxes', 'socialTaxesPerEmployee', 'incomeTaxes', 'incomeTaxesPerEmployee']
    let headers = entity_keys
    for (let year = minYear; year <= maxYear; ++year) {
        headers = headers.concat(year_keys.map(key => `${key}_${year}`))
    }
    let header = headers.join(csvSeparator)
    await fileHandle.write(header + '\n')
    const csvValuesForObject = (object, keys) => {
        if (object == null) return new Array(keys.length).fill('')

        let values = []
        keys.forEach(key => {
            let value = object[key]
            if (value == null) {
                value = ''
            } else if (typeof(value) == 'string' && value.indexOf(csvSeparator) != -1) {
                value.replace('"', '""')
                value = '"' + value + '"'
            }
            values.push(value)
        })
        return values
    }
    for (const value of entities.values()) {
        let values = csvValuesForObject(value, entity_keys)
        for (let year = minYear; year <= maxYear; ++year) {
            values = values.concat(csvValuesForObject(value.statisticsForYear(year, null, false), year_keys))
        }
        if (values.length != headers.length) {
            throw new Error(`failed to dump csv - value count does not match header count`)
        }
        await fileHandle.write(values.join(csvSeparator) + '\n')
    }
}