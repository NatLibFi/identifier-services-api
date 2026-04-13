export const numbersOnlyString = /^[0-9]+$/;
export const yearString = /^[1-2][0-9]{3}$/;
export const monthString = /^[0-1][0-9]$/;

export const finnishIsbnPublisherStringStart = /^(978|979)-(951|952)-\d/;
export const finnishIsbnPublisherString = /^(978|979)-(951|952)-\d{1,5}$/;
export const ismnPublisherIdentifierLikeString = /^979-0-\d/;

export const issnLikeString = /^[0-9]{4}-[0-9]{3}[0-9X]{1}$/;
