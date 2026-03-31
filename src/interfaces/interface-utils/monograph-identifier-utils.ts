export function calculateIsbn13CheckDigit(identifierWithoutDashes: string) {
  const containsTwelveDigits = identifierWithoutDashes.match(/^\d{12}$/);
  if (!containsTwelveDigits) {
    throw new Error('ISBN-13 check digit may be only calculated for input that contains exactly 12 digits');
  }

  // Converted to JavaScript from original ID registry PHP implementation.
  // Original source: https://github.com/petkivim/id-registry/blob/cab34a3ec83ef478bad8d6cc0edcbabc1be02a64/src/monograph-publishers/com_isbnregistry/admin/helpers/publisherisbnrange.php#L45
  const sum = identifierWithoutDashes.split('').reduce((acc, char, i) => {
    if (i % 2 === 0) {
      acc += Number(char) * 1;
    } else {
      acc += Number(char) * 3;
    }
    return acc;
  }, 0);

  return `${(10 - (sum % 10)) % 10}`;
}

export function calculateIsmn13CheckDigit(identifierWithoutDashes: string) {
  return calculateIsbn13CheckDigit(identifierWithoutDashes);
}
