/**
 * Shared ASCII file-tree renderer (`|-` / `` `-``).
 */

export function treeHref(view, params = {}) {
  const q = new URLSearchParams({ view, ...params });
  return `/?${q.toString()}`;
}

export function repoHref(repoPath, params = {}) {
  const q = new URLSearchParams({ view: "repo", path: repoPath, ...params });
  for (const [key, value] of Object.entries(params)) {
    if (key === "view" || value == null || value === "") continue;
    q.set(key, value);
  }
  q.set("view", "repo");
  q.set("path", repoPath);
  return `/?${q.toString()}`;
}

function escapeTreeLabel(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function statusSuffix(status) {
  if (!status || status === "live") return "";
  return ` <span class="tree-status">${status}</span>`;
}

/**
 * @param {object} node
 * @param {object} ctx
 * @param {string} branchPrefix
 * @param {boolean} isLast
 */
function renderTreeLines(node, ctx, branchPrefix, isLast) {
  const lines = [];
  const connector = isLast ? "`- " : "|- ";
  const childPrefix = branchPrefix + (isLast ? "   " : "|  ");

  const href = node.view && node.view !== "repo"
    ? treeHref(node.view, { ...ctx.linkParams, view: node.view })
    : node.repoPath
      ? repoHref(node.repoPath, ctx.linkParams)
      : node.view
        ? treeHref(node.view, { ...ctx.linkParams, view: node.view })
        : null;

  const isSelected =
    (node.view && node.view === ctx.activeView && !node.repoPath) ||
    (node.repoPath && ctx.activeView === "repo" && ctx.activePath === node.repoPath);

  if (node.children?.length) {
    if (href) {
      lines.push(
        `${branchPrefix}${connector}<a class="tree-link${isSelected ? " is-selected" : ""}" href="${href}"><span class="tree-dir">${escapeTreeLabel(node.label)}</span></a>${statusSuffix(node.status)}`
      );
    } else {
      lines.push(`${branchPrefix}${connector}<span class="tree-dir">${escapeTreeLabel(node.label)}</span>${statusSuffix(node.status)}`);
    }
    const kids = node.children;
    kids.forEach((child, index) => {
      lines.push(...renderTreeLines(child, ctx, childPrefix, index === kids.length - 1));
    });
    return lines;
  }

  if (href) {
    lines.push(
      `${branchPrefix}${connector}<a class="tree-link${isSelected ? " is-selected" : ""}" href="${href}">${escapeTreeLabel(node.label)}</a>${statusSuffix(node.status)}`
    );
  } else {
    lines.push(`${branchPrefix}${connector}<span class="tree-leaf">${escapeTreeLabel(node.label)}</span>${statusSuffix(node.status)}`);
  }

  return lines;
}

/**
 * @param {{ label: string, children?: object[] }} root
 * @param {{ activeView?: string, activePath?: string, linkParams?: Record<string,string>, ariaLabel: string, rootClass?: string }} options
 */
export function renderAsciiTreeHtml(root, options) {
  const ctx = {
    activeView: options.activeView ?? "home",
    activePath: options.activePath ?? "",
    linkParams: options.linkParams ?? {}
  };
  const lines = [`<span class="tree-root">${escapeTreeLabel(root.label)}</span>`];
  const kids = root.children ?? [];
  kids.forEach((child, index) => {
    lines.push(...renderTreeLines(child, ctx, "", index === kids.length - 1));
  });
  const rootClass = options.rootClass ?? "ascii-tree";
  return `<nav class="${rootClass}" aria-label="${escapeTreeLabel(options.ariaLabel)}">\n<pre class="tree-pre">${lines.join("\n")}</pre>\n</nav>`;
}