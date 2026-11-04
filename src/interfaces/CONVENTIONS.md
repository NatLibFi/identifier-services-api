# Interface layer conventions

## Role

Layer responsible for business logic.

## Structure

Monograph and serial interfaces are located in separate subfolders. Cross-domain interfaces live in folder root (e.g., `message-template-interface.ts`). Each interface may have its own utils, which has naming convention of `${interfaceName}-utils.ts`.

## Two module shapes

- **Stateless interfaces** (default): named async exports, one per route handler. Used when the target interface module is importable without configuration.
- **Factory interfaces**: `export default function createXInterface(...config)`. Used when interface requires app configuration (e.g. `monograph-message-interface.ts`).

## Interface rules

- Each DB action which alters the DB state must be done within a transaction.
- Each DB action which alters the DB state must be confirmed using validators located at `src/interfaces/shared-interface-utils.ts`. If number of changes is unexpected, an error must be thrown so that the transaction is not committed.
- Prefer simple automatically controlled transactions (`await db.transaction().execute(async trx => {...})`) over manually controlled transaction (`await db.startTransaction()`). Manual transactions are allowed, if there is a need to pass the transaction between functions.
- Interface should always throw ApiError when possible
- Input validation happens at the middleware level using Zod schemas, but validation regarding data conflicts (e.g., refusing to assign already assigned identifier) is responsibility of interface
- Return values must utilize DTL function or construct a new Object that is returned to avoid including any Object attributes accidentally
- All interface functions must be exported and used by some controller. The interface function tests are integration tests defined in routers section.

## Do not

- Define interface function that is not used by a router
- Define interface function that does not have appropriate integration tests in router level
- Use raw SQL queries
- Write large interface functions. Instead split logic into reasonable subfunctions to the interfaces utils file.
