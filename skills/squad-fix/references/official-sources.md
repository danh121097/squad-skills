# Bugfix official sources

A bug is diagnosed against the behavior the platform actually documents, not against a remembered API. Use
the owning stack's primary documentation for the repository's exact versions. Every entry below is already
carried by the squad registry of the role that owns that layer; this index routes cross-stack diagnosis and
adds no source of its own.

This is a routing surface, not permission to upgrade a dependency, install a tool, or apply an example
without resolving the target and authority first.

## Platform behavior

- Web platform/MDN: https://developer.mozilla.org/docs/Web
- HTML/CSS/HTTP standards: https://html.spec.whatwg.org/ , https://www.w3.org/TR/css/ , https://httpwg.org/specs/
- HTTP semantics: https://www.rfc-editor.org/rfc/rfc9110
- Node.js: https://nodejs.org/docs/latest/api/
- Python: https://docs.python.org/3/
- Go: https://go.dev/doc/
- Rust: https://doc.rust-lang.org/
- Apple UI frameworks: https://developer.apple.com/documentation/swiftui and
  https://developer.apple.com/documentation/uikit
- Apple app lifecycle/background: https://developer.apple.com/documentation/uikit/app-and-environment
- Android lifecycle: https://developer.android.com/topic/libraries/architecture/lifecycle

## Contracts and data

- OpenAPI: https://spec.openapis.org/oas/latest.html
- GraphQL: https://spec.graphql.org/
- gRPC: https://grpc.io/docs/
- PostgreSQL: https://www.postgresql.org/docs/current/
- MongoDB: https://www.mongodb.com/docs/
- Redis: https://redis.io/docs/latest/

## Reproduction and evidence

- Vitest: https://vitest.dev/guide/
- Jest: https://jestjs.io/docs/getting-started
- pytest: https://docs.pytest.org/
- Playwright: https://playwright.dev/docs/intro
- Testing Library: https://testing-library.com/docs/
- axe-core: https://github.com/dequelabs/axe-core
- Appium: https://appium.io/docs/en/latest/
- OpenTelemetry: https://opentelemetry.io/docs/
- GitHub Actions: https://docs.github.com/actions
- Docker: https://docs.docker.com/
- Kubernetes: https://kubernetes.io/docs/

## Classification and severity

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP Cheat Sheets: https://cheatsheetseries.owasp.org/
- CWE: https://cwe.mitre.org/
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Core Web Vitals: https://web.dev/articles/vitals

When a symptom crosses layers, read the owning layer's documentation before the one the symptom appeared
in, and record the version and date checked alongside the finding.
