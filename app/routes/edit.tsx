import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  redirect,
  useBeforeUnload,
  useBlocker,
  useFetcher,
} from "react-router";
import { setToast } from "remix-toast/middleware";

import { Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";
import { SyncError } from "~/features/edit/sync-error";
import { SyncLoading } from "~/features/edit/sync-loading";
import { useUmami } from "~/hooks/useUmami";
import { getInstance } from "~/i18n/i18n";
import { Board } from "~/models/board";
import { di } from "~/server/di";
import {
  BoardDbSaveError,
  BoardPdsSaveError,
} from "~/server/service/boardEventService/boardEvent";
import { env } from "~/utils/env";
import { tryCatch } from "~/utils/tryCatch";

import type { Route } from "./+types/edit";
import type { action as syncAction } from "./sync";

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
    di.logger.warn("boardの形式が不正でした", { error: parsedBoard });
    setToast(context, {
      message: i18next.t("edit.invalid-form-error-message"),
      type: "error",
    });
    return null;
  }
  try {
    await di.boardEventService.handleEditorSave(parsedBoard);
  } catch (error) {
    if (error instanceof BoardPdsSaveError) {
      di.logger.error(error.message, { error });
      setToast(context, {
        message: i18next.t("edit.save-board-error-message"),
        type: "error",
      });
      return null;
    }
    if (error instanceof BoardDbSaveError) {
      di.logger.error(error.message, { error });
      setToast(context, {
        message: i18next.t("edit.save-delayed-warning-message"),
        type: "warning",
      });
      const editor = (await di.ownerService.findOwner(editorDid)).toView();
      return redirect(`/${editor.handleOrDid}`);
    }
    throw error;
  }
  const editor = (await di.ownerService.findOwner(editorDid)).toView();
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

  return <BoardViewer owner={editor} board={board} url={url} editable />;
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const sync = useFetcher<typeof syncAction>();
  const submitSync = () =>
    sync.submit(null, { method: "post", action: "/sync" });

  useEffect(() => {
    if (!loaderData.board && sync.state === "idle" && !sync.data) {
      void submitSync();
    }
  });

  if (loaderData.board || (sync.state === "idle" && sync.data?.ok)) {
    return (
      <Main>
        <Editor {...loaderData} />
      </Main>
    );
  }
  return (
    <Main className="utils--center">
      {sync.state !== "idle" || !sync.data ? (
        <SyncLoading />
      ) : (
        <SyncError onRetry={() => void submitSync()} />
      )}
    </Main>
  );
}
