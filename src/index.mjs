import { CsvDataSource } from './csv/csv-data-source.mjs'
import { fileURLToPath } from 'url'
import { join } from 'path'
import { NaiveCsvReader } from './csv/naive-csv-reader.mjs'
import { Entity } from './entity.mjs';
import { LazyTop } from './lazy-top.mjs';
import { YearlyTops } from './yearly-tops.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const csvDataSources = await Promise.all([
    CsvDataSource.create(join(__dirname, '..', 'data', 'balance_sheets.csv'), 'https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv'),
    CsvDataSource.create(join(__dirname, '..', 'data', 'cash_flow_statements.csv'), 'https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/1a11fc29-ba7c-4e5a-8edc-7a28cea24988/download/cash_flow_statements.csv'),
    CsvDataSource.create(join(__dirname, '..', 'data', 'financial_statements.csv'), 'https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/27fcc5ec-c63b-4bfd-bb08-01f073a52d04/download/financial_statements.csv'),
    CsvDataSource.create(join(__dirname, '..', 'data', 'income_statements.csv'), 'https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv')
])

let entities = new Map()
let yearlyStatisticsIds = new Map()

const startYear = 2020

let financialStatementCsvReader = new NaiveCsvReader(csvDataSources[2].path)
await financialStatementCsvReader.read()
financialStatementCsvReader.entries.forEach(entry => {
    const year = parseInt(entry.year)
    if (year >= startYear) {
        let registrationNumber = parseInt(entry.legal_entity_registration_number)
        let entity = entities.get(registrationNumber)
        if (!entity) {
            entity = new Entity(registrationNumber)
            entities.set(registrationNumber, entity)
        }
        let entityYearylyStatistics = entity.statisticsForYear(year, entry.id)
        entityYearylyStatistics.employees = parseInt(entry.employees)
        let multiplier = entry.rounded_to_nearest
        if (multiplier === 'THOUSANDS') {
            entityYearylyStatistics.multiplier = 1000    
        } else if (multiplier === 'MILLIONS') {
            entityYearylyStatistics.multiplier = 1000000  
        }
        yearlyStatisticsIds.set(entry.id, entityYearylyStatistics)
    }
})

let topLimit = 10
let yearlyTops = new YearlyTops([
    { create: () => new LazyTop('Pēc apgrozījuma', topLimit, 'netTurnover') },
    { create: () => new LazyTop('Pēc peļņas', topLimit, 'netIncome') }, 
    { create: () => new LazyTop('Pēc peļņas/apgrozījuma attiecības', topLimit, 'netIncomeToTurnover', (metric) => isFinite(metric)) },
    { create: () => new LazyTop('Pēc apgrozījuma uz darbinieku', topLimit, 'netTurnoverPerEmployee', (metric) => isFinite(metric)) },
    { create: () => new LazyTop('Pēc peļņas uz darbinieku', topLimit, 'netTncomePerEmployee', (metric) => isFinite(metric)) },
])

let incomeStatementsCsvReader = new NaiveCsvReader(csvDataSources[3].path)
await incomeStatementsCsvReader.read()
incomeStatementsCsvReader.entries.forEach(entry => {
    let entityFinancialStatistics = yearlyStatisticsIds.get(entry.statement_id)
    if (entityFinancialStatistics) {
        entityFinancialStatistics.setIncome(entry)
        yearlyTops.checkEntry(entityFinancialStatistics)
    }
})

yearlyTops.print()