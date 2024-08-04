import { server } from "~/mocks/server";

import { initialize, resetSequence } from "../app/.server/generated/fabbrica";

// prisma
vi.mock("~/.server/db/prisma", () => ({
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
