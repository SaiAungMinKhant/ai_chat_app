import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "../components/auth/sign-in-form";

export const Route = createFileRoute("/")({
  component: () => (
    <>
      <Authenticated>
        <Index />
      </Authenticated>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
    </>
  ),
});

function Index() {
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
    </div>
  );
}
