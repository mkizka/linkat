import { server } from "~/mocks/server";

import { disconnectTruncatePool, truncateAllTables } from "./truncate";

// common
afterEach(() => {
  vi.useRealTimers();
});

beforeEach(async () => {
  await truncateAllTables();
});

afterAll(async () => {
  await disconnectTruncatePool();
});

// msw
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
