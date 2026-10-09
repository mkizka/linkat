import "../app/tailwind.css";

import type { Preview } from "@storybook/react-vite";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { createRoutesStub } from "react-router";

import { UmamiProvider } from "../app/hooks/useUmami";
import { i18nConfig } from "../app/i18n/config";

void i18next.use(initReactI18next).init({ ...i18nConfig, lng: "ja" });

const preview: Preview = {
  decorators: [
    (Story, { parameters }) => {
      const Stub = createRoutesStub([
        { path: "*", Component: Story, action: () => null },
      ]);
      const stub = <Stub initialEntries={[parameters.path ?? "/"]} />;
      return (
        <UmamiProvider>
          {parameters.layout === "fullscreen" ? (
            <div className="flex min-h-svh flex-col bg-base-300">{stub}</div>
          ) : (
            stub
          )}
        </UmamiProvider>
      );
    },
  ],
};

export default preview;
