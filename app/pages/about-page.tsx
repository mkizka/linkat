import { Card } from "~/components/card";
import { Main, RootLayout } from "~/components/layout";

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
        <Card className="my-4">
          <div className="card-body">
            <article className="prose">
              <h1 className="text-3xl">{about.title}</h1>
              <div dangerouslySetInnerHTML={{ __html: about.content }} />
            </article>
          </div>
        </Card>
      </Main>
    </RootLayout>
  );
}
