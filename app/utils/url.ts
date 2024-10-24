import { LinkatAgent } from "~/libs/agent";

// https://bsky.app/profile/example.com
export const isBlueskyProfileUrl = (url: URL) => {
  const paths = url.pathname.split("/");
  return (
    url.hostname === "bsky.app" && paths[1] === "profile" && paths.length === 3
  );
};

// https://bsky.app/profile/example.com/post/12345...
export const isBlueskyPostUrl = (url: URL) => {
  const paths = url.pathname.split("/");
  return (
    url.hostname === "bsky.app" &&
    paths[1] === "profile" &&
    paths[3] === "post" &&
    paths.length === 5
  );
};

// https://bsky.app/profile/did:plc:.../feed/12345...
export const isBlueskyFeedUrl = (url: URL) => {
  const paths = url.pathname.split("/");
  return (
    url.hostname === "bsky.app" &&
    paths[1] === "profile" &&
    paths[3] === "feed" &&
    paths.length === 5
  );
};

// https://twitter.com/x
// https://x.com/x
export const isTwitterProfileUrl = (url: URL) => {
  const paths = url.pathname.split("/");
  return ["twitter.com", "x.com"].includes(url.hostname) && paths.length === 2;
};

// https://github.com/github
export const isGitHubProfileUrl = (url: URL) => {
  const paths = url.pathname.split("/");
  return url.hostname === "github.com" && paths.length === 2;
};

// https://bsky.app/profile/example.com/post/hijklmnop...
// ↓
// https://bsky.app/profile/did:plc:abcdefg.../post/hijklmnop...
export const resolveHandleIfNeeded = async (original: string) => {
  const url = new URL(original);
  if (!isBlueskyPostUrl(url)) {
    return original;
  }
  const [_, profile, handle, ...rest] = url.pathname.split("/");
  if (!handle || handle.startsWith("did:")) {
    return original;
  }
  const publicAgent = LinkatAgent.credential();
  const response = await publicAgent.resolveHandle({ handle });
  const resolvedUrl = new URL(url.origin);
  resolvedUrl.pathname = "/" + [profile, response.data.did, ...rest].join("/");
  return resolvedUrl.toString();
};

// https://bsky.app/profile/did:plc:abcdefg.../post/hijklmnop...
// ↓
// at://did:plc:abcdefg.../app.bsky.feed.post/hijklmnop...
export const atUri = (url: URL, collection: string) => {
  const [_, _profile, did, _post, tid] = url.pathname.split("/");
  return `at://${did}/${collection}/${tid}`;
};
