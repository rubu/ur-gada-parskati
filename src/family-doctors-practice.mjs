export class FamilyDoctorsPractice {
    constructor(id, name) {
        this.id = id
        this.name = name
        this.doctors = new Map()
        this.totalPatients = 0
    }

    get totalDoctors() {
        return this.doctors.size
    }

    addDoctor(doctor, region) {
        let existingDoctor = this.doctors.get(doctor.id)
        if (existingDoctor) {
            existingDoctor.merge(doctor)
        } else {
            this.doctors.set(doctor.id, doctor)
        }
        this.totalPatients += doctor.getPatientsForRegion(region)
    }

    setRegisterInfo(registerInfo) {
        this.legalRegistrationNumber = parseInt(registerInfo.regcode)
        this.currentType = registerInfo.currentType
    }

    setStatistics(statistics) {
        this.statistics = statistics
        this.statistics.netTurnoverPerPatient = this.statistics.netTurnover / this.totalPatients
        this.statistics.netIncomePerPatient = this.statistics.netIncome / this.totalPatients
    }
}