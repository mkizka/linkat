import { UserIcon } from "@heroicons/react/24/solid";

import type { OwnerView } from "~/server/service/owner/ownerView";

export function EditorProfile({ editor }: { editor: OwnerView }) {
  return (
    <section className="flex flex-col items-center text-center">
      <div className="avatar avatar-placeholder mb-2">
        <div className="w-24 rounded-full bg-neutral text-neutral-content">
          {editor.avatarUrl ? (
            <img src={editor.avatarUrl} alt="" />
          ) : (
            <UserIcon className="w-14" />
          )}
        </div>
      </div>
      <h2 className="text-xl font-bold">{editor.displayName}</h2>
      <p className="text-base-content/70">{editor.displayHandle}</p>
    </section>
  );
}
