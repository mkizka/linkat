import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ClientOnly } from "remix-utils/client-only";

type Props = {
  blueskyUri: string;
};

function Spinner() {
  return (
    // 縦幅は埋め込まれる投稿が1行の時のだいたいのサイズ
    <div className="flex h-32 w-full items-center justify-center [grid-area:1/1]">
      <div className="loading loading-spinner size-8" />
    </div>
  );
}

function ClientBlueskyEmbed({ blueskyUri }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useLayoutEffect(() => {
    window.bluesky?.scan?.();
  }, [blueskyUri]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onLoad = () => setLoaded(true);
    el.addEventListener("load", onLoad, true);
    return () => el.removeEventListener("load", onLoad, true);
  }, []);

  return (
    <div ref={ref} className="grid">
      {!loaded && <Spinner />}
      {/* カードの並べ替え時にReactがエラーを出すのを防ぐためにdivで囲む
          おそらくblockquoteがscan()によって消えることが原因 */}
      <div className="[grid-area:1/1]">
        <blockquote data-bluesky-uri={blueskyUri} />
      </div>
    </div>
  );
}

export function BlueskyEmbed({ blueskyUri }: Props) {
  return (
    <ClientOnly fallback={<Spinner />}>
      {() => <ClientBlueskyEmbed blueskyUri={blueskyUri} />}
    </ClientOnly>
  );
}
