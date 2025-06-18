import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Plus,
  BookOpen,
  FileText,
  Search,
  Settings,
  Trash2,
  Edit,
} from "lucide-react";
import { toast } from "sonner";

interface TemplateSelectorProps {
  onTemplateSelect: (content: string) => void;
  className?: string;
}

export function TemplateSelector({
  onTemplateSelect,
  className,
}: TemplateSelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const templates = useQuery(api.templates.getUserTemplates);
  const createTemplate = useMutation(api.templates.createTemplate);
  const updateTemplate = useMutation(api.templates.updateTemplate);
  const deleteTemplate = useMutation(api.templates.deleteTemplate);
  const createDefaultTemplates = useMutation(
    api.templates.createDefaultTemplates,
  );

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    content: "",
    category: "custom" as const,
  });

  // Create default templates if user has none
  useEffect(() => {
    if (templates && templates.length === 0) {
      void createDefaultTemplates().catch(console.error);
    }
  }, [templates, createDefaultTemplates]);

  const categories = [
    { value: "all", label: "All Templates", icon: BookOpen },
    { value: "summary", label: "Summary", icon: FileText },
    { value: "compare", label: "Compare", icon: Search },
    { value: "research", label: "Research", icon: Settings },
    { value: "custom", label: "Custom", icon: Plus },
  ];

  const filteredTemplates =
    templates?.filter(
      (template) =>
        selectedCategory === "all" || template.category === selectedCategory,
    ) || [];

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createTemplate({
        name: newTemplate.name,
        description: newTemplate.description,
        content: newTemplate.content,
        category: newTemplate.category,
      });

      setNewTemplate({
        name: "",
        description: "",
        content: "",
        category: "custom",
      });
      setIsCreateDialogOpen(false);
      toast.success("Template created successfully");
    } catch (error) {
      toast.error("Failed to create template");
    }
  };

  const handleUpdateTemplate = async () => {
    if (
      !editingTemplate ||
      !editingTemplate.name.trim() ||
      !editingTemplate.content.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await updateTemplate({
        templateId: editingTemplate._id,
        name: editingTemplate.name,
        description: editingTemplate.description,
        content: editingTemplate.content,
        category: editingTemplate.category,
      });

      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      toast.success("Template updated successfully");
    } catch (error) {
      toast.error("Failed to update template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplate({ templateId: templateId as any });
      toast.success("Template deleted successfully");
    } catch (error) {
      toast.error("Failed to delete template");
    }
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setIsEditDialogOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find((c) => c.value === category);
    return categoryData?.icon || BookOpen;
  };

  return (
    <div className={className}>
      {/* Category Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.value}
              variant={
                selectedCategory === category.value ? "default" : "outline"
              }
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className="flex items-center gap-2 whitespace-nowrap rounded-full px-4 flex-shrink-0"
            >
              <Icon size={16} />
              {category.label}
            </Button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const Icon = getCategoryIcon(template.category);
          return (
            <Card
              key={template._id}
              className="relative group rounded-xl flex flex-col h-full"
            >
              <CardHeader className="pb-2 flex-grow-0 px-2">
                <div className="flex items-start justify-between gap-2">
                  {" "}
                  <div className="flex items-center gap-2 min-w-0">
                    {" "}
                    <Icon
                      size={16}
                      className="text-muted-foreground flex-shrink-0"
                    />{" "}
                    <CardTitle className="text-sm font-medium leading-tight break-words">
                      {" "}
                      {template.name}
                    </CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 rounded-full h-8 w-8 flex-shrink-0"
                      >
                        <Settings size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Template Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit size={14} className="mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteTemplate(template._id)}
                        className="text-destructive"
                      >
                        <Trash2 size={14} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {template.description && (
                  <p className="text-xs text-muted-foreground mt-1 break-words">
                    {" "}
                    {template.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pt-0 flex-grow flex flex-col justify-between">
                {" "}
                <p className="text-xs text-muted-foreground line-clamp-3 mb-3 break-words">
                  {" "}
                  {template.content}
                </p>
                <Button
                  size="sm"
                  onClick={() => onTemplateSelect(template.content)}
                  className="w-full rounded-full px-2"
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mt-4 rounded-full" variant="outline">
            <Plus size={16} className="mr-2" />
            Create Template
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a reusable prompt template for your conversations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newTemplate.name}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, name: e.target.value })
                }
                placeholder="Template name"
                className="rounded-lg"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={newTemplate.description}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    description: e.target.value,
                  })
                }
                placeholder="Brief description"
                className="rounded-lg"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={newTemplate.category}
                onValueChange={(value: any) =>
                  setNewTemplate({ ...newTemplate, category: value })
                }
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="compare">Compare</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="content">Template Content</Label>
              <Textarea
                id="content"
                value={newTemplate.content}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, content: e.target.value })
                }
                placeholder="Enter your template content..."
                rows={4}
                className="rounded-lg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} className="rounded-full">
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Modify your template content and settings.
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingTemplate.name}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      name: e.target.value,
                    })
                  }
                  placeholder="Template name"
                  className="rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description (optional)</Label>
                <Input
                  id="edit-description"
                  value={editingTemplate.description || ""}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description"
                  className="rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editingTemplate.category}
                  onValueChange={(value: any) =>
                    setEditingTemplate({ ...editingTemplate, category: value })
                  }
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="compare">Compare</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-content">Template Content</Label>
                <Textarea
                  id="edit-content"
                  value={editingTemplate.content}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      content: e.target.value,
                    })
                  }
                  placeholder="Enter your template content..."
                  rows={4}
                  className="rounded-lg"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateTemplate} className="rounded-full">
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
