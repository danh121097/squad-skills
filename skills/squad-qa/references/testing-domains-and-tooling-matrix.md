# Testing domains and tooling matrix

Use to choose evidence by risk, stack and boundary. Existing repository runners and patterns win; never
install tools mechanically.

## Test levels

- **Static/type/lint/schema:** fast contract and syntax feedback; not runtime proof.
- **Unit/property:** pure logic, invariants, state machines and generative boundaries.
- **Component/view/widget:** rendered semantics, interaction, states and accessibility in isolation.
- **Integration:** real boundaries between modules and DB/cache/broker/filesystem/provider substitutes.
- **Contract:** consumer/provider schema, errors, compatibility and event/API semantics.
- **End-to-end:** critical user/system journeys through deployed-like boundaries.
- **Exploratory:** new risks, usability and environment interactions not encoded yet.
- **Non-functional:** security, accessibility, visual, performance/load/soak, resilience and recovery.

Choose the lowest level that can fail for the real reason; add a higher-level journey only when the
integration risk warrants it. Avoid fixed test percentages and duplicated assertions across layers.

## Stack matrix

| Domain | Common native tools | Key evidence |
|---|---|---|
| JS/TS | Vitest, Jest, Node test, Testing Library | modules, components, API clients, types/build |
| React/Vue/Svelte/Angular | framework Testing Library/test utilities, Playwright/Cypress | states, router/data/store, hydration, browser flow |
| Python | pytest, unittest, hypothesis, tox/nox | domain/API/DB, properties, environment matrix |
| Go | go test, fuzz, race detector, benchmarks, testcontainers | concurrency, contracts, DB/network boundaries |
| Rust | cargo test/nextest, proptest, clippy, criterion | ownership/concurrency, properties, performance |
| JVM | JUnit, TestNG, Kotest, Spring test, Testcontainers | service/context, contracts, DB/messaging |
| .NET | xUnit/NUnit/MSTest, WebApplicationFactory, Testcontainers | services, APIs, persistence, hosting |
| PHP/Ruby | PHPUnit/Pest, RSpec/Minitest, framework test tools | routes/domain/jobs/data |
| React Native/Expo | Jest/Testing Library, Maestro/Detox/Appium, native tools | JS/native boundaries, navigation/device flow |
| Flutter | flutter test/integration_test, Patrol/Appium | widget/state/navigation/platform integration |
| iOS | XCTest/XCUITest, Xcode test plans | logic/UI/lifecycle/native APIs/performance |
| Android | JUnit, Robolectric, Compose UI, Espresso, Macrobenchmark | lifecycle/UI/device/performance |
| APIs | repository client, Supertest/httpx, Postman/Newman where established | status/schema/errors/auth/idempotency |
| Contracts | Pact, schema/protobuf/OpenAPI compatibility tooling | consumer/provider and backward compatibility |
| Data | Testcontainers/ephemeral DB, migration framework | constraints, transactions, queries, migration/restore |
| Infra | IaC validate/plan/test, container/K8s policy and smoke tools | rendered diff, permissions, rollout/rollback |
| Browser | Playwright/Cypress/WebDriver | critical flow, cross-browser, console/network/a11y |
| Load | k6, Gatling, Locust, JMeter or existing harness | SLO, saturation, errors, recovery and cost |

## Specialized techniques

- Property-based testing for parsers, validators, state transitions and invariants.
- Fuzzing for untrusted parsers/protocols and memory-safe/unsafe boundaries.
- Mutation testing to assess assertion strength selectively, not as a vanity score.
- Model/state-machine testing for complex workflows, offline sync and concurrency.
- Fault injection/chaos in controlled environments for resilience assumptions.
- Snapshot/visual tests only for intentional stable output with reviewable diffs.

## Selection output

Map risk → boundary → test type → environment → fixture/data → oracle/assertion → failure artifact. State
why omitted test levels add little confidence or require unavailable infrastructure.
