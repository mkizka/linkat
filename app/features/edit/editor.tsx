import { type ComponentProps, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useBeforeUnload, useBlocker } from "react-router";

import { Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";
import { useUmami } from "~/hooks/useUmami";

type Props = Pick<ComponentProps<typeof BoardViewer>, "board" | "url"> & {
  editor: ComponentProps<typeof BoardViewer>["owner"];
};

export function Editor({ editor, board, url }: Props) {
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
