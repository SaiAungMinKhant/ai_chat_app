import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

interface MarkdownProps {
  children: string;
}

interface ComponentProps {
  node?: unknown;
  children: React.ReactNode;
  [key: string]: unknown;
}

interface CodeProps {
  node?: unknown;
  inline?: boolean;
  className?: string;
  children?: string | string[];
  [key: string]: unknown;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-lg border bg-muted/40 font-mono">
      <div className="flex items-center justify-between border-b bg-muted px-4 py-1 text-xs text-muted-foreground">
        <span>{language}</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={copied ? "Copied" : "Copy code"}
          onClick={() => void copyToClipboard()}
          className="size-7 hover:bg-accent"
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </div>
      <SyntaxHighlighter
        style={resolvedTheme === "dark" ? oneDark : oneLight}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: "1rem",
          borderRadius: 0,
          background: "transparent",
          fontFamily: "inherit",
          fontSize: "0.875rem",
          lineHeight: "1.5",
        }}
        codeTagProps={{
          style: { background: "transparent", fontFamily: "inherit" },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

const markdownComponents: { [key: string]: React.ElementType } = {
  pre: ({ children }: ComponentProps) => <>{children}</>,

  code: ({ node: _node, inline, className, children, ...props }: CodeProps) => {
    if (inline) {
      return (
        <code
          className="bg-muted rounded px-1.5 py-0.5 text-[0.875em] font-mono break-words"
          {...props}
        >
          {children}
        </code>
      );
    }

    const language = /language-(\w+)/.exec(className || "")?.[1] ?? "text";
    return (
      <CodeBlock
        language={language}
        code={[children ?? ""].flat().join("").replace(/\n$/, "")}
      />
    );
  },

  ol: ({
    node: _node,
    ordered: _ordered,
    children,
    ...props
  }: ComponentProps) => (
    <ol className="list-decimal list-outside pl-6 my-3 space-y-1" {...props}>
      {children}
    </ol>
  ),

  ul: ({
    node: _node,
    ordered: _ordered,
    children,
    ...props
  }: ComponentProps) => (
    <ul className="list-disc list-outside pl-6 my-3 space-y-1" {...props}>
      {children}
    </ul>
  ),

  h1: ({ node: _node, children, ...props }: ComponentProps) => (
    <h1 className="text-2xl font-semibold mt-6 mb-3" {...props}>
      {children}
    </h1>
  ),

  h2: ({ node: _node, children, ...props }: ComponentProps) => (
    <h2 className="text-xl font-semibold mt-5 mb-2" {...props}>
      {children}
    </h2>
  ),

  h3: ({ node: _node, children, ...props }: ComponentProps) => (
    <h3 className="text-lg font-semibold mt-4 mb-2" {...props}>
      {children}
    </h3>
  ),

  p: ({ node: _node, children, ...props }: ComponentProps) => (
    <p className="my-3 whitespace-pre-wrap break-words" {...props}>
      {children}
    </p>
  ),

  blockquote: ({ node: _node, children, ...props }: ComponentProps) => (
    <blockquote
      className="border-l-2 border-border pl-4 my-3 text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  ),

  a: ({ node: _node, children, ...props }: ComponentProps) => (
    <a
      className="text-primary underline underline-offset-4"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),

  table: ({ node: _node, children, ...props }: ComponentProps) => (
    <div className="overflow-x-auto my-4">
      <table
        className="min-w-full border-collapse border border-border text-sm"
        {...props}
      >
        {children}
      </table>
    </div>
  ),

  th: ({
    node: _node,
    isHeader: _isHeader,
    children,
    ...props
  }: ComponentProps) => (
    <th
      className="border border-border bg-muted px-3 py-2 text-left font-semibold"
      {...props}
    >
      {children}
    </th>
  ),

  td: ({
    node: _node,
    isHeader: _isHeader,
    children,
    ...props
  }: ComponentProps) => (
    <td className="border border-border px-3 py-2" {...props}>
      {children}
    </td>
  ),

  hr: ({ node: _node, ...props }: Omit<ComponentProps, "children">) => (
    <hr className="my-6 border-border" {...props} />
  ),
};

const NonMemoizedMarkdownRenderer: React.FC<MarkdownProps> = ({
  children: markdown,
}) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={markdownComponents}
      className="w-full min-w-0 break-words leading-relaxed text-foreground [&>:first-child]:mt-0 [&>:last-child]:mb-0"
    >
      {markdown}
    </ReactMarkdown>
  );
};

export const MarkdownRenderer = React.memo(
  NonMemoizedMarkdownRenderer,
  (prev, next) => prev.children === next.children,
);
