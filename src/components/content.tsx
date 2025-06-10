import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Separator } from "./ui/separator";

export function Content() {
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
