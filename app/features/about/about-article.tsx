import { Card } from "~/components/card";

type Props = {
  title: string;
  content: string;
};

export function AboutArticle({ title, content }: Props) {
  return (
    <Card className="my-4">
      <div className="card-body">
        <article className="prose">
          <h1 className="text-3xl">{title}</h1>
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </article>
      </div>
    </Card>
  );
}
