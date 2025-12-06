import { CodeBlock } from "@/types/content";
import { codeToHtml } from "shiki";
import { CodeBlockClient } from "./code-block-client";

type Props = CodeBlock["data"];

export async function CodeComponent({ content, language, filename }: Props) {
  try {
    const html = await codeToHtml(content, {
      lang: language || "text",
      theme: "one-dark-pro",
    });
    return <CodeBlockClient html={html} filename={filename} />;
  } catch (e) {
    console.error("Error generating code block HTML:", e);
    return <CodeBlockClient html={`<pre><code>${content}</code></pre>`} filename={filename} />;
  }
}
