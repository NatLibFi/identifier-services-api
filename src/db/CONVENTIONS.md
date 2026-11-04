# Database conventions

## Role

Database handler layer definitions for Kysely. Defines models that an interface (domain layer) may use to construct SQL queries. No HTTP handling (responsibility of routers and controllers), business logic (responsibility of interfaces) or validation (responsibility of Zod middleware).

## Structure

Monograph and serial types are located in separate subfolders within types folder (e.g., `types/monograph`). Cross-domain models live at types folder root (e.g., `types/message-template.ts`).

## DB typing rules

- Every type must follow definitions defined within `sql/` folder located at project root
- Primary key is always of type `Generated<number>`. Junction tables are no exception to this.

## Do not

- Define anything else than types and interfaces within files in `types/`
