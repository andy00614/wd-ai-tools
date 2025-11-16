import "@testing-library/jest-dom";
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "vitest" {
    // biome-ignore lint/suspicious/noExplicitAny: extending vitest assertions with testing-library matchers
    interface Assertion<T = any>
        extends jest.Matchers<void, T>,
            TestingLibraryMatchers<T, void> {}
    // biome-ignore lint/suspicious/noExplicitAny: extending vitest assertions with testing-library matchers
    interface AsymmetricMatchersContaining<T = any>
        extends jest.Matchers<void, T>,
            TestingLibraryMatchers<T, void> {}
}
