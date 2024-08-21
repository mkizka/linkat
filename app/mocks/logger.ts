import { mockDeep } from "vitest-mock-extended";

import { createLogger } from "~/utils/logger";

const mockedLogger = mockDeep<ReturnType<typeof createLogger>>();

vi.mock("~/utils/logger");
const mockedCreateLogger = vi.mocked(createLogger);
mockedCreateLogger.mockReturnValue(mockedLogger);

export { mockedLogger };
