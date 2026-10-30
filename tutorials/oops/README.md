# OOP in Playwright — Tutorial Index

Nine runnable lessons, one OOP idea each. Every `.spec.ts` file is self-contained:
the class definitions and the tests that use them live together, so you can read
it top-to-bottom like a lesson.

Each file opens with a header that lists:

- the OOP concepts it covers,
- why that concept matters in Playwright,
- the exact command to run just that file.

---

## How to run

Run the whole OOP folder:

```bash
npx playwright test --config=tutorials/playwright.config.ts oops
```

Run one lesson:

```bash
npx playwright test --config=tutorials/playwright.config.ts oops/03-inheritance.spec.ts
```

Watch the browser while it runs:

```bash
npx playwright test --config=tutorials/playwright.config.ts oops --headed
```

The `--config` flag points at `tutorials/playwright.config.ts` (`testDir: '.'`),
so the main `tests/` suite is not touched.

---

## Lesson map

| File | OOP concepts | Playwright use |
| --- | --- | --- |
| `01-classes-and-objects.spec.ts` | class, object/instance, constructor, properties, methods, `this`, `new` | A Page Object class: `HomePage` wraps a `Page` |
| `02-encapsulation.spec.ts` | encapsulation, `private`/`public`/`protected`, `readonly`, getters/setters, guard clauses | Hide locators behind `search('term')` |
| `03-inheritance.spec.ts` | `extends`, `super()`, method overriding, `protected`, code reuse | `BasePage` → `HomePage` / `DocsPage` |
| `04-polymorphism.spec.ts` | polymorphism, dynamic dispatch, abstract base type, upcasting, overloading note | One loop visits many page classes |
| `05-abstraction.spec.ts` | abstraction, abstract class/methods, template method pattern, protected steps | `BaseFlow` template with concrete test flows |
| `06-interfaces.spec.ts` | interface, `implements`, multiple interfaces, interface inheritance, optional props, structural typing | `PageComponent` contract, typed test data |
| `07-composition.spec.ts` | composition, "has-a", delegation, constructor injection | `DocsPage` owns `NavBar` + `SearchDialog` |
| `08-static-members-and-factories.spec.ts` | static properties/methods, class-level state, factory method, private constructor | `SitePage.BASE_URL` and `SitePage.create(page)` |
| `09-solid-principles.spec.ts` | SRP, OCP, LSP, ISP, DIP, dependency injection | The framework-level code-review checklist |

### Suggested reading order

`01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09`

Classes → hiding internals → reuse → many forms → contracts → composition → rules.

---

## Where this goes in a real framework

These lessons keep the class and its test in one file so each lesson reads in one
pass. In a real suite you would move the classes into their own modules, exactly
like this repo already does:

- `tests/pages/LoginPage.ts` — a page object class
- `tests/fixtures/loginFixture.ts` — a fixture that injects page objects

The OOP rules are identical — only the file layout changes.
