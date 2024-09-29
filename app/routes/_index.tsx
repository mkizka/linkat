import { ArrowRightIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { Main, RootLayout } from "~/components/layout";
import { BlueskyIcon } from "~/features/board/card/icons/bluesky";
import { getSessionUserDid } from "~/server/oauth/session";
import { env } from "~/utils/env";
import { required } from "~/utils/required";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userDid = await getSessionUserDid(request);
  return { isLogin: !!userDid, ogImageUrl: `${env.PUBLIC_URL}/icon.png` };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const { ogImageUrl } = required(data);
  return [
    {
      title: "Linkat | シンプルなリンク集を作ろう",
    },
    {
      property: "og:image",
      content: ogImageUrl,
    },
  ];
};

export default function Index() {
  const { isLogin } = useLoaderData<typeof loader>();
  return (
    <RootLayout>
      <Main className="utils--center">
        <div className="text-center">
          <h2 className="text-4xl font-bold">
            シンプルな
            <br />
            リンク集を作ろう
          </h2>
          <div className="mt-12 flex flex-col gap-2">
            {isLogin ? (
              <Link to="/edit" className="btn btn-primary">
                <PencilSquareIcon className="size-6" />
                ページを編集
              </Link>
            ) : (
              <Link to="/login" className="btn-bluesky btn text-base-100">
                <BlueskyIcon className="size-6" />
                Bluesky でログイン
              </Link>
            )}
            <Link to="/sample" className="btn btn-neutral">
              <ArrowRightIcon className="size-6" />
              サンプルを見る
            </Link>
          </div>
        </div>
      </Main>
    </RootLayout>
  );
}
