
export const ENTITY_TYPES = {
    IK: 'Individuālais komersants',
    SIA: 'Sabiedrība ar ierobežotu atbildību',
    BDR: 'Biedrība',
    ZEM: 'Zemnieku saimniecība',
    IND: 'Individuālais uzņēmums',
    NOD: 'Nodibinājums',
    AKF: 'Ārvalsts komersanta filiāle',
    KAT: 'Katoļu baznīcas publisko tiesību juridiskā persona',
    FIL: 'Filiāle',
    KB: 'Kooperatīvā sabiedrība',
    PS: 'Pilnsabiedrība',
    PAR: 'Ārvalsts komersanta pārstāvniecība',
    PSV: 'Pašvaldības uzņēmums',
    SE: 'Eiropas komercsabiedrība',
    PPA: 'Politisko partiju apvienība',
    AS: 'Akciju sabiedrība',
    PAJ: 'Paju sabiedrība',
    ARB: 'Arodbiedrība',
    DRZ: 'Draudze',
    SKT: 'Šķīrējtiesa',
    PP: 'Politiskā partija',
    UZN: 'Uzņēmējsabiedrības uzņēmums',
    KS: 'Komandītsabiedrība',
    GIM: 'Ģimenes uzņēmums',
    SAB: 'Sabiedriskā organizācija',
    ZVJ: 'Zvejnieku saimniecība',
    PAP: 'Sabiedrība ar papildu atbildību',
    ARA: 'Arodbiedrību apvienība',
    PRV: 'Pārstāvis',
    LIG: 'Līgumsabiedrība ar pilnu atbildību',
    ARV: 'Arodbiedrības patstāvīgā vienība',
    SPO: '',
    VU: 'Valsts uzņēmums',
    ROI: 'Iestāde',
    POR: 'Ārvalsts organizācijas pārstāvniecība',
    SOU: 'Sabiedriskās organizācijas uzņēmums',
    BAZ: 'Baznīca',
    ASF: '',
    SAA: '',
    KOR: '',
    POL: 'Politiska organizācija (partija)',
    SAV: 'Savienība',
    SPA: '',
    PRO: '',
    KSS: 'Kooperatīvo biedrību savienības uzņēmums',
    REL: 'Reliģiskas organizācijas uzņēmums',
    KBU: 'Kooperatīvo biedrību uzņēmums',
    KBS: 'Kooperatīvo biedrību savienība',
    DIE: 'Diecēze',
    MIS: 'Misija',
    KLO: 'Klosteris',
    EIG: 'Eiropas ekonomisko interešu grupa',
    MIL: 'Masu informācijas līdzeklis',
}

export function entityTypeFromString(text) {
    if (text === 'sabiedrība ar ierobežotu atbildību') {
        return 'SIA'
    } else if (text === 'ārvalstu uzņēmums, ārvalstu uzņēmuma filiāle') {
        return 'AKF'
    } else if (text === 'akciju sabiedrība') {
        return 'AS'
    } else if (text === 'Individuālais komersants') {
        return 'IK'
    } else if (text === 'līgumsabiedrība ar pilnu atbildību') {
        return 'LIG'
    } else if (text === 'komandītsabiedrība') {
        return 'KS'
    }
    throw new Error(`unknown entity type "${text}"`)
}
