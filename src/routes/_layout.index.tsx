import { createFileRoute } from "@tanstack/react-router";
import TextareaAutosize from "react-textarea-autosize"; // 1. Import the component

export const Route = createFileRoute("/_layout/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex h-full flex-col justify-center items-center bg-background">
      <div className="h-full w-full max-w-3xl flex flex-col justify-center items-center">
        <div className="flex-1 w-full space-y-4 overflow-y-auto p-4 md:p-8">
          <div className="space-y-2 w-full">
            <h2 className="text-3xl font-bold tracking-tight w-full">Chat</h2>
          </div>
        </div>
        <div className="bg-background p-4 md:p-8 w-full">
          <div className="relative w-full">
            <TextareaAutosize
              placeholder="Start a new chat..."
              minRows={5}
              maxRows={15}
              className="w-full resize-none rounded-lg border bg-background px-4 py-3 pr-12 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
