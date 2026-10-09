import { BackButton } from "~/components/back-button";
import { Card } from "~/components/card";
import { Footer, Main } from "~/components/layout";

type Props = {
  about: {
    title: string;
    content: string;
  };
};

export function AboutPage({ about }: Props) {
  return (
    <>
      <Main>
        <Card className="my-4">
          <div className="card-body">
            <BackButton />
            <article className="prose">
              <h1 className="text-3xl">{about.title}</h1>
              <div dangerouslySetInnerHTML={{ __html: about.content }} />
            </article>
          </div>
        </Card>
      </Main>
      <Footer />
    </>
  );
}
