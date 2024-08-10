import { server } from "~/mocks/server";

import { initialize, resetSequence } from "../app/.server/generated/fabbrica";

// env
vi.mock("~/.server/server-env", () => ({
  PUBLIC_BSKY_URL: "https://public.api.example.com",
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
