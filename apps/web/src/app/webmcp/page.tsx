/**
 * Lightweight page for WebMCP detection — avoids Clerk/app shell timeouts.
 * Tools are registered by the root WebMcpBootstrap script on all pages;
 * this route is an extra fast entry if scanners navigate here.
 */
export default function WebMcpPage() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 640 }}>
      <h1>linkedinpost.ai WebMCP</h1>
      <p>
        Browser tools are registered via <code>navigator.modelContext</code>{" "}
        (<code>provideContext</code> / <code>registerTool</code>).
      </p>
      <ul>
        <li>
          <code>navigate_to_page</code>
        </li>
        <li>
          <code>get_site_summary</code>
        </li>
        <li>
          <code>list_guides</code>
        </li>
      </ul>
      <p>
        <a href="/">Home</a> · <a href="/auth.md">auth.md</a> ·{" "}
        <a href="/.well-known/mcp/server-card.json">MCP Server Card</a>
      </p>
    </main>
  );
}
