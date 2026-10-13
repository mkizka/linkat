import { Main, RootLayout } from "~/components/layout";
import { AboutArticle } from "~/features/about/about-article";

type Props = {
  about: {
    title: string;
    content: string;
  };
};

export function AboutPage({ about }: Props) {
  return (
    <RootLayout>
      <Main>
        <AboutArticle title={about.title} content={about.content} />
      </Main>
    </RootLayout>
  );
}
