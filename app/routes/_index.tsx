/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useAtom } from "jotai";

import { loginAtom, resumeSessionAtom } from "~/atoms/userAtom";

export default function Index() {
  const [, login] = useAtom(loginAtom);
  const [, resume] = useAtom(resumeSessionAtom);

  return (
    <div className="flex">
      <button
        className="btn btn-primary"
        onClick={() =>
          login({
            service: import.meta.env.VITE_BSKY_URL,
            identifier: import.meta.env.VITE_BSKY_USERNAME,
            password: import.meta.env.VITE_BSKY_PASSWORD,
          })
        }
      >
        Login
      </button>
      <button className="btn btn-secondary" onClick={() => resume()}>
        Resume
      </button>
    </div>
  );
}
