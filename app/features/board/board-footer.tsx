import { useTranslation } from "react-i18next";
import { Link } from "react-router";

type Props = {
  showCreateLink: boolean;
};

export function BoardFooter({ showCreateLink }: Props) {
  const { t } = useTranslation();
  return (
    <>
      {showCreateLink && (
        <Link to="/" className="btn mt-4" data-umami-event="click-create-link">
          {t("board-footer.create-link")}
        </Link>
      )}
      <Link
        to="/"
        className="mx-auto py-6 text-sm font-bold text-base-content/60"
      >
        Linkat
      </Link>
    </>
  );
}
