import { CountryCode, parsePhoneNumberWithError } from "libphonenumber-js";

const callingCodeToCountry: Map<string, CountryCode> = new Map([
	// Pakistan, for developers only
	['+92', 'PK'],   // Pakistan

	// GCC countries
	['+973', 'BH'], // Bahrain
	['+965', 'KW'], // Kuwait
	['+968', 'OM'], // Oman
	['+974', 'QA'], // Qatar
	['+966', 'SA'], // Saudi Arabia
	['+971', 'AE'], // United Arab Emirates

	// Europen countries
	['+355', 'AL'], // Albania
	['+376', 'AD'], // Andorra
	['+374', 'AM'], // Armenia
	['+43', 'AT'], // Austria
	['+994', 'AZ'], // Azerbaijan
	['+375', 'BY'], // Belarus
	['+32', 'BE'], // Belgium
	['+387', 'BA'], // Bosnia and Herzegovina
	['+359', 'BG'], // Bulgaria
	['+385', 'HR'], // Croatia
	['+357', 'CY'], // Cyprus
	['+420', 'CZ'], // Czech Republic
	['+45', 'DK'], // Denmark
	['+372', 'EE'], // Estonia
	['+358', 'FI'], // Finland
	['+33', 'FR'], // France
	['+995', 'GE'], // Georgia
	['+49', 'DE'], // Germany
	['+30', 'GR'], // Greece
	['+36', 'HU'], // Hungary
	['+354', 'IS'], // Iceland
	['+353', 'IE'], // Ireland
	['+39', 'IT'], // Italy
	['+7', 'KZ'], // Kazakhstan (Transcontinental)
	['+383', 'XK'], // Kosovo
	['+371', 'LV'], // Latvia
	['+423', 'LI'], // Liechtenstein
	['+370', 'LT'], // Lithuania
	['+352', 'LU'], // Luxembourg
	['+356', 'MT'], // Malta
	['+373', 'MD'], // Moldova
	['+377', 'MC'], // Monaco
	['+382', 'ME'], // Montenegro
	['+31', 'NL'], // Netherlands
	['+389', 'MK'], // North Macedonia
	['+47', 'NO'], // Norway
	['+48', 'PL'], // Poland
	['+351', 'PT'], // Portugal
	['+40', 'RO'], // Romania
	['+7', 'RU'], // Russia
	['+378', 'SM'], // San Marino
	['+381', 'RS'], // Serbia
	['+421', 'SK'], // Slovakia
	['+386', 'SI'], // Slovenia
	['+34', 'ES'], // Spain
	['+46', 'SE'], // Sweden
	['+41', 'CH'], // Switzerland
	['+90', 'TR'], // Turkey
	['+380', 'UA'], // Ukraine
	['+44', 'GB'], // United Kingdom
	['+379', 'VA'], // Vatican City
]);

/**
 * Determines if the phone number is valid
 *
 * @param phoneNumber
 * @param callingCode
 * @returns
 */
export const isPhoneNumberValid = (phoneNumber: string, callingCode: string): boolean => {
	if (!callingCodeToCountry.has(callingCode)) {
		return false;
	}

	try {
		return parsePhoneNumberWithError(phoneNumber, callingCodeToCountry.get(callingCode)).isValid();
	} catch (err) {
		return false;
	}
};
