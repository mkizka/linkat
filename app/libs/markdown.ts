import type { MarkdownIt } from "markdown-it";

export const externalLinkAttributes = (md: MarkdownIt) => {
  const defaultRender = md.renderer.rules.link_open;

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const link = tokens[idx];
    if (!link) {
      return defaultRender
        ? defaultRender(tokens, idx, options, env, self)
        : self.renderToken(tokens, idx, options);
    }

    link.attrSet("target", "_blank");
    link.attrSet("rel", "noopener noreferrer");

    return defaultRender
      ? defaultRender(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options);
  };
};
