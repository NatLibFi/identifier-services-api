import { getKysely } from '../../db/database.ts';
import { validateGetById } from '../shared-interface-utils.ts';

import { MONOGRAPH_EXPRESSION_TYPES, MONOGRAPH_IDENTIFIERS } from '../../constants.ts';

import type { MonographPublicationExpressionSelect } from '../../db/types/monograph/types-monograph-publication-expression.ts';

export function calculateIsbnIsmnCheckDigit(identifierWithoutDashes: string) {
  const containsTwelveDigits = identifierWithoutDashes.match(/^\d{12}$/);
  if (!containsTwelveDigits) {
    throw new Error('ISBN/ISMN check digit may be only calculated for input that contains exactly 12 digits');
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

export async function getExpressionIdentifierType(expressionId: number) {
  const db = getKysely();

  const expression = await db
    .selectFrom('monograph_publication_expression')
    .selectAll()
    .where('id', '=', expressionId)
    .execute();

  const validatedExpression = validateGetById<MonographPublicationExpressionSelect>(expression);

  const ismnExpressionTypes = [MONOGRAPH_EXPRESSION_TYPES.SHEET_MUSIC];
  if (ismnExpressionTypes.includes(validatedExpression.expression_type)) {
    return MONOGRAPH_IDENTIFIERS.ISMN;
  }

  const isbnExpressionTypes = [
    MONOGRAPH_EXPRESSION_TYPES.BOOK,
    MONOGRAPH_EXPRESSION_TYPES.DISSERTATION,
    MONOGRAPH_EXPRESSION_TYPES.MAP,
    MONOGRAPH_EXPRESSION_TYPES.OTHER,
  ];
  if (isbnExpressionTypes.includes(validatedExpression.expression_type)) {
    return MONOGRAPH_IDENTIFIERS.ISBN;
  }

  throw new Error(`Unsupported monograph identifier type observed for expression id ${expressionId}`);
}
