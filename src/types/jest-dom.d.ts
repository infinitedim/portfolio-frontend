import "@testing-library/jest-dom";

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toBeInTheDocument(): T;
    toHaveClass(...classNames: (string | RegExp)[]): T;
    toHaveAttribute(attr: string, value?: unknown): T;
    toBeDisabled(): T;
    toBeEnabled(): T;
    toBeVisible(): T;
    toHaveValue(value?: unknown): T;
    toHaveTextContent(text: string | RegExp): T;
    toHaveFocus(): T;
    toBeChecked(): T;
    toBeEmptyDOMElement(): T;
    toBeInvalid(): T;
    toBeRequired(): T;
    toBeValid(): T;
    toContainElement(element: HTMLElement | null): T;
    toContainHTML(html: string): T;
    toHaveDescription(text?: string | RegExp): T;
    toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): T;
    toHaveErrorMessage(text?: string | RegExp): T;
    toHaveFormValues(values: Record<string, unknown>): T;
    toHaveStyle(css: string | Record<string, unknown>): T;
    toHaveAccessibleDescription(text?: string | RegExp): T;
    toHaveAccessibleName(text?: string | RegExp): T;
  }
}
