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
      return (
        <UmamiProvider>
          <Stub initialEntries={[parameters.path ?? "/"]} />
        </UmamiProvider>
      );
    },
  ],
};

export default preview;
