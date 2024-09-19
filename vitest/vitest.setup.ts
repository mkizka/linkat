import { initialize, resetSequence } from "~/generated/fabbrica";
import { server } from "~/mocks/server";

// common
afterEach(() => {
  vi.useRealTimers();
});

// prisma
vi.mock("~/server/service/prisma", () => ({
  prisma: vPrisma.client,
}));
beforeAll(() => {
  initialize({
    prisma: () => vPrisma.client,
  });
});
beforeEach(() => resetSequence());

// msw
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
