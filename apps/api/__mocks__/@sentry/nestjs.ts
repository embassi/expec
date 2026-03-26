// Sentry no-op mock for unit tests — prevents real Sentry network calls
export const captureException = jest.fn();
export const withScope = jest.fn((cb: (scope: any) => void) =>
  cb({ setTag: jest.fn() }),
);
export const init = jest.fn();
