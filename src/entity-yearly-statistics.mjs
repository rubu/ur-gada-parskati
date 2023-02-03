export class EntityYearlyStatistics {
    constructor(year, legalRegistrationNumber, name) {
        this.year = year
        this.legalRegistrationNumber = legalRegistrationNumber
        this.name = name
        this.multiplier = 1
    }

    setIncome(income) {
        this.netTurnover = parseInt(income.net_turnover) * this.multiplier
        this.netIncome = parseInt(income.net_income) * this.multiplier
        this.netIncomeToTurnover = this.netIncome / this.netTurnover
        if (this.employees) {
            this.netTurnoverPerEmployee = this.netTurnover / this.employees
            this.netIncomePerEmployee = this.netIncome / this.employees
        } else {
            this.netTurnoverPerEmployee = -Infinity
            this.netIncomePerEmployee = -Infinity
        }
    }

    description() {
        return '{' + Object.keys(this).map(key => `${key}: ${this[key]}`).join(', ') + '}'
    }
}