import { useLayoutEffect } from "react";
import { ClientOnly } from "remix-utils/client-only";

type Props = {
  blueskyUri: string;
};

function ClientBlueskyEmbed({ blueskyUri }: Props) {
  useLayoutEffect(() => {
    window.bluesky?.scan?.();
  }, [blueskyUri]);
  return (
    // カードの並べ替え時にReactがエラーを出すのを防ぐためにdivで囲む
    // おそらくblockquoteがscan()によって消えることが原因
    <div>
      <blockquote data-bluesky-uri={blueskyUri} />
    </div>
  );
}

function Fallback() {
  return (
    // 縦幅は埋め込まれる投稿が1行の時のだいたいのサイズ
    <div className="flex h-32 w-full items-center justify-center">
      <div className="loading loading-spinner size-8" />
    </div>
  );
}

export function BlueskyEmbed({ blueskyUri }: Props) {
  return (
    <ClientOnly fallback={<Fallback />}>
      {() => <ClientBlueskyEmbed blueskyUri={blueskyUri} />}
    </ClientOnly>
  );
}
