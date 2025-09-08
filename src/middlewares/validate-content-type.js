// Note: this is copy of @natlibfi/express-validate-content-type index.js
// Copyright 2019 University Of Helsinki (The National Library of Finland)
// License: MIT (see https://github.com/NatLibFi/express-validate-content-type-js/blob/main/LICENSE.txt)

export default function ({type}) {
  return (req, res, next) => {
    const contentTypeIsValid = req.is(type);
    const requestHasNoBody = contentTypeIsValid === null;

    if (contentTypeIsValid || requestHasNoBody) {
      return next();
    }
    return res.sendStatus(415);
  };
}