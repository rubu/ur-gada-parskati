export class FamilyDoctor {
    constructor(id, name, surname) {
        this.id = id
        this.name = name
        this.surname = surname
        this.patients = new Map()
    }

    getPatientsForRegion(region) {
        let patients = this.patients.get(region)
        if (patients) {
            return patients
        } else {
            return 0
        }
    }

    description() {
        return `${this.name} ${this.surname} (${this.id})`
    }

    setPatientsForRegion(region, patients) {
        if (this.patients.get(region)) {
            throw new Error(`family doctor ${this.description()}) already has an entry for region ${region}`)
        }
        this.patients.set(region, patients)
    }

    merge(doctor) {
        if (doctor.name !== this.name
            || doctor.surname !== this.surname
            || doctor.id !== this.id
        ) {
           throw new Error(`attemtping to merge different doctors ${this.description()} and ${doctor.description()}`)
        }

        for (const [key, value] of doctor.patients) {
            this.setPatientsForRegion(key, value)
        }
    }
}