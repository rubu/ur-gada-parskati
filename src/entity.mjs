import { EntityYearlyStatistics } from './entity-yearly-statistics.mjs'

export class Entity {
    constructor(legalRegistrationNumber, name, currentType) {
        this.years = new Map()
        this.legalRegistrationNumber = legalRegistrationNumber
        this.name = name
        this.currentType = currentType
    }

    statisticsForYear(year, create = true) {
        let entityYearlyStatistics = this.years.get(year)
        if (!entityYearlyStatistics && create) {
            entityYearlyStatistics = new EntityYearlyStatistics(year, this.legalRegistrationNumber, this.name)
            this.years.set(year, entityYearlyStatistics)
        }
        return entityYearlyStatistics
    }
}