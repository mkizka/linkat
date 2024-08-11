import { initialize, resetSequence } from "~/.server/generated/fabbrica";
import { server } from "~/mocks/server";

// prisma
vi.mock("~/.server/service/prisma", () => ({
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
