# QA and testing official sources

Use primary docs for exact runner/framework versions and standards.

## Test frameworks and browser

- Vitest: https://vitest.dev/guide/
- Jest: https://jestjs.io/docs/getting-started
- Node test runner: https://nodejs.org/api/test.html
- pytest: https://docs.pytest.org/
- Hypothesis: https://hypothesis.readthedocs.io/
- Go testing/fuzzing: https://go.dev/doc/tutorial/add-a-test and https://go.dev/doc/security/fuzz/
- Rust testing: https://doc.rust-lang.org/book/ch11-00-testing.html
- JUnit: https://junit.org/junit5/docs/current/user-guide/
- .NET testing: https://learn.microsoft.com/dotnet/core/testing/
- Playwright: https://playwright.dev/docs/intro
- Cypress: https://docs.cypress.io/
- Selenium/WebDriver: https://www.selenium.dev/documentation/ and https://www.w3.org/TR/webdriver2/
- Testing Library: https://testing-library.com/docs/

## Contracts, data, load, and mobile

- Pact: https://docs.pact.io/
- Testcontainers: https://testcontainers.com/
- k6: https://grafana.com/docs/k6/latest/
- Appium: https://appium.io/docs/en/latest/
- Android testing: https://developer.android.com/training/testing
- Apple XCTest/XCUITest: https://developer.apple.com/documentation/xctest/
- Flutter testing: https://docs.flutter.dev/testing

## Quality standards

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/
- OWASP Web Security Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- OWASP MASVS/MASTG: https://mas.owasp.org/
- Core Web Vitals: https://web.dev/articles/vitals
- OpenTelemetry: https://opentelemetry.io/docs/

Do not assume a tool's default timeout, browser, retry, isolation or coverage semantics; verify the exact
project version and configuration.
