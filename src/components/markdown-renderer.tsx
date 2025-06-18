import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarkdownProps {
  children: string;
}

interface ComponentProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: string;
  [key: string]: any;
}

const CodeBlockHeader: React.FC<{ language: string; code: string }> = ({
  language,
  code,
}) => {
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
    <div className="flex items-center justify-between bg-zinc-800 text-zinc-300 px-4 py-2 text-xs border-b border-zinc-700">
      <span className="font-mono uppercase">{language}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void copyToClipboard()}
        className="h-6 w-6 p-0 hover:bg-zinc-700"
      >
        {copied ? (
          <Check size={12} className="text-green-400" />
        ) : (
          <Copy size={12} />
        )}
      </Button>
    </div>
  );
};

const markdownComponents: { [key: string]: React.ElementType } = {
  code: ({ node, inline, className, children, ...props }: ComponentProps) => {
    const match = /language-(\w+)/.exec(className || "");
    const isCodeBlock = !inline && match;

    if (isCodeBlock) {
      const codeString = String(children).replace(/\n$/, "");
      return (
        <div className="my-3 rounded-lg overflow-hidden border border-zinc-700">
          <CodeBlockHeader language={match[1]} code={codeString} />
          <div className="overflow-x-auto">
            <SyntaxHighlighter
              style={coldarkDark}
              language={match[1]}
              PreTag="div"
              customStyle={{
                margin: 0,
                borderRadius: 0,
                fontSize: "0.875rem",
                lineHeight: "1.5",
                minWidth: "100%",
                padding: "1rem",
              }}
              {...props}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        </div>
      );
    }

    return (
      <code
        className={`
          text-sm
          bg-zinc-200
          dark:bg-zinc-800
          text-zinc-800
          dark:text-zinc-200
          py-0.5 px-1.5
          rounded-md
          font-mono
          border
          border-zinc-300
          dark:border-zinc-700
          break-words
        `}
        {...props}
      >
        {children}
      </code>
    );
  },

  ol: ({ node, children, ...props }: ComponentProps) => (
    <ol
      className="list-decimal list-inside ml-4 mt-2 mb-3 leading-relaxed"
      {...props}
    >
      {children}
    </ol>
  ),

  ul: ({ node, children, ...props }: ComponentProps) => (
    <ul
      className="list-disc list-inside ml-4 mt-2 mb-3 leading-relaxed"
      {...props}
    >
      {children}
    </ul>
  ),

  li: ({ node, children, ...props }: ComponentProps) => (
    <li className="" {...props}>
      {children}
    </li>
  ),

  h1: ({ children, ...props }: ComponentProps) => (
    <h1
      className="text-3xl font-bold mt-6 mb-2 text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700 pb-2"
      {...props}
    >
      {children}
    </h1>
  ),

  h2: ({ children, ...props }: ComponentProps) => (
    <h2
      className="text-2xl font-semibold mt-4 mb-1.5 text-zinc-800 dark:text-zinc-200"
      {...props}
    >
      {children}
    </h2>
  ),

  h3: ({ children, ...props }: ComponentProps) => (
    <h3
      className="text-xl font-medium mt-3 mb-1 text-zinc-700 dark:text-zinc-300"
      {...props}
    >
      {children}
    </h3>
  ),

  p: ({ children, ...props }: ComponentProps) => (
    <p
      className="mb-2 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words leading-relaxed"
      {...props}
    >
      {children}
    </p>
  ),

  blockquote: ({ children, ...props }: ComponentProps) => (
    <blockquote
      className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 my-2 italic text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 py-2 rounded-r-md"
      {...props}
    >
      {children}
    </blockquote>
  ),

  a: ({ children, href, ...props }: ComponentProps & { href?: string }) => (
    <a
      href={href}
      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 transition-colors duration-200"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),

  table: ({ children, ...props }: ComponentProps) => (
    <div className="overflow-x-auto my-3">
      <table
        className="min-w-full border-collapse border border-zinc-300 dark:border-zinc-700"
        {...props}
      >
        {children}
      </table>
    </div>
  ),

  th: ({ children, ...props }: ComponentProps) => (
    <th
      className="border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-left font-semibold"
      {...props}
    >
      {children}
    </th>
  ),

  td: ({ children, ...props }: ComponentProps) => (
    <td
      className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
      {...props}
    >
      {children}
    </td>
  ),

  hr: ({ ...props }) => (
    <hr
      className="my-5 border-0 h-px bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent"
      {...props}
    />
  ),
};

const NonMemoizedMarkdownRenderer: React.FC<MarkdownProps> = ({
  children: markdown,
}) => {
  return (
    <div className="markdown-content w-full overflow-hidden">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
        className="prose dark:prose-invert max-w-none break-words overflow-hidden"
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export const MarkdownRenderer = React.memo(
  NonMemoizedMarkdownRenderer,
  (prev, next) => prev.children === next.children,
);
