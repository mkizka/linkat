import { useLayoutEffect } from "react";

type Props = {
  blueskyUri: string;
};

export function BlueskyEmbed({ blueskyUri }: Props) {
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
