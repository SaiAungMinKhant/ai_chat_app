import { type ReactNode, useMemo, useState } from "react";
import { ChevronDown, Globe, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useChatVisibility } from "@/hooks/use-chat-visibility";

export type VisibilityType = "private" | "public";

const visibilities: Array<{
  id: VisibilityType;
  label: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    id: "private",
    label: "Private",
    description: "Only you can access this chat",
    icon: <Lock size={16} />,
  },
  {
    id: "public",
    label: "Public",
    description: "Anyone with the link can access this chat",
    icon: <Globe size={16} />,
  },
];

export function VisibilitySelector({
  chatId,
  className,
  selectedVisibilityType,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);

  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId,
    initialVisibilityType: selectedVisibilityType,
  });

  const selectedVisibility = useMemo(
    () => visibilities.find((visibility) => visibility.id === visibilityType),
    [visibilityType],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          "w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
          className,
        )}
      >
        <Button
          data-testid="visibility-selector"
          variant="outline"
          className="hidden md:flex md:px-2 md:h-fit gap-1.5 rounded-full"
        >
          {selectedVisibility?.icon}
          <span className="hidden md:inline">
            {selectedVisibility?.label}
          </span>{" "}
          <ChevronDown size={16} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="rounded-3xl p-1">
        {visibilities.map((visibility) => (
          <DropdownMenuItem
            data-testid={`visibility-selector-item-${visibility.id}`}
            key={visibility.id}
            onSelect={() => {
              void setVisibilityType(visibility.id);
              setOpen(false);
            }}
            className="gap-4 group/item flex flex-row justify-between items-center rounded-2xl"
            data-active={visibility.id === visibilityType}
          >
            <div className="flex flex-col gap-1 items-start">
              {visibility.label}
              {visibility.description && (
                <div className="text-xs text-muted-foreground">
                  {visibility.description}
                </div>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
