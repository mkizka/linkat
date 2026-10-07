import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  redirect,
  useBeforeUnload,
  useBlocker,
  useFetcher,
} from "react-router";
import { setToast } from "remix-toast/middleware";

import { Button } from "~/components/button";
import { Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";
import { useUmami } from "~/hooks/useUmami";
import { getInstance } from "~/i18n/i18n";
import { Board } from "~/models/board";
import { di } from "~/server/di";
import {
  BoardDbSaveError,
  BoardPdsSaveError,
} from "~/server/service/boardEventService/boardEvent";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

import type { Route } from "./+types/edit";
import type { action as syncAction } from "./sync";

const logger = createLogger("edit");

export async function action({ request, context }: Route.ActionArgs) {
  const i18next = getInstance(context);
  const editorDid = await di.sessionService.getSessionDid(request);
  if (!editorDid) {
    setToast(context, {
      message: i18next.t("edit.invalid-session-error-message"),
      type: "error",
    });
    return redirect("/login", {
      headers: {
        "Set-Cookie": await di.sessionService.destroySession(request),
      },
    });
  }
  const form = await request.formData();
  const rawBoard = form.get("board");
  if (typeof rawBoard !== "string") {
    setToast(context, {
      message: i18next.t("edit.invalid-form-error-message"),
      type: "error",
    });
    return null;
  }
  const parsedBoard = await tryCatch(() =>
    Board.fromRecord(editorDid, JSON.parse(rawBoard)),
  )();
  if (parsedBoard instanceof Error) {
    logger.warn({ error: parsedBoard }, "boardの形式が不正でした");
    setToast(context, {
      message: i18next.t("edit.invalid-form-error-message"),
      type: "error",
    });
    return null;
  }
  try {
    await di.boardEventService.publishBoard(parsedBoard);
  } catch (error) {
    if (error instanceof BoardPdsSaveError) {
      logger.error(error, error.message);
      setToast(context, {
        message: i18next.t("edit.save-board-error-message"),
        type: "error",
      });
      return null;
    }
    if (error instanceof BoardDbSaveError) {
      logger.error(error, error.message);
      setToast(context, {
        message: i18next.t("edit.save-delayed-warning-message"),
        type: "warning",
      });
      const editor = await di.editorService.findView(editorDid);
      return redirect(`/${editor.handleOrDid}`);
    }
    throw error;
  }
  const editor = await di.editorService.findView(editorDid);
  return redirect(`/${editor.handleOrDid}?success`);
}

export async function loader({ request }: Route.LoaderArgs) {
  const editorDid = await di.sessionService.getSessionDid(request);
  if (!editorDid) {
    throw redirect("/login");
  }
  const [editor, board] = await Promise.all([
    di.editorService.findView(editorDid),
    di.boardService.findBoard(editorDid),
  ]);
  return {
    editor,
    board: board && { cards: board.cards },
    url: `${env.PUBLIC_URL}/${editor.handleOrDid}`,
  };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { editor, board, url } = loaderData;
  const { t } = useTranslation();
  const umami = useUmami();
  const sync = useFetcher<typeof syncAction>();
  const submitSync = () =>
    sync.submit(null, { method: "post", action: "/sync" });

  useEffect(() => {
    if (!board && sync.state === "idle" && !sync.data) {
      void submitSync();
    }
  });

  // 更新ボタンを押したりしたときに確認ダイアログを出す
  useBeforeUnload((event) => {
    umami.track("unload-edit");
    event.preventDefault();
  });

  // 戻るボタンを押したりしたときに確認ダイアログを出す
  const blocker = useBlocker(
    ({ currentLocation, nextLocation, historyAction }) =>
      // 保存ボタンを押したときの移動以外のとき
      (currentLocation.pathname !== nextLocation.pathname &&
        nextLocation.pathname !== `/${editor.handleOrDid}`) ||
      // /alice.testから/editに移動して戻るとき
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      historyAction === "POP",
  );

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (confirm(t("edit.confirm-leave-message"))) {
      umami.track("leave-edit", {
        action: "confirm",
      });
      blocker.proceed();
    } else {
      umami.track("leave-edit", {
        action: "cancel",
      });
      blocker.reset();
    }
  }, [t, blocker, umami]);

  if (!board && (sync.state !== "idle" || !sync.data)) {
    return (
      <Main>
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="loading loading-spinner w-14" />
          <p>{t("edit.sync-loading-message")}</p>
        </div>
      </Main>
    );
  }

  if (!board && !sync.data?.ok) {
    return (
      <Main>
        <div className="flex flex-col items-center gap-4 py-16">
          <p>{t("edit.sync-error-message")}</p>
          <Button className="btn-primary" onClick={() => void submitSync()}>
            {t("edit.sync-retry-button")}
          </Button>
        </div>
      </Main>
    );
  }

  return (
    <Main>
      <BoardViewer owner={editor} board={board} url={url} editable />
    </Main>
  );
}
