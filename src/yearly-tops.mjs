export class YearlyTops {
    constructor(topDefinitions) {
        this.topDefinitions = topDefinitions
        this.tops = new Map()
    }

    checkEntry(entityFinancialStatistics) {
        const year = entityFinancialStatistics.year
        let topsForYear = this.tops.get(year)
        if (!topsForYear) {
            topsForYear = this.topDefinitions.map(topDefinition => topDefinition.create())
            this.tops.set(year, topsForYear)
        }
        topsForYear.forEach(top => top.checkEntry(entityFinancialStatistics))
    }

    print() {
        for (const [year, tops] of this.tops.entries()) {
            console.log(`${year}:`)
            for (const top of tops) {
                console.log(top.title)
                for (const entry of top.entries) {
                    console.log(`${entry.entry.legalRegistrationNumber} - ${entry.metric}`)
                }
            }
          } 
    }
}