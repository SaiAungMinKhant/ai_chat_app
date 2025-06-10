import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export function SignInForm() {
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
