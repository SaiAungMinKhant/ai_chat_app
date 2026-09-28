import { useId, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import {
  ChevronLeft,
  LayoutTemplate,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Skeleton } from "./ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type Template = Doc<"templates">;
type TemplateCategory = Template["category"];
type TemplateValues = Pick<
  Template,
  "name" | "description" | "content" | "category"
>;
type CategoryFilter = TemplateCategory | "all";

const CATEGORY_LABELS = {
  summary: "Summary",
  compare: "Compare",
  research: "Research",
  custom: "Custom",
} satisfies Record<TemplateCategory, string>;

const TEMPLATE_CATEGORIES = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({ value: value as TemplateCategory, label }),
);

type View =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "edit"; template: Template };

const VIEW_TITLES: Record<View["kind"], string> = {
  list: "Templates",
  create: "New template",
  edit: "Edit template",
};

export function TemplateDialog({
  onSelect,
  disabled,
}: {
  onSelect: (content: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const didSelect = useRef(false);

  const handleSelect = (content: string) => {
    didSelect.current = true;
    setOpen(false);
    onSelect(content);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground"
              aria-label="Templates"
              disabled={disabled}
            >
              <LayoutTemplate />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Templates</TooltipContent>
      </Tooltip>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-3xl max-h-[85vh] flex flex-col"
        onCloseAutoFocus={(e) => {
          // The composer takes focus after an insert; don't return it to the trigger.
          if (didSelect.current) e.preventDefault();
          didSelect.current = false;
        }}
      >
        <TemplatePanel onSelect={handleSelect} />
      </DialogContent>
    </Dialog>
  );
}

// Mounted only while the dialog is open, so the view resets on close and
// template queries don't run in the background.
function TemplatePanel({ onSelect }: { onSelect: (content: string) => void }) {
  const [view, setView] = useState<View>({ kind: "list" });
  const [category, setCategory] = useState<CategoryFilter>("all");
  const isAuthenticated = useQuery(api.auth.isAuthenticated);
  const createTemplate = useMutation(api.templates.createTemplate);
  const updateTemplate = useMutation(api.templates.updateTemplate);

  const showList = () => setView({ kind: "list" });
  const showCreate = () => setView({ kind: "create" });

  const saveTemplate = async (values: TemplateValues) => {
    const isEdit = view.kind === "edit";
    try {
      if (isEdit) {
        await updateTemplate({ templateId: view.template._id, ...values });
      } else {
        await createTemplate(values);
      }
      toast.success(isEdit ? "Template updated" : "Template created");
      showList();
    } catch {
      toast.error(
        isEdit ? "Failed to update template" : "Failed to create template",
      );
    }
  };

  return (
    <>
      <DialogHeader className="flex-row items-center gap-2 pr-8">
        {view.kind !== "list" && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Back"
            onClick={showList}
          >
            <ChevronLeft />
          </Button>
        )}
        <DialogTitle className="flex-1">{VIEW_TITLES[view.kind]}</DialogTitle>
        {view.kind === "list" && isAuthenticated && (
          <Button size="sm" onClick={showCreate}>
            <Plus />
            New template
          </Button>
        )}
      </DialogHeader>

      {view.kind === "list" ? (
        isAuthenticated === false ? (
          <SignedOutState />
        ) : (
          <TemplateList
            enabled={isAuthenticated === true}
            category={category}
            onCategoryChange={setCategory}
            onSelect={onSelect}
            onEdit={(template) => setView({ kind: "edit", template })}
            onCreate={showCreate}
          />
        )
      ) : (
        <TemplateForm
          initial={view.kind === "edit" ? view.template : undefined}
          onSubmit={saveTemplate}
          onCancel={showList}
        />
      )}
    </>
  );
}

function SignedOutState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <LayoutTemplate className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">Sign in to use templates</p>
        <p className="text-sm text-muted-foreground">
          Save prompts you reuse and insert them into any chat.
        </p>
      </div>
      <Button asChild size="sm">
        <Link to="/sign-in">Sign in</Link>
      </Button>
    </div>
  );
}

function TemplateList({
  enabled,
  category,
  onCategoryChange,
  onSelect,
  onEdit,
  onCreate,
}: {
  enabled: boolean;
  category: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  onSelect: (content: string) => void;
  onEdit: (template: Template) => void;
  onCreate: () => void;
}) {
  const templates = useQuery(
    api.templates.getUserTemplates,
    enabled ? {} : "skip",
  );
  const deleteTemplate = useMutation(api.templates.deleteTemplate);
  const [pendingDelete, setPendingDelete] = useState<Template | null>(null);

  const visibleTemplates = templates?.filter(
    (template) => category === "all" || template.category === category,
  );

  const confirmDelete = async (template: Template) => {
    try {
      await deleteTemplate({ templateId: template._id });
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete template");
    }
  };

  const chips: { value: CategoryFilter; label: string }[] = [
    { value: "all", label: "All" },
    ...TEMPLATE_CATEGORIES,
  ];

  return (
    <>
      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            aria-pressed={category === chip.value}
            onClick={() => onCategoryChange(chip.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              category === chip.value
                ? "bg-foreground text-background"
                : "border text-muted-foreground hover:bg-accent",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="-m-1 min-h-0 flex-1 overflow-y-auto p-1">
        {visibleTemplates === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : visibleTemplates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {category === "all"
                ? "No templates yet"
                : `No ${CATEGORY_LABELS[category].toLowerCase()} templates`}
            </p>
            <Button size="sm" variant="outline" onClick={onCreate}>
              <Plus />
              New template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleTemplates.map((template) => (
              <TemplateCard
                key={template._id}
                template={template}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDelete?.name}" will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => {
                if (pendingDelete) void confirmDelete(pendingDelete);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TemplateCard({
  template,
  onSelect,
  onEdit,
  onDelete,
}: {
  template: Template;
  onSelect: (content: string) => void;
  onEdit: (template: Template) => void;
  onDelete: (template: Template) => void;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => onSelect(template.content)}
        className="flex h-full w-full flex-col gap-1.5 rounded-xl border bg-card p-4 text-left transition-colors outline-none hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <div className="flex items-center gap-2 pr-7">
          <span className="truncate text-sm font-medium">{template.name}</span>
          <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {CATEGORY_LABELS[template.category]}
          </span>
        </div>
        {template.description && (
          <p className="truncate text-sm text-muted-foreground">
            {template.description}
          </p>
        )}
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {template.content}
        </p>
      </button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${template.name}`}
            className="absolute top-2.5 right-2.5 size-7 text-muted-foreground md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:data-[state=open]:opacity-100"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEdit(template)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onDelete(template)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function TemplateForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Template;
  onSubmit: (values: TemplateValues) => Promise<void>;
  onCancel: () => void;
}) {
  const id = useId();
  const [values, setValues] = useState<TemplateValues>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    content: initial?.content ?? "",
    category: initial?.category ?? "custom",
  });
  const [isSaving, setIsSaving] = useState(false);

  const canSubmit =
    values.name.trim() !== "" && values.content.trim() !== "" && !isSaving;

  const update = <K extends keyof TemplateValues>(
    key: K,
    value: TemplateValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSaving(true);
    await onSubmit({
      name: values.name.trim(),
      description: values.description?.trim(),
      content: values.content.trim(),
      category: values.category,
    });
    setIsSaving(false);
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <div className="-m-1 min-h-0 flex-1 space-y-4 overflow-y-auto p-1">
        <div className="space-y-2">
          <Label htmlFor={`${id}-name`}>Name</Label>
          <Input
            id={`${id}-name`}
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Code review"
            required
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-description`}>
            Description
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Input
            id={`${id}-description`}
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="What this template is for"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-category`}>Category</Label>
          <Select
            value={values.category}
            onValueChange={(value: TemplateCategory) =>
              update("category", value)
            }
          >
            <SelectTrigger id={`${id}-category`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_CATEGORIES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-content`}>Content</Label>
          <Textarea
            id={`${id}-content`}
            value={values.content}
            onChange={(e) => update("content", e.target.value)}
            placeholder="The prompt to insert into the composer"
            rows={6}
            required
            className="min-h-36 max-h-72"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {initial ? "Save" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}
