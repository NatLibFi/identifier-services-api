# Data transformation layer (DTL) conventions

## Role

Layer responsible for explicitly defining response bodies (excluding file attachments). Used by interfaces as return value formatter. No DB access, HTTP handling (responsibility of routers and controllers), business logic (responsibility of interfaces) or validation (responsibility of Zod middleware).

## Structure

Monograph and serial DTL definitions are located in separate subfolders. Cross-domain DTL live at folder root (e.g., `message-template-dtl.ts`).

## DTL rules

- Every function return value must equal a type found within a file in `apidoc/schemas/responses`
- All returned objects must be defined as independent function parameters

## Do not

- Use spread operator `{...functionParameter}`
- Return given parameter directly. Instead always construct a brand new object in order to avoid passing excess properties.
