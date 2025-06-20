import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
}

export function UserModal({ open, onOpenChange, user }: UserModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      password: "",
      role: user?.role || "editor",
      status: user?.status || "pending",
      phone: user?.phone || "",
    },
  });
    const resendEmailMutation = useMutation({
        mutationFn: (email: string) =>
            apiRequest("POST", "/api/resend-verification-email", { email }),
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Verification email has been resent",
            });
            console.log("Verification email resent successfully");
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to resend verification email",
                variant: "destructive",
            });
            console.error("Failed to resend verification email:", error);
        },
    });
    const handleResendEmail = () => {
        if (user?.email) {
            resendEmailMutation.mutate(user.email);
        }
    };

  const createMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      console.log(`Attempting to create user and send verification email to: ${data.email}`);
      const response = await apiRequest("POST", "/api/users", data);
      console.log(`User creation response:`, response);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });

      const emailMessage = sendWelcomeEmail
          ? "User created successfully. Verification email has been sent."
          : "User created successfully.";

      console.log(emailMessage);

      toast({
        title: "Success",
        description: emailMessage,
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Failed to create user or send verification email:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertUser) => apiRequest("PUT", `/api/users/${user.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertUser) => {
    if (user) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
                    <DialogDescription>
                        {user ? "Update user information and permissions." : "Create a new user account with appropriate permissions."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter first name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter last name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="Enter email address"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="tel"
                                            placeholder="Enter phone number"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="editor">Editor</SelectItem>
                                            <SelectItem value="manager">Manager</SelectItem>
                                            <SelectItem value="admin">Administrator</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {!user && (
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Temporary Password *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="Enter temporary password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {!user && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="sendEmail"
                                    checked={sendWelcomeEmail}
                                    onCheckedChange={(checked) => setSendWelcomeEmail(checked === true)}
                                />
                                <label htmlFor="sendEmail" className="text-sm">
                                    Send verification email to complete account setup
                                </label>
                            </div>
                        )}

                        {user && user.emailVerified === false && (
                            <div className="flex flex-col space-y-2 p-3 border rounded-md bg-yellow-50">
                                <div className="flex items-center">
                                    <div className="mr-2 h-5 w-5 text-yellow-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="font-medium">Email not verified</span>
                                </div>
                                <p className="text-sm text-gray-600 ml-7">
                                    This user hasn't verified their email address yet.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="ml-7 mt-1"
                                    onClick={() => {
                                        const email = form.getValues("email");
                                        if (email) {
                                            console.log("Resending verification email to:", email);
                                            resendEmailMutation.mutate(email);
                                        }
                                    }}
                                    disabled={resendEmailMutation.isPending}
                                >
                                    {resendEmailMutation.isPending ? "Sending..." : "Resend verification email"}
                                </Button>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : user ? "Update User" : "Create User"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
