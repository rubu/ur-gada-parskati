import { EntityYearlyStatistics } from './entity-yearly-statistics.mjs'

export class Entity {
    constructor(legalRegistrationNumber) {
        this.years = new Map()
        this.legalRegistrationNumber = legalRegistrationNumber
    }

    statisticsForYear(id, year) {
        let entityYearlyStatistics = this.years.get(year)
        if (!entityYearlyStatistics) {
            entityYearlyStatistics = new EntityYearlyStatistics(id, year, this.legalRegistrationNumber)
            this.years.set(year, entityYearlyStatistics)
        }
        return entityYearlyStatistics
    }
}