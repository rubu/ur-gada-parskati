import { DataSourceSet } from './data-source-set.mjs'
import { fileURLToPath } from 'url'
import { join } from 'path'
import { NaiveCsvReader } from './csv/naive-csv-reader.mjs'
import { Entity } from './entity.mjs';
import { LazyTop } from './lazy-top.mjs';
import { YearlyTops } from './yearly-tops.mjs';
import { open } from 'fs/promises'
import { parseNumberWithSpaces, getShortName } from './utilities.mjs'
import { ENTITY_TYPES, entityTypeFromString  } from './entity-type.mjs'
import readXlsxFile from 'read-excel-file/node'
import { FamilyDoctorsPractice  } from './family-doctors-practice.mjs'
import { FamilyDoctor } from './family-doctor.mjs'
import { createReadStream } from 'fs'
import { writeFile } from 'fs/promises'

function getKeyLabel(key) {
    const keyLabels = {
        'name': 'Nosaukums',
        'legalRegistrationNumber': 'Reģistrācijas numurs',
        'currentType': 'Pašreizējā forma',
        'nace': 'NACE kods',
        'type': 'Forma',
        'employees': 'Darbineki',
        'netIncome': 'Ienākumi',
        'netIncomePerEmployee': 'Ienākumi uz darbinieku',
        'netTurnover': 'Apgrozījums',
        'netTurnoverPerEmployee': 'Apgrozījums uz darbinieku',
        'netIncomeToTurnover': 'Ienākumi pret apgrozījumu',
        'socialTaxes': 'VSAOI iemaksas',
        'socialTaxesPerEmployee': 'VSAOI iemaksas uz darbinieku',
        'incomeTaxes': 'IIN iemaksas',
        'incomeTaxesPerEmployee': 'IIN iemaksas uz darbinieku',
        'extraDividends': 'Ārkārtas dividendes',
        'dividendsPaid': 'Dividendes (kā norādīts UGP)',
        'dividendsPaidAbs': 'Dividendes',
        'totalPatients': 'Pacientu skaits',
        'totalDoctors': 'Ārstu skaits',
        'netIncomePerPatient': 'Ienākumi uz pacientu',
        'netTurnoverPerPatient': 'Apgrozījums uz pacientu',
    }
    if (key in keyLabels) {
        return keyLabels[key]
    }
    throw new Error(`key ${key} does not have a label`)
}

function csvValuesForObject(object, keys, csvSeparator) {
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

async function processFamilyDoctors(year, dataSourceFilePath, csvSeparator) {
    let familyDoctorsPractices = new Map(), mappedFamilyDoctorsPracticeNames = new Map()
    let unmappedFamilyDoctorsPracticeNames = new Set(), familyDoctorsPracticeNames = new Set()
    const { rows, errors } = await readXlsxFile(createReadStream(dataSourceFilePath), { schema })
    if (errors.length !== 0) {
        throw new Error(`failed to load ${dataSources.familyDoctorsPatients2021}`)
    }
    for (const row of rows) {
        let familyDoctorsPractice = familyDoctorsPractices.get(row.entityId)
        if (!familyDoctorsPractice) {
            familyDoctorsPractice = new FamilyDoctorsPractice(row.entityId, row.entityName)
            familyDoctorsPractices.set(row.entityId, familyDoctorsPractice)
        }
        let doctor = new FamilyDoctor(row.id, row.name, row.surname)
        doctor.setPatientsForRegion(row.region, row.totalPatients)
        familyDoctorsPractice.addDoctor(doctor, row.region)
        // try to map
        let mapped = false
        // 1. try to strip end, since that may be the type
        let name = familyDoctorsPractice.name
        let shortName = getShortName(name)
        const registerInfo = nameInQuotes.get(shortName.toUpperCase())
        if (registerInfo) {
            familyDoctorsPractice.setRegisterInfo(registerInfo)
            const entity = entities.get(familyDoctorsPractice.legalRegistrationNumber)
            if (entity) {
                familyDoctorsPractice.setStatistics(entity.statisticsForYear(2021))
                mappedFamilyDoctorsPracticeNames.set(familyDoctorsPractice.id, familyDoctorsPractice)
                mapped = true
            }
        }
        familyDoctorsPracticeNames.add(familyDoctorsPractice.name)
        if (!mapped) {
            unmappedFamilyDoctorsPracticeNames.add(familyDoctorsPractice.name)
        }
    }
    console.log(`There are ${unmappedFamilyDoctorsPracticeNames.size} (${unmappedFamilyDoctorsPracticeNames.size * 100.0 / familyDoctorsPracticeNames.size}%) unmapped family doctors practices out of ${familyDoctorsPracticeNames.size} for year ${year}`)
    await writeFile(`unmapped-family-doctors-pracice-names-${year}.json`, JSON.stringify(Array.from(unmappedFamilyDoctorsPracticeNames.keys())))

    const filePath = join(__dirname, '..', 'dumps', `dump_family_doctors_${year}.csv`)
    let fileHandle = await open(filePath, 'w')
    const entity_keys = ['name', 'legalRegistrationNumber', 'currentType', 'totalPatients', 'totalDoctors']
    const year_keys = ['nace', 'type', 'employees', 'netIncome',  'netIncomePerEmployee', 'netIncomePerPatient', 'netTurnover', 'netTurnoverPerEmployee', 'netTurnoverPerPatient', 'netIncomeToTurnover', 'socialTaxes', 'socialTaxesPerEmployee', 'incomeTaxes', 'incomeTaxesPerEmployee', 'extraDividends', 'dividendsPaidAbs', 'dividendsPaid']
    let headers = entity_keys.map(key => getKeyLabel(key))
    for (let year = minYear; year <= maxYear; ++year) {
        headers = headers.concat(year_keys.map(key => `${getKeyLabel(key)} (${year})`))
    }
    let header = headers.join(csvSeparator)
    await fileHandle.write(header + '\n')
    for (const value of mappedFamilyDoctorsPracticeNames.values()) {
        let values = csvValuesForObject(value, entity_keys, csvSeparator)
        for (let year = minYear; year <= maxYear; ++year) {
            values = values.concat(csvValuesForObject(value.statistics, year_keys, csvSeparator))
        }
        if (values.length != headers.length) {
            throw new Error(`failed to generate csv ${filePath} - value count does not match header count`)
        }
        await fileHandle.write(values.join(csvSeparator) + '\n')
    }
}


console.log(`pid: ${process.pid}`)

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const dataSourceSet = new DataSourceSet(join(__dirname, '..', 'data'), [
    //{ name: 'balanceSheets', url: 'https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/50ef4f26-f410-4007-b296-22043ca3dc43/download/balance_sheets.csv'},
    { name: 'cashFlowStatements', url: 'https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/1a11fc29-ba7c-4e5a-8edc-7a28cea24988/download/cash_flow_statements.csv'},
    { name: 'financialStatements', url: 'https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/27fcc5ec-c63b-4bfd-bb08-01f073a52d04/download/financial_statements.csv' },
    { name: 'incomeStatements', url: 'https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv'},
    { name: 'register', url: 'https://data.gov.lv/dati/dataset/4de9697f-850b-45ec-8bba-61fa09ce932f/resource/25e80bf3-f107-4ab4-89ef-251b5b9374e9/download/register.csv' },
    { name: 'taxes', url: 'https://data.gov.lv/dati/dataset/5ed74664-b49d-4b28-aacb-040931646e9b/resource/a42d6e8c-1768-4939-ba9b-7700d4f1dd3a/download/pdb_nm_komersantu_samaksato_nodoklu_kopsumas_odata.csv'},
    { name: 'familyDoctorsPatients2021', url: 'https://data.gov.lv/dati/dataset/459b5334-c79d-4b06-8acb-58be99eb48d6/resource/12643568-f7bd-48b4-b400-08e373abe9ed/download/2021_psr_uz-31122021_reistrto-pacientu-skaits.xlsx'}
])
console.log('checking data files')
dataSourceSet.on('download-list', (downloadList) => {
    downloadList.forEach(downloadListItem => { 
        console.log(`will download ${downloadListItem.url} to ${downloadListItem.localPath}`)
    })
})
dataSourceSet.on('download-progress', ({filename, progress}) => {
    console.log(`${filename} - ${progress * 100}%`)
})
const dataSources = await dataSourceSet.load()

let entities = new Map()
let yearlyStatisticsIds = new Map()

const startYear = 2021, endYear = 2021
let minYear, maxYear

let register = new Map()
let nameInQuotes = new Map()
await (async () => {
    let registerCsvReader = new NaiveCsvReader(dataSources.register)
    await registerCsvReader.read()
    registerCsvReader.entries.forEach(entry => {
        if (Object.keys(ENTITY_TYPES).indexOf(entry.type) == -1) {
            throw new Error(`unknown entity type ${entry.type}`)
        }
        register.set(parseInt(entry.regcode), entry)
        // is this a logic error? can there be two different entities with lexicographically equal names but different letter casings?
        nameInQuotes.set(entry.name_in_quotes.toUpperCase(), entry)
    })
})()

let financialStatementCsvReader = new NaiveCsvReader(dataSources.financialStatements)
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
                } else {
                    entity = new Entity(registrationNumber, registerInfo.name, registerInfo.type)
                    entities.set(registrationNumber, entity)
                }
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

let incomeStatementsCsvReader = new NaiveCsvReader(dataSources.incomeStatements)
await incomeStatementsCsvReader.read()
incomeStatementsCsvReader.entries.forEach(entry => {
    let entityFinancialStatistics = yearlyStatisticsIds.get(entry.statement_id)
    if (entityFinancialStatistics) {
        entityFinancialStatistics.setIncome(entry)
        entityFinancialStatistics.calculateEmployeeBasedMetrics()
        yearlyTops.checkEntry(entityFinancialStatistics)
    }
})

let cashFlowStatementsCsvReader = new NaiveCsvReader(dataSources.cashFlowStatements)
await cashFlowStatementsCsvReader.read()
cashFlowStatementsCsvReader.entries.forEach(entry => {
    let entityFinancialStatistics = yearlyStatisticsIds.get(entry.statement_id)
    if (entityFinancialStatistics) {
        entityFinancialStatistics.setCashFlow(entry)
    }
})

await (async () => {
    let taxesCsvReader = new NaiveCsvReader(dataSources.taxes, { separator: ',', smartSplit: true})
    await taxesCsvReader.read()
    taxesCsvReader.entries.forEach(entry => {
        let registrationNumber = parseInt(entry['Reģistrācijas kods'])
        let entity = entities.get(registrationNumber)
        if (entity == null) {
            const registerInfo = register.get(registrationNumber)
            if (!registerInfo) {
                console.warn(`register info data not present for entity with registration number ${registrationNumber} ${entry['Nosaukums']}, using name from tax report`)
                entity = new Entity(registrationNumber, entry['Nosaukums'], null)
            } else {
                entity = new Entity(registrationNumber, registerInfo.name, registerInfo.type)
            }
            entities.set(registrationNumber, entity)
        }
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
            statisticsForYear.calculateEmployeeBasedMetrics()
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
    const filePath = join(__dirname, '..', 'dumps', fileName)
    let fileHandle = await open(filePath, 'w')
    const entity_keys = ['name', 'legalRegistrationNumber', 'currentType' ]
    const year_keys = ['nace', 'type', 'employees', 'netIncome',  'netIncomePerEmployee', 'netTurnover', 'netTurnoverPerEmployee', 'netIncomeToTurnover', 'socialTaxes', 'socialTaxesPerEmployee', 'incomeTaxes', 'incomeTaxesPerEmployee', 'extraDividends', 'dividendsPaidAbs', 'dividendsPaid']
    let headers = entity_keys.map(key => getKeyLabel(key))
    for (let year = minYear; year <= maxYear; ++year) {
        headers = headers.concat(year_keys.map(key => `${getKeyLabel(key)} (${year})`))
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
            throw new Error(`failed to generate csv ${filePath} - value count does not match header count`)
        }
        await fileHandle.write(values.join(csvSeparator) + '\n')
    }
}
const schema = {
    'Ārstniecības iestādes kods': {
        prop: 'entityId',
        type: String
    },
    'Ārstniecības iestādes nosaukums': {
        prop: 'entityName',
        type: String
    },
    'NVD Teritoriālās nodaļas nosaukums': {
        prop: 'region',
        type: String
    },
    'Ģimenes ārsta ID': {
        prop: 'id',
        type: Number
    },
    'Ģimenes ārsta vārds': {
        prop: 'name',
        type: String
    },
    'Ģimenes ārsta uzvārds': {
        prop: 'surname',
        type: String
    },
    'pacientu skaits kopā': {
        prop: 'totalPatients',
        type: Number
    }
}

const generateHealtcareData = true
if (generateHealtcareData) {
    processFamilyDoctors(2021, dataSources.familyDoctorsPatients2021, ';')
}

