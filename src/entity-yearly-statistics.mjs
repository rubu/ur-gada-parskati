import { safeDivide } from './utilities.mjs'

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
        this.extraDividends = parseInt(income.extra_dividends) * this.multiplier
    }

    setCashFlow(cashFlow) {
        this.dividendsPaid = parseInt(cashFlow.cff_dividends_paid) * this.multiplier
        this.dividendsPaidAbs = Math.abs(this.dividendsPaid)
    }

    calculateEmployeeBasedMetrics() {
        if (this.netTurnover != null) { 
            this.netTurnoverPerEmployee = safeDivide(this.netTurnover, this.employees)
        }
        if (this.netIncome != null) {
            this.netIncomePerEmployee = safeDivide(this.netIncome, this.employees)    
        }
        if (this.socialTaxes != null) {
            this.socialTaxesPerEmployee = safeDivide(this.socialTaxes, this.employees)
        }
        if (this.incomeTaxes != null) {
            this.incomeTaxesPerEmployee = safeDivide(this.incomeTaxes, this.employees)
        }
    }

    setTaxData(taxData) {
        this.type = taxData.type
        this.nace = taxData.nace
        this.socialTaxes = taxData.socialTaxes
        this.incomeTaxes = taxData.incomeTaxes
        if (this.employees == null) {
            this.employees = taxData.employees
        } else if (this.employees != taxData.employees) {
            console.error(`data mismatch between UR and VID (employees) - ${this.employees} vs ${taxData.employees}`)
        }
        this.calculateEmployeeBasedMetrics()

    }
    description() {
        return '{' + Object.keys(this).map(key => `${key}: ${this[key]}`).join(', ') + '}'
    }
}