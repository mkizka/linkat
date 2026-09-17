import { initialize, resetSequence } from "~/generated/fabbrica";
import { server } from "~/mocks/server";
import { prisma } from "~/server/infrastructure/prisma";

import { disconnectTruncatePool, truncateAllTables } from "./truncate";

// common
afterEach(() => {
  vi.useRealTimers();
});

// prisma
beforeAll(() => {
  initialize({ prisma: () => prisma });
});

beforeEach(async () => {
  resetSequence();
  await truncateAllTables();
});

afterAll(async () => {
  await prisma.$disconnect();
  await disconnectTruncatePool();
});

// msw
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
