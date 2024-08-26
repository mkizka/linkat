import { initialize, resetSequence } from "~/.server/generated/fabbrica";
import { server } from "~/mocks/server";

// common
afterEach(() => {
  vi.useRealTimers();
});
vi.mock("~/utils/env", () => ({
  env: {
    BSKY_PUBLIC_API_URL: "https://public.api.example.com",
  },
}));

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
