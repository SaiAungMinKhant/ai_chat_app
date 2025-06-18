import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "../ui/button";
import { useNavigate } from "@tanstack/react-router";

export function SignOutButton() {
  const { signOut } = useAuthActions();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: "/chat", search: { id: "" } });
  };

  return (
    <>
      <Button
        className="w-full"
        variant="destructive"
        onClick={() => void handleSignOut()}
      >
        Sign out
      </Button>
    </>
  );
}
