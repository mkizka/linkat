import { ArrowRightIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { Main, RootLayout } from "~/components/layout";
import { BlueskyIcon } from "~/features/board/card/icons/bluesky";
import { getSessionUserDid } from "~/server/oauth/session";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userDid = await getSessionUserDid(request);
  return { isLogin: !!userDid };
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
          <p className="py-6">
            プロフィール欄に収まらない
            <br />
            情報をまとめて共有
          </p>
          <div className="flex flex-col gap-2">
            {isLogin ? (
              <Link to="/edit" className="btn btn-primary">
                <PencilSquareIcon className="size-6" />
                ページを編集
              </Link>
            ) : (
              <Link to="/login" className="btn bg-bluesky text-base-100">
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
