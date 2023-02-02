import { EntityYearlyStatistics } from './entity-yearly-statistics.mjs'

export class Entity {
    constructor(legalRegistrationNumber, name) {
        this.years = new Map()
        this.legalRegistrationNumber = legalRegistrationNumber
        this.name = name
    }

    statisticsForYear(year, id, create = true) {
        let entityYearlyStatistics = this.years.get(year)
        if (!entityYearlyStatistics && create) {
            entityYearlyStatistics = new EntityYearlyStatistics(year, id, this.legalRegistrationNumber, this.name)
            this.years.set(year, entityYearlyStatistics)
        }
        return entityYearlyStatistics
    }
}