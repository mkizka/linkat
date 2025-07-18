import {
  ArrowRightIcon,
  AtSymbolIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Main, RootLayout } from "~/components/layout";
import { i18nServer } from "~/i18n/i18n";
import { getSessionUserDid } from "~/server/oauth/session";
import { cn } from "~/utils/cn";
import { env } from "~/utils/env";
import { createMeta } from "~/utils/meta";

import type { Route } from "./+types/_index";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const userDid = await getSessionUserDid(request);
  const t = await i18nServer.getFixedT(request);
  return {
    isLogin: !!userDid,
    title: t("_index.meta-title"),
    description: t("_index.meta-description"),
    url: env.PUBLIC_URL,
  };
};

export const meta = ({ data }: Route.MetaArgs) => {
  if (!data) {
    return [];
  }
  const { title, description, url } = data;
  return createMeta({ title, description, url });
};

export default function Index({ loaderData }: Route.ComponentProps) {
  const { isLogin } = loaderData;
  const { t, i18n } = useTranslation();
  return (
    <RootLayout isLogin={isLogin}>
      <Main className="utils--center">
        <div className="text-center">
          <h2
            className={cn(
              "whitespace-pre-line font-bold",
              i18n.language === "ja" ? "text-4xl" : "text-3xl",
            )}
          >
            {t("_index.hero-text")}
          </h2>
          <div className="mt-12 flex flex-col items-center gap-2">
            {isLogin ? (
              <Link
                to="/edit"
                className="btn btn-primary w-64"
                data-testid="index__edit-link"
              >
                <PencilSquareIcon className="size-6" />
                {t("_index.edit-link")}
              </Link>
            ) : (
              <Link to="/login" className="btn-bluesky btn w-64 text-base-100">
                <AtSymbolIcon className="-ml-4 size-6" />
                {t("_index.login-link")}
              </Link>
            )}
            <Link to="/sample" className="btn btn-neutral w-64">
              <ArrowRightIcon className="size-6" />
              {t("_index.sample-link")}
            </Link>
            <div className={cn("flex flex-col gap-2 mt-8")}>
              <p>
                <Link to="/about" className="underline">
                  {t("_index.notes-link")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Main>
    </RootLayout>
  );
}
