import { initialize, resetSequence } from "~/generated/fabbrica";
import { server } from "~/mocks/server";
import { prisma } from "~/server/service/prisma";

// common
afterEach(() => {
  vi.useRealTimers();
});

// prisma
beforeAll(() => {
  initialize({ prisma: () => prisma });
});

const tablesToTruncate = ["Board", "User", "AuthSession", "AuthState"];

beforeEach(async () => {
  resetSequence();
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tablesToTruncate
      .map((t) => `"${t}"`)
      .join(", ")} RESTART IDENTITY CASCADE;`,
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});

// msw
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
