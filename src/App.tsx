"use client";

import {
  Authenticated,
  Unauthenticated,
  useConvexAuth,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { ThemeProvider } from "./components/theme-provider";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Separator } from "./components/ui/separator";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <header className="sticky top-0 z-10 p-4 flex justify-between items-center border-b">
        <h1 className="text-xl font-bold">AI Chat App</h1>
        <SignOutButton />
      </header>
      <main className="container mx-auto p-8 flex flex-col gap-8">
        <Authenticated>
          <Content />
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </ThemeProvider>
  );
}

function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  return (
    <>
      {isAuthenticated && (
        <Button variant="outline" onClick={() => void signOut()}>
          Sign out
        </Button>
      )}
    </>
  );
}

function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setError(null);
    signIn("google")
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to sign in with Google",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handlePasswordSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const formData = new FormData(e.target as HTMLFormElement);
    formData.set("flow", flow);
    signIn("password", formData)
      .catch((error) => {
        setError(error instanceof Error ? error.message : "Failed to sign in");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Card className="w-[400px] mx-auto">
      <CardHeader>
        <CardTitle>{flow === "signIn" ? "Sign In" : "Sign Up"}</CardTitle>
        <CardDescription>
          {flow === "signIn" ? "Welcome back!" : "Create your account"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <svg
            className="mr-2 h-4 w-4"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            ></path>
          </svg>
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handlePasswordSignIn}>
          <Input
            type="email"
            name="email"
            placeholder="Email"
            disabled={isLoading}
            required
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            disabled={isLoading}
            required
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {flow === "signIn" ? "Sign in" : "Sign up"}
          </Button>
          <div className="flex items-center justify-center gap-2 text-sm">
            <span>
              {flow === "signIn"
                ? "Don't have an account?"
                : "Already have an account?"}
            </span>
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              disabled={isLoading}
            >
              {flow === "signIn" ? "Sign up" : "Sign in"}
            </Button>
          </div>
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function Content() {
  const { viewer, numbers } =
    useQuery(api.myFunctions.listNumbers, {
      count: 10,
    }) ?? {};
  const addNumber = useMutation(api.myFunctions.addNumber);

  if (viewer === undefined || numbers === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome {viewer ?? "Anonymous"}!</CardTitle>
          <CardDescription>
            Click the button below and open this page in another window - this
            data is persisted in the Convex cloud database!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => {
              void addNumber({ value: Math.floor(Math.random() * 10) });
            }}
          >
            Add a random number
          </Button>
          <div className="text-sm">
            Numbers:{" "}
            {numbers?.length === 0
              ? "Click the button!"
              : (numbers?.join(", ") ?? "...")}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResourceCard
          title="Convex docs"
          description="Read comprehensive documentation for all Convex features."
          href="https://docs.convex.dev/home"
        />
        <ResourceCard
          title="Stack articles"
          description="Learn about best practices, use cases, and more from a growing collection of articles, videos, and walkthroughs."
          href="https://www.typescriptlang.org/docs/handbook/2/basic-types.html"
        />
        <ResourceCard
          title="Templates"
          description="Browse our collection of templates to get started quickly."
          href="https://www.convex.dev/templates"
        />
        <ResourceCard
          title="Discord"
          description="Join our developer community to ask questions, trade tips & tricks, and show off your projects."
          href="https://www.convex.dev/community"
        />
      </div>
    </div>
  );
}

function ResourceCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          <a href={href} className="hover:underline">
            {title}
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
