# Controllers conventions

## Role

Express handler layer: read request data, delegate to an interface (domain layer), write HTTP response. No business logic or db access (responsibility of interfaces), no validation (responsibility of Zod middleware).

## Structure

Monograph and serial controllers in separate subfolders. Cross-domain controllers live at folder root (e.g., melinda-controller).

## Two module shapes

- **Stateless controllers** (default): named async exports, one per route handler. Used when the target interface module is importable without configuration (e.g. `issn-range-controller.ts`).
- **Factory controllers**: `export default function createXControllers(...config)` closing over a configured interface instance. Used when the interface module is a factory requiring app configuration (e.g. `monograph-message-controller.ts`). Mirrors interface shape as configuration requirement comes from interface.

## Handler rules

- Every handler needs to be contained within try-catch. Catch-block always forwards the error. E.g., `try { ... } catch (error) { return next(error); }`
- Expected error conditions may be signalled by throwing `ApiError` within the try-block; the central error middleware converts it to a Problem document.
- Always use HttpStatus constants instead of magic numbers.

## Do not

- Catch and handle errors locally — always `next(error)`
- Import local code other than interfaces. Type imports are allowed.
