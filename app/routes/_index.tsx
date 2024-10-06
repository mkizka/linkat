import { ArrowRightIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Main, RootLayout } from "~/components/layout";
import { BlueskyIcon } from "~/features/board/card/icons/bluesky";
import { i18nServer } from "~/i18n/i18n";
import { getSessionUserDid } from "~/server/oauth/session";
import { env } from "~/utils/env";
import { createMeta } from "~/utils/meta";
import { required } from "~/utils/required";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userDid = await getSessionUserDid(request);
  const t = await i18nServer.getFixedT(request);
  return {
    isLogin: !!userDid,
    title: t("_index.meta-title"),
    url: env.PUBLIC_URL,
  };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const { title, url } = required(data);
  return createMeta({ title, url });
};

export default function Index() {
  const { isLogin } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  return (
    <RootLayout>
      <Main className="utils--center">
        <div className="text-center">
          <h2 className="whitespace-pre-line text-4xl font-bold">
            {t("_index.hero-text")}
          </h2>
          <div className="mt-12 flex flex-col items-center gap-2">
            {isLogin ? (
              <Link to="/edit" className="btn btn-primary w-64">
                <PencilSquareIcon className="size-6" />
                {t("_index.edit-link")}
              </Link>
            ) : (
              <Link to="/login" className="btn-bluesky btn w-64 text-base-100">
                <BlueskyIcon className="size-6" />
                {t("_index.login-with-bluesky")}
              </Link>
            )}
            <Link to="/sample" className="btn btn-neutral w-64">
              <ArrowRightIcon className="size-6" />
              {t("_index.sample-link")}
            </Link>
          </div>
        </div>
      </Main>
    </RootLayout>
  );
}
