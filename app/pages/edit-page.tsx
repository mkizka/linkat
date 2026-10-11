import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Form,
  Link,
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
import { SyncError } from "~/features/edit/sync-error";
import { SyncLoading } from "~/features/edit/sync-loading";
import { useUmami } from "~/hooks/useUmami";
import type { ValidCard } from "~/models/card";
import type { OwnerView } from "~/server/service/owner/ownerView";
import { resolveHandleIfNeeded } from "~/utils/url";

type EditorProps = {
  editor: OwnerView;
  board: { cards: ValidCard[] } | null;
  url: string;
};

const withId = (card: ValidCard) => ({
  ...card,
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  id: crypto.randomUUID() as string,
});

const toBoardJson = (cards: (ValidCard & { id: string })[]) =>
  JSON.stringify({ cards: cards.map(({ id: _, ...card }) => card) });

function Editor({ editor, board, url }: EditorProps) {
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
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2">
          <Link
            to={board ? `/${editor.handleOrDid}` : "/"}
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
            <ProfileCard owner={editor} url={url} />
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
    </>
  );
}

type Props = EditorProps & {
  syncState: "ready" | "loading" | "error";
  onRetrySync: () => void;
};

export function EditPage({ syncState, onRetrySync, ...editorProps }: Props) {
  if (syncState === "ready") {
    return <Editor {...editorProps} />;
  }
  return (
    <Main className="utils--center">
      {syncState === "loading" ? (
        <SyncLoading />
      ) : (
        <SyncError onRetry={onRetrySync} />
      )}
    </Main>
  );
}
