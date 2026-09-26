import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";
import { RouterContextProvider } from "react-router";
import { getToast } from "remix-toast";
import { toastMiddleware } from "remix-toast/middleware";

import { i18nextMiddleware } from "~/i18n/i18n";
import { LinkatAgent } from "~/libs/agent";
import { server } from "~/mocks/server";
import { di } from "~/server/di";
import { UserFactory } from "~/server/factories/user";

import { action } from "./edit";

const cards = [{ url: "https://example.com", text: "edit.spec.tsのカード" }];

const putRecordUrl = "https://pds.example.com/xrpc/com.atproto.repo.putRecord";

const putRecordSucceeded = http.post(putRecordUrl, () =>
  HttpResponse.json({
    uri: "at://did:plc:1/blue.linkat.board/self",
    cid: "bafyreiflxe3gz7tg4jje5w4wypqjvz5d4zntrols22gwp7btg2nh2t7wxm",
  }),
);

// ルートと同じミドルウェアを通してactionを呼び出し、レスポンスとトーストを返す
const callAction = async () => {
  const user = await UserFactory.create();
  const did = asDid(user.did);
  const setCookie = await di.sessionService.createSession(
    new Request("http://localhost"),
    did,
  );
  vi.spyOn(di.sessionService, "getSessionAgent").mockResolvedValue(
    new LinkatAgent({ did, service: "https://pds.example.com" }),
  );
  const request = new Request("http://localhost/edit", {
    method: "POST",
    headers: { Cookie: setCookie },
    body: new URLSearchParams({ board: JSON.stringify({ cards }) }),
  });
  const args = {
    request,
    params: {},
    context: new RouterContextProvider(),
    url: new URL(request.url),
    pattern: "/edit",
  };
  const response = await toastMiddleware()(args, async () =>
    i18nextMiddleware(args, async () => {
      const result = await action(args);
      // React Routerと同じくnullもResponseとして扱い、トーストをCookieに書き込ませる
      return result instanceof Response ? result : Response.json(result);
    }),
  );
  if (!(response instanceof Response)) {
    throw new Error("レスポンスが返されませんでした");
  }
  const { toast } = await getToast(
    new Request("http://localhost", {
      headers: { Cookie: response.headers.get("Set-Cookie") ?? "" },
    }),
  );
  return { user, did, response, toast };
};

describe("edit action", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("PDSとDBに保存して閲覧ページにリダイレクトする", async () => {
    // arrange
    server.use(putRecordSucceeded);
    // act
    const { user, did, response, toast } = await callAction();
    // assert
    expect(response.headers.get("Location")).toBe(`/${user.handle}?success`);
    expect(toast).toBeUndefined();
    expect((await di.boardRepository.find(did))?.cards).toEqual(cards);
  });

  test("PDSへの保存に失敗したらDBに保存せずエラーを表示する", async () => {
    // arrange
    server.use(
      http.post(putRecordUrl, () =>
        HttpResponse.json({ error: "InternalServerError" }, { status: 500 }),
      ),
    );
    // act
    const { did, response, toast } = await callAction();
    // assert
    expect(response.headers.get("Location")).toBeNull();
    expect(toast).toMatchObject({
      message: "Failed to save the board",
      type: "error",
    });
    expect(await di.boardRepository.find(did)).toBeNull();
  });

  test("DBへの保存に失敗したら警告を表示して閲覧ページにリダイレクトする", async () => {
    // arrange
    server.use(putRecordSucceeded);
    vi.spyOn(di.boardService, "saveBoard").mockRejectedValue(new Error());
    // act
    const { user, response, toast } = await callAction();
    // assert
    expect(response.headers.get("Location")).toBe(`/${user.handle}`);
    expect(toast).toMatchObject({
      message:
        "The changes are taking a while to appear. Please wait a moment and reload.",
      type: "warning",
    });
  });
});
