import { mockDeep } from "vitest-mock-extended";

import { createLogger } from "~/server/infrastructure/logger";

const mockedLogger = mockDeep<ReturnType<typeof createLogger>>();

vi.mock("~/server/infrastructure/logger");
const mockedCreateLogger = vi.mocked(createLogger);
mockedCreateLogger.mockReturnValue(mockedLogger);

export { mockedLogger };
