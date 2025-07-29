import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContentSchema, type InsertContent } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { CloudUpload, Image } from "lucide-react";

interface ContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content?: any;
}

export function ContentModal({ open, onOpenChange, content }: ContentModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState(content?.videoUrl || "");

  const form = useForm<InsertContent>({
    resolver: zodResolver(insertContentSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "", // always a string
      videoUrl: "",
      status: "draft",
      selectedTvs: [],
      createdById: user?.id || "",
      duration: 15,
    },
  });

  // Reset form when modal opens/closes or content changes
  useEffect(() => {
    if (open) {
      if (content) {
        form.reset({
          title: content.title || "",
          description: content.description || "",
          imageUrl: content.imageUrl ?? "", // always a string
          videoUrl: content.videoUrl || "",
          status: content.status || "draft",
          selectedTvs: content.selectedTvs || [],
          createdById: content.createdById || user?.id || "",
          duration: content.duration ?? 15,
        });
        setImagePreview(content.imageUrl ?? null);
      } else {
        form.reset({
          title: "",
          description: "",
          imageUrl: "",
          videoUrl: "",
          status: "draft",
          selectedTvs: [],
          createdById: user?.id || "",
          duration: 15,
        });
        setImagePreview(null);
      }
    }
  }, [open, content, form, user]);

  // Watch for image URL changes to update preview
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "imageUrl") {
        setImagePreview(value.imageUrl ? value.imageUrl : null);}
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Fetch TVs for selection
  const { data: tvs = [] } = useQuery({
    queryKey: ["/api/tvs"],
    queryFn: async () => {
      const response = await fetch("/api/tvs", { credentials: "include" });
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertContent) => apiRequest("POST", "/api/content", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: "Success",
        description: "Content created successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create content",
        variant: "destructive",
      });
    },
  });

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const formData = new FormData();
      formData.append("video", file); // Use "video" as the field name
      const res = await fetch("/api/upload/video", {
        method: "POST",
        body: formData,
        credentials: "include", // Add this if your backend requires authentication
      });
      const data = await res.json();
      setVideoUrl(data.url); // Assume backend returns { url: "..." }
    }
  };
  const updateMutation = useMutation({
    mutationFn: (data: InsertContent) => apiRequest("PUT", `/api/content/${content.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: "Success",
        description: "Content updated successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update content",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertContent) => {
    if (content) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        form.setValue("imageUrl", data.url);
        setImagePreview(data.url);
        toast({
          title: "Image uploaded",
          description: "Image uploaded successfully.",
        });
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (err: any) {
      toast({
        title: "Upload error",
        description: err.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{content ? "Edit Content" : "Add New Content"}</DialogTitle>
            <DialogDescription>
              {content ? "Update content information and settings." : "Create new content for broadcasting to your TVs."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter content title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                  )}
              />

              <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                              placeholder="Enter content description"
                              rows={3}
                              {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                  )}
              />

              <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Image</FormLabel>
                        <FormControl>
                          <>
                            <Input
                              placeholder="Enter image URL"
                              {...field}
                              value={field.value ?? ""} // always a string
                              onChange={(e) => {
                                field.onChange(e);
                                setImagePreview(e.target.value || null);

                              }}
                              className="mb-2"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploading}
                              className="mb-2"
                            />
                          </>
                        </FormControl>
                        <div className="mt-2 border-2 border-dashed border-muted rounded-lg p-6 text-center">
                          {imagePreview ? (
                              <div className="relative w-full h-40">
                                <img
                                    src={imagePreview}
                                    alt="Content preview"
                                    className="mx-auto max-h-full object-contain"
                                    onError={() => setImagePreview(null)}
                                />
                              </div>
                          ) : (
                              <>
                                <CloudUpload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">
                                  {uploading ? "Uploading..." : "Upload an image or provide a URL"}
                                </p>
                                <p className="text-sm text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                              </>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Video</FormLabel>
                        <FormControl>
                          <>
                            <Input
                                placeholder="Enter video URL"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="mb-2"
                            />
                            <input
                                type="file"
                                accept="video/mp4"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (file.type !== 'video/mp4' && !file.name.toLowerCase().endsWith('.mp4')) {
                                    toast({
                                      title: "Invalid file type",
                                      description: "Only .mp4 video files are allowed.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  const formData = new FormData();
                                  formData.append("video", file); // field name must be 'video'
                                  try {
                                    const res = await fetch("/api/upload/video", {
                                      method: "POST",
                                      body: formData,
                                      credentials: "include",
                                    });
                                    const data = await res.json();
                                    if (data.url) {
                                      form.setValue("videoUrl", data.url);
                                      toast({
                                        title: "Video uploaded",
                                        description: "Video uploaded successfully.",
                                      });
                                    } else {
                                      throw new Error(data.message || "Upload failed");
                                    }
                                  } catch (err: any) {
                                    toast({
                                      title: "Upload error",
                                      description: err.message || "Failed to upload video",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                className="mb-2"
                            />
                          </>
                        </FormControl>
                        {/* Video preview */}
                        {form.watch("videoUrl") && (
                          <div className="mt-2 border-2 border-dashed border-muted rounded-lg p-6 text-center">
                            <video
                              src={form.watch("videoUrl")}
                              controls
                              className="mx-auto max-h-40 object-contain"
                              style={{ maxWidth: '100%' }}
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                  )}
              />
                <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Duration (seconds) *</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="Enter content duration in seconds"
                                    {...field}
                                    value={field.value ?? 15}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />


              <FormField
                  control={form.control}
                  name="selectedTvs"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select TVs for Broadcasting</FormLabel>
                        <div className="border border-input rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                          {tvs.length === 0 ? (
                              <p className="text-center text-sm text-muted-foreground py-2">No TVs available</p>
                          ) : (
                              tvs.map((tv: any) => (
                                  <div key={tv.id} className="flex items-center space-x-3">
                                    <Checkbox
                                        checked={field.value.includes(tv.id)}
                                        onCheckedChange={(checked) => {
                                          const updatedTvs = checked
                                              ? [...field.value, tv.id]
                                              : field.value.filter((id: string) => id !== tv.id);
                                          field.onChange(updatedTvs);
                                        }}
                                    />
                                    <span className="text-sm">
                            {tv.name}
                          </span>
                                  </div>
                              ))
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                  )}
              />

              <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                  )}
              />

              <FormField
                  control={form.control}
                  name="docUrl"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attach Document (PDF, CSV, Word, Excel, PowerPoint)</FormLabel>
                        <FormControl>
                          <>
                            <Input
                              placeholder="Enter document URL"
                              {...field}
                              value={field.value ?? ""}
                              onChange={e => field.onChange(e.target.value)}
                              className="mb-2"
                            />
                            <input
                              type="file"
                              accept=".pdf,.csv,.xls,.xlsx,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const formData = new FormData();
                                formData.append("doc", file);
                                try {
                                  const res = await fetch("/api/upload/doc", {
                                    method: "POST",
                                    body: formData,
                                    credentials: "include",
                                  });
                                  const data = await res.json();
                                  if (data.url) {
                                    form.setValue("docUrl", data.url);
                                    toast({
                                      title: "Document uploaded",
                                      description: data.originalName,
                                    });
                                  } else {
                                    throw new Error(data.message || "Upload failed");
                                  }
                                } catch (err: any) {
                                  toast({
                                    title: "Upload error",
                                    description: err.message || "Failed to upload document",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="mb-2"
                            />
                          </>
                        </FormControl>
                        {/* Preview */}
                        {form.watch("docUrl") && (
                          <div className="mt-2 border-2 border-dashed border-muted rounded-lg p-6 text-center">
                            {form.watch("docUrl").endsWith('.pdf') ? (
                              <iframe
                                src={form.watch("docUrl")}
                                title="PDF Preview"
                                className="mx-auto"
                                style={{ width: '100%', height: '300px', border: 'none' }}
                              />
                            ) : (
                              <a href={form.watch("docUrl")}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-blue-600 underline">
                                {form.watch("docUrl").split('/').pop()}
                              </a>
                            )}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                  )}
              />

              <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : content ? "Update Content" : "Create Content"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
  );
}
