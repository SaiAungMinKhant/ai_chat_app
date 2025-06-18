import {
  createFileRoute,
  useRouter,
  useCanGoBack,
} from "@tanstack/react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Key,
  Trash2,
  User,
  Mail,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: () => <SettingsPage />,
});

function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [decryptedApiKey, setDecryptedApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDecrypted, setIsLoadingDecrypted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const user = useQuery(api.myFunctions.getCurrentUser);
  const hasApiKey = useQuery(api.myFunctions.hasOpenRouterApiKey);
  const setOpenRouterApiKey = useAction(api.myFunctions.setOpenRouterApiKey);
  const getDecryptedApiKey = useAction(api.myFunctions.getDecryptedApiKey);
  const deleteOpenRouterApiKey = useMutation(
    api.myFunctions.deleteOpenRouterApiKey,
  );
  const router = useRouter();
  const canGoBack = useCanGoBack();

  // Load decrypted API key when user has one
  useEffect(() => {
    if (hasApiKey && !decryptedApiKey && !isLoadingDecrypted) {
      setIsLoadingDecrypted(true);
      getDecryptedApiKey()
        .then((key) => {
          setDecryptedApiKey(key);
        })
        .catch((err) => {
          console.error("Failed to load decrypted API key:", err);
          setError("Failed to load API key");
        })
        .finally(() => {
          setIsLoadingDecrypted(false);
        });
    }
  }, [hasApiKey, decryptedApiKey, isLoadingDecrypted, getDecryptedApiKey]);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    setOpenRouterApiKey({ apiKey: apiKey.trim() })
      .then(() => {
        setSuccess("API key saved successfully!");
        setApiKey("");
        // Reload the decrypted key
        setDecryptedApiKey(null);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to save API key");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleDeleteApiKey = () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    deleteOpenRouterApiKey()
      .then(() => {
        setSuccess("API key deleted successfully!");
        setDecryptedApiKey(null);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to delete API key");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          {canGoBack ? (
            <Button
              onClick={() => router.history.back()}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : null}
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>
              Your account information and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={
                    user?.image ||
                    `https://avatar.vercel.sh/${user?.email || "user"}`
                  }
                  alt={user?.name || "User"}
                />
                <AvatarFallback className="text-lg font-medium">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">
                  {user?.name || "User"}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {user?.email || "No email provided"}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Member since{" "}
                  {user?._creationTime
                    ? formatDate(user._creationTime)
                    : "Unknown"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage your OpenRouter API keys for accessing AI models.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Current API Key Display */}
            {hasApiKey && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  Active API Key
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={
                      isLoadingDecrypted
                        ? "Loading..."
                        : showApiKey
                          ? decryptedApiKey || "Error loading key"
                          : decryptedApiKey
                            ? `${decryptedApiKey.substring(0, 8)}...${decryptedApiKey.substring(decryptedApiKey.length - 4)}`
                            : "Error loading key"
                    }
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                    disabled={isLoadingDecrypted}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteApiKey}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {isLoadingDecrypted && (
                  <p className="text-xs text-muted-foreground">
                    Loading your API key...
                  </p>
                )}
              </div>
            )}

            <Separator />

            {/* Add New API Key */}
            {!hasApiKey && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                  No API key configured
                </div>
                <div className="space-y-2">
                  <label htmlFor="api-key" className="text-sm font-medium">
                    Add OpenRouter API Key
                  </label>
                  <div className="relative">
                    <Input
                      id="api-key"
                      type={showApiKey ? "text" : "password"}
                      placeholder="sk-or-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your API key starts with "sk-or-". Get one from{" "}
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      OpenRouter
                    </a>
                  </p>
                </div>
                <Button
                  onClick={handleSaveApiKey}
                  disabled={isLoading || !apiKey.trim()}
                >
                  {isLoading ? "Saving..." : "Save API Key"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
