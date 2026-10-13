import type { ReactNode } from "react";

import { Card } from "~/components/card";

type Props = {
  title: string;
  children: ReactNode;
};

export function SettingsSection({ title, children }: Props) {
  return (
    <Card>
      <section className="card-body gap-4">
        <h2 className="text-sm font-bold text-base-content/70">{title}</h2>
        {children}
      </section>
    </Card>
  );
}
