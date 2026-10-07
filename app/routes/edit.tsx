import {
  ArrowPathIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
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
    di.ownerService.findOwner(editorDid),
    di.boardService.findBoard(editorDid),
  ]);
  const editorView = editor.toView();
  return {
    editor: editorView,
    board: board && { cards: board.cards },
    url: `${env.PUBLIC_URL}/${editorView.handleOrDid}`,
  };
}

function Editor({ editor, board, url }: Route.ComponentProps["loaderData"]) {
  const { t } = useTranslation();
  const umami = useUmami();

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

  return (
    <Main>
      <BoardViewer owner={editor} board={board} url={url} editable />
    </Main>
  );
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();
  const sync = useFetcher<typeof syncAction>();
  const submitSync = () =>
    sync.submit(null, { method: "post", action: "/sync" });

  useEffect(() => {
    if (!loaderData.board && sync.state === "idle" && !sync.data) {
      void submitSync();
    }
  });

  if (loaderData.board || (sync.state === "idle" && sync.data?.ok)) {
    return <Editor {...loaderData} />;
  }

  if (sync.state !== "idle" || !sync.data) {
    return (
      <Main>
        <div
          className="flex flex-col items-center gap-4 py-16 text-center"
          role="status"
        >
          <div className="loading loading-spinner w-12" />
          <p>{t("edit.sync-loading-message")}</p>
        </div>
      </Main>
    );
  }

  return (
    <Main>
      <div
        className="flex flex-col items-center gap-4 py-16 text-center"
        role="alert"
      >
        <ExclamationCircleIcon className="size-12 text-error" />
        <div>
          <p>{t("edit.sync-error-message")}</p>
          <p className="text-sm opacity-70">
            {t("edit.sync-error-description")}
          </p>
        </div>
        <Button className="btn-primary" onClick={() => void submitSync()}>
          <ArrowPathIcon className="size-5" />
          {t("edit.sync-retry-button")}
        </Button>
      </div>
    </Main>
  );
}
