import { isRouteErrorResponse, Link, useRouteError } from "@remix-run/react";

import { Card } from "~/components/card";
import { createLogger } from "~/utils/logger";

// https://unsplash.com/ja/%E5%86%99%E7%9C%9F/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%B3%E3%83%BC%E3%83%88%E3%81%AE%E7%99%BD%E3%81%A8%E9%BB%84%E8%A4%90%E8%89%B2%E3%81%AE%E7%8A%AC-BrtCGcrZd10
import errorImage from "./error-image.jpg";

const logger = createLogger("error-boundary");

function ErrorPage(props: { title: string; text: string }) {
  return (
    <div className="utils--center">
      <Card>
        <figure>
          <img src={errorImage} alt="悲しい表情をした犬の画像" />
        </figure>
        <div className="card-body">
          <h1 className="card-title">{props.title}</h1>
          <p>{props.text}</p>
          <div className="card-actions mt-2 items-end justify-end">
            <p className="text-sm text-gray-400">
              画像は
              <a
                className="text-primary"
                href="https://unsplash.com/ja/%E5%86%99%E7%9C%9F/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%B3%E3%83%BC%E3%83%88%E3%81%AE%E7%99%BD%E3%81%A8%E9%BB%84%E8%A4%90%E8%89%B2%E3%81%AE%E7%8A%AC-BrtCGcrZd10"
                target="_blank"
                rel="noreferrer"
              >
                Unsplash
              </a>
              より
            </p>
            <Link to="/" className="btn btn-neutral btn-md">
              トップページに戻る
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <ErrorPage title="404" text="ページが見つかりませんでした。" />;
  }
  logger.error("ErrorBoundaryがエラーをキャッチしました", { error });
  return (
    <ErrorPage
      title="エラー"
      text="予期しないエラーが発生しました。しばらくしてから再度お試しください。"
    />
  );
}
