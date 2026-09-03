// Old API code
export function calculateCheckDigitIssn(issnWithoutCheckDigit: string): string {
  // Remove dash if there is one
  const formattedIssnWithoutCheckDigit = issnWithoutCheckDigit.replace('-', '');

  // Validate issn consists now from seven digits
  if (!/^[0-9]{7}$/.test(formattedIssnWithoutCheckDigit)) {
    throw new Error('Cannot generate issn check digit for invalid input');
  }

  let sumOfDigits = 0;

  for (let i = 0; i < formattedIssnWithoutCheckDigit.length; i++) {
    sumOfDigits += Number(formattedIssnWithoutCheckDigit.charAt(i)) * (8 - i);
  }

  const checkDigit = (11 - (sumOfDigits % 11)) % 11;

  // Validate that the value is sane
  if (isNaN(checkDigit) || checkDigit < 0 || checkDigit > 10) {
    throw new Error('Check digit generation has generated an invalid check digit');
  }

  return checkDigit === 10 ? 'X' : checkDigit.toString();
}
