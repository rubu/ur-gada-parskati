export class EntityYearlyStatistics {
    constructor(year, id, legalRegistrationNumber) {
        this.year = year
        this.id = id
        this.legalRegistrationNumber = legalRegistrationNumber
        this.multiplier = 1
    }

    setIncome(income) {
        this.netTurnover = parseInt(income.net_turnover) * this.multiplier
        this.netIncome = parseInt(income.net_income) * this.multiplier
        this.netIncomeToTurnover = this.netIncome * 100 / this.netTurnover
        if (this.employees) {
            this.netTurnoverPerEmployee = this.netTurnover / this.employees
            this.netTncomePerEmployee = this.netIncome / this.employees
        } else {
            this.netTurnoverPerEmployee = -Infinity
            this.netTncomePerEmployee = -Infinity
        }
    }
}