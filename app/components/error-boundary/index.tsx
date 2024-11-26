import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { isRouteErrorResponse, Link, useRouteError } from "react-router";

import { Card } from "~/components/card";
import { Main, RootLayout } from "~/components/layout";
import { createLogger } from "~/utils/logger";

// https://unsplash.com/ja/%E5%86%99%E7%9C%9F/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%B3%E3%83%BC%E3%83%88%E3%81%AE%E7%99%BD%E3%81%A8%E9%BB%84%E8%A4%90%E8%89%B2%E3%81%AE%E7%8A%AC-BrtCGcrZd10
import errorImage from "./error-image.jpg";

const logger = createLogger("error-boundary");

function ErrorPage(props: { title: string; text: string }) {
  const { t } = useTranslation();
  return (
    <RootLayout>
      <Main className="utils--center">
        <Card>
          <figure>
            <img src={errorImage} alt={t("error-boundary.image-alt")} />
          </figure>
          <div className="card-body">
            <h1 className="card-title">{props.title}</h1>
            <p>{props.text}</p>
            <div className="card-actions mt-2 items-end justify-end">
              <p className="text-sm text-gray-400">
                {t("error-boundary.image-source-start")}
                <a
                  className="text-primary"
                  href="https://unsplash.com/ja/%E5%86%99%E7%9C%9F/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%B3%E3%83%BC%E3%83%88%E3%81%AE%E7%99%BD%E3%81%A8%E9%BB%84%E8%A4%90%E8%89%B2%E3%81%AE%E7%8A%AC-BrtCGcrZd10"
                  target="_blank"
                  rel="noreferrer"
                >
                  Unsplash
                </a>
                {t("error-boundary.image-source-end")}
              </p>
              <Link to="/" className="btn btn-neutral btn-md">
                {t("error-boundary.back-to-top")}
              </Link>
            </div>
          </div>
        </Card>
      </Main>
    </RootLayout>
  );
}

export function ErrorBoundary() {
  const { t } = useTranslation();
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  useEffect(() => {
    if (notFound) {
      void umami.track("show-404-page", {
        path: location.pathname,
      });
    } else {
      void umami.track("show-error-page", {
        path: location.pathname,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }, [error, notFound]);

  if (notFound) {
    return (
      <ErrorPage title="404" text={t("error-boundary.not-found-message")} />
    );
  }
  logger.error("ErrorBoundaryがエラーをキャッチしました", {
    error: String(error),
  });
  return <ErrorPage title="Error" text={t("error-boundary.error-message")} />;
}
