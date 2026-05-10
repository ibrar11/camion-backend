/**
 * ISO 3166-2 state/province codes for GCC countries
 * Format: {COUNTRY_CODE}-{STATE_CODE}
 * SkipCash expects only the state code part (e.g., "DA" for Doha, "RU" for Riyadh)
 */
export enum IsoStateCode {
    // ========== QATAR (QA) ==========
    // Municipalities of Qatar
    QA_DA = 'DA', // Doha (Ad Dawhah)
    QA_RA = 'RA', // Al Rayyan
    QA_KH = 'KH', // Al Khor (Al Khawr)
    QA_WA = 'WA', // Al Wakrah
    QA_ZA = 'ZA', // Al Daayen (Az Za'ayin)
    QA_US = 'US', // Umm Salal
    QA_MS = 'MS', // Al Shamal (Madinat ash Shamal)

    // ========== SAUDI ARABIA (SA) ==========
    // Provinces of Saudi Arabia
    SA_RU = 'RU', // Riyadh
    SA_MK = 'MK', // Mecca (Makkah)
    SA_MD = 'MD', // Medina (Al Madinah)
    SA_ES = 'ES', // Eastern Province (Ash Sharqiyah)
    SA_AS = 'AS', // Asir
    SA_TB = 'TB', // Tabuk
    SA_HA = 'HA', // Ha'il
    SA_NR = 'NR', // Northern Borders (Al Hudud ash Shamaliyah)
    SA_JW = 'JW', // Al Jawf
    SA_JZ = 'JZ', // Jazan
    SA_QU = 'QU', // Al Qasim
    SA_BA = 'BA', // Al Bahah
    SA_NJ = 'NJ', // Najran

    // ========== UNITED ARAB EMIRATES (AE) ==========
    // Emirates of UAE
    AE_AZ = 'AZ', // Abu Dhabi
    AE_DU = 'DU', // Dubai
    AE_SH = 'SH', // Sharjah
    AE_AJ = 'AJ', // Ajman
    AE_RK = 'RK', // Ras Al Khaimah
    AE_UQ = 'UQ', // Umm Al Quwain
    AE_FU = 'FU', // Fujairah

    // ========== KUWAIT (KW) ==========
    // Governorates of Kuwait
    KW_KU = 'KU', // Al Asimah (Capital)
    KW_HA = 'HA', // Hawalli
    KW_FA = 'FA', // Al Farwaniyah
    KW_JA = 'JA', // Al Jahra
    KW_MU = 'MU', // Mubarak Al-Kabeer
    KW_AH = 'AH', // Al Ahmadi

    // ========== BAHRAIN (BH) ==========
    // Governorates of Bahrain
    BH_CA = 'CA', // Capital
    BH_MU = 'MU', // Muharraq
    BH_NO = 'NO', // Northern
    BH_SO = 'SO', // Southern

    // ========== OMAN (OM) ==========
    // Governorates of Oman
    OM_DA = 'DA', // Ad Dakhiliyah
    OM_BA = 'BA', // Al Batinah
    OM_WU = 'WU', // Al Wusta
    OM_SH = 'SH', // Ash Sharqiyah
    OM_ZA = 'ZA', // Az Zahirah
    OM_MA = 'MA', // Muscat
    OM_MU = 'MU', // Musandam
    OM_DH = 'DH', // Dhofar
    OM_BU = 'BU', // Al Buraimi

    // ========== COMMON US STATES ==========
    // Alabama
    US_AL = 'AL',
    // Alaska
    US_AK = 'AK',
    // Arizona
    US_AZ = 'AZ',
    // Arkansas
    US_AR = 'AR',
    // California
    US_CA = 'CA',
    // Colorado
    US_CO = 'CO',
    // Connecticut
    US_CT = 'CT',
    // Delaware
    US_DE = 'DE',
    // Florida
    US_FL = 'FL',
    // Georgia
    US_GA = 'GA',
    // Hawaii
    US_HI = 'HI',
    // Idaho
    US_ID = 'ID',
    // Illinois
    US_IL = 'IL',
    // Indiana
    US_IN = 'IN',
    // Iowa
    US_IA = 'IA',
    // Kansas
    US_KS = 'KS',
    // Kentucky
    US_KY = 'KY',
    // Louisiana
    US_LA = 'LA',
    // Maine
    US_ME = 'ME',
    // Maryland
    US_MD = 'MD',
    // Massachusetts
    US_MA = 'MA',
    // Michigan
    US_MI = 'MI',
    // Minnesota
    US_MN = 'MN',
    // Mississippi
    US_MS = 'MS',
    // Missouri
    US_MO = 'MO',
    // Montana
    US_MT = 'MT',
    // Nebraska
    US_NE = 'NE',
    // Nevada
    US_NV = 'NV',
    // New Hampshire
    US_NH = 'NH',
    // New Jersey
    US_NJ = 'NJ',
    // New Mexico
    US_NM = 'NM',
    // New York
    US_NY = 'NY',
    // North Carolina
    US_NC = 'NC',
    // North Dakota
    US_ND = 'ND',
    // Ohio
    US_OH = 'OH',
    // Oklahoma
    US_OK = 'OK',
    // Oregon
    US_OR = 'OR',
    // Pennsylvania
    US_PA = 'PA',
    // Rhode Island
    US_RI = 'RI',
    // South Carolina
    US_SC = 'SC',
    // South Dakota
    US_SD = 'SD',
    // Tennessee
    US_TN = 'TN',
    // Texas
    US_TX = 'TX',
    // Utah
    US_UT = 'UT',
    // Vermont
    US_VT = 'VT',
    // Virginia
    US_VA = 'VA',
    // Washington
    US_WA = 'WA',
    // West Virginia
    US_WV = 'WV',
    // Wisconsin
    US_WI = 'WI',
    // Wyoming
    US_WY = 'WY',
}

/**
 * State name to ISO code mapping for GCC countries
 */
export const StateNameToIsoCode: Record<string, IsoStateCode> = {
    // Qatar
    'Doha': IsoStateCode.QA_DA,
    'Ad Dawhah': IsoStateCode.QA_DA,
    'Al Rayyan': IsoStateCode.QA_RA,
    'Al Khor': IsoStateCode.QA_KH,
    'Al Wakrah': IsoStateCode.QA_WA,
    'Al Daayen': IsoStateCode.QA_ZA,
    'Umm Salal': IsoStateCode.QA_US,
    'Al Shamal': IsoStateCode.QA_MS,

    // Saudi Arabia
    'Riyadh': IsoStateCode.SA_RU,
    'Mecca': IsoStateCode.SA_MK,
    'Makkah': IsoStateCode.SA_MK,
    'Medina': IsoStateCode.SA_MD,
    'Al Madinah': IsoStateCode.SA_MD,
    'Eastern Province': IsoStateCode.SA_ES,
    'Ash Sharqiyah': IsoStateCode.SA_ES,
    'Asir': IsoStateCode.SA_AS,
    'Tabuk': IsoStateCode.SA_TB,
    'Ha\'il': IsoStateCode.SA_HA,
    'Northern Borders': IsoStateCode.SA_NR,
    'Al Jawf': IsoStateCode.SA_JW,
    'Jazan': IsoStateCode.SA_JZ,
    'Al Qasim': IsoStateCode.SA_QU,
    'Al Bahah': IsoStateCode.SA_BA,
    'Najran': IsoStateCode.SA_NJ,

    // UAE
    'Abu Dhabi': IsoStateCode.AE_AZ,
    'Dubai': IsoStateCode.AE_DU,
    'Sharjah': IsoStateCode.AE_SH,
    'Ajman': IsoStateCode.AE_AJ,
    'Ras Al Khaimah': IsoStateCode.AE_RK,
    'Umm Al Quwain': IsoStateCode.AE_UQ,
    'Fujairah': IsoStateCode.AE_FU,

    // Kuwait
    'Al Asimah': IsoStateCode.KW_KU,
    'Capital': IsoStateCode.KW_KU,
    'Hawalli': IsoStateCode.KW_HA,
    'Al Farwaniyah': IsoStateCode.KW_FA,
    'Al Jahra': IsoStateCode.KW_JA,
    'Mubarak Al-Kabeer': IsoStateCode.KW_MU,
    'Al Ahmadi': IsoStateCode.KW_AH,

    // Bahrain
    'Bahrain Capital': IsoStateCode.BH_CA,
    'Muharraq': IsoStateCode.BH_MU,
    'Northern': IsoStateCode.BH_NO,
    'Southern': IsoStateCode.BH_SO,

    // Oman
    'Ad Dakhiliyah': IsoStateCode.OM_DA,
    'Al Batinah': IsoStateCode.OM_BA,
    'Al Wusta': IsoStateCode.OM_WU,
    'Oman Ash Sharqiyah': IsoStateCode.OM_SH,
    'Az Zahirah': IsoStateCode.OM_ZA,
    'Muscat': IsoStateCode.OM_MA,
    'Musandam': IsoStateCode.OM_MU,
    'Dhofar': IsoStateCode.OM_DH,
    'Al Buraimi': IsoStateCode.OM_BU,
};

/**
 * Get ISO state code from state/province name
 * @param countryCode - ISO country code (e.g., "SA", "QA")
 * @param stateName - Full state/province name
 * @returns ISO state code (e.g., "RU", "DA") or null if not found
 */
export function getIsoStateCode(countryCode: string, stateName: string): string | null {
    if (!stateName) return null;

    const normalized = stateName.trim();

    // If already looks like a 2-letter code
    if (normalized.length === 2 && /^[A-Z]{2}$/i.test(normalized)) {
        return normalized.toUpperCase();
    }

    // Look up by state name
    return StateNameToIsoCode[normalized] || null;
}