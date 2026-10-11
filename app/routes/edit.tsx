import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Form,
  Link,
  redirect,
  useBeforeUnload,
  useBlocker,
  useNavigation,
} from "react-router";

import { Button } from "~/components/button";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Main } from "~/components/layout";
import { ProfileCard } from "~/features/board/card/profile-card";
import { SortableCardList } from "~/features/board/card/sortable-card-list";
import {
  CardFormModal,
  cardModal,
} from "~/features/board/form/card-form-modal";
import type { CardFormPayload } from "~/features/board/form/card-form-provider";
import { CardFormProvider } from "~/features/board/form/card-form-provider";
import { RouteToaster } from "~/features/toast/route";
import { useUmami } from "~/hooks/useUmami";
import { getInstance } from "~/i18n/i18n";
import type { ValidCard } from "~/models/card";
import { di } from "~/server/di";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";
import { resolveHandleIfNeeded } from "~/utils/url";

import type { Route } from "./+types/edit";

const logger = createLogger("edit");

export async function action({ request, context }: Route.ActionArgs) {
  const i18next = getInstance(context);
  const [user, agent] = await Promise.all([
    di.sessionService.getSessionUser(request),
    di.sessionService.getSessionAgent(request),
  ]);
  if (!user || !agent) {
    return { error: i18next.t("edit.invalid-session-error-message") };
  }
  const form = await request.formData();
  const rawBoard = form.get("board");
  if (typeof rawBoard !== "string") {
    return { error: i18next.t("edit.invalid-form-error-message") };
  }
  // 1. 楽観的にDBを更新
  const parsedBoard = await di.boardService.parseBoardFromForm(
    user.did,
    rawBoard,
  );
  if (parsedBoard instanceof Error) {
    logger.warn({ error: parsedBoard }, "boardの形式が不正でした");
    return { error: i18next.t("edit.invalid-form-error-message") };
  }
  await di.boardService.saveBoard(parsedBoard);
  try {
    // 2. PDSにも保存
    await agent.updateBoard(parsedBoard);
  } catch (error) {
    logger.error(error, "PDSへのボードの保存に失敗しました");
  }
  // 3. 閲覧ページにリダイレクト
  return redirect(`/${user.handle}?success`);
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await di.sessionService.getSessionUser(request);
  if (!user) {
    throw redirect("/login");
  }
  const board = await di.boardService.findOrFetchBoard(user.did);
  return {
    user,
    board: board && { cards: board.cards },
    url: `${env.PUBLIC_URL}/${user.handle}`,
  };
}

const withId = (card: ValidCard) => ({
  ...card,
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  id: crypto.randomUUID() as string,
});

const toBoardJson = (cards: (ValidCard & { id: string })[]) =>
  JSON.stringify({ cards: cards.map(({ id: _, ...card }) => card) });

export default function Edit({ loaderData }: Route.ComponentProps) {
  const { user, board, url } = loaderData;
  const { t } = useTranslation();
  const umami = useUmami();
  const navigation = useNavigation();
  const [cards, setCards] = useState(() => (board?.cards ?? []).map(withId));
  const [initialBoardJson] = useState(() => toBoardJson(cards));
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const boardJson = toBoardJson(cards);
  const isDirty = boardJson !== initialBoardJson;
  const isSaving = navigation.state !== "idle";

  useBeforeUnload((event) => {
    if (!isDirty) return;
    umami.track("unload-edit");
    event.preventDefault();
  });

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      !isSaving &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  const handleSubmitCardForm = async (payload: CardFormPayload) => {
    const resolvedUrl =
      payload.url && (await resolveHandleIfNeeded(payload.url));
    if (payload.id) {
      setCards((cards) =>
        cards.map((card) =>
          card.id === payload.id
            ? {
                id: payload.id,
                text: payload.text,
                emoji: payload.emoji,
                url: resolvedUrl,
              }
            : card,
        ),
      );
    } else {
      setCards((cards) => [...cards, withId({ ...payload, url: resolvedUrl })]);
    }
    cardModal.close();
  };

  const handleDeleteCard = () => {
    setCards((cards) => cards.filter((card) => card.id !== deletingCardId));
    setDeletingCardId(null);
    cardModal.close();
  };

  return (
    <>
      <header className="sticky top-0 z-10 bg-base-100 shadow">
        <div className="mx-auto grid w-full max-w-screen-sm grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2">
          <Link
            to={board ? `/${user.handle}` : "/"}
            className="btn justify-self-start"
            data-testid="edit-bar__cancel"
          >
            {t("edit.cancel-button")}
          </Link>
          <h1 className="font-bold">{t("edit.title")}</h1>
          <Form method="post" className="justify-self-end">
            <input name="board" type="hidden" value={boardJson} />
            <Button
              className="btn-primary"
              data-testid="edit-bar__submit"
              loading={isSaving}
              data-umami-event="click-submit-button"
              data-umami-event-cards={cards.length}
            >
              {t("edit.submit-button")}
            </Button>
          </Form>
        </div>
      </header>
      <Main>
        <CardFormProvider
          onSubmit={handleSubmitCardForm}
          onDelete={setDeletingCardId}
        >
          <div className="flex flex-col gap-2 py-4">
            <ProfileCard user={user} url={url} />
            <SortableCardList cards={cards} onChange={setCards} />
            <CardFormModal />
          </div>
        </CardFormProvider>
      </Main>
      <ConfirmDialog
        open={deletingCardId !== null}
        title={t("edit.confirm-delete-title")}
        description={t("edit.confirm-delete-description")}
        cancelLabel={t("edit.confirm-delete-cancel")}
        confirmLabel={t("edit.confirm-delete-confirm")}
        onCancel={() => setDeletingCardId(null)}
        onConfirm={handleDeleteCard}
      />
      <ConfirmDialog
        open={blocker.state === "blocked"}
        title={t("edit.confirm-leave-title")}
        description={t("edit.confirm-leave-description")}
        cancelLabel={t("edit.confirm-leave-cancel")}
        confirmLabel={t("edit.confirm-leave-confirm")}
        onCancel={() => {
          umami.track("leave-edit", { action: "cancel" });
          blocker.reset?.();
        }}
        onConfirm={() => {
          umami.track("leave-edit", { action: "confirm" });
          blocker.proceed?.();
        }}
      />
      <RouteToaster />
    </>
  );
}
