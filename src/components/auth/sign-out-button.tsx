import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "../ui/button";

export function SignOutButton() {
  const { signOut } = useAuthActions();
  return (
    <>
      <Button variant="default" onClick={() => void signOut()}>
        Sign out
      </Button>
    </>
  );
}
