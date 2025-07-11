import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserModal } from "@/components/user/user-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getRoleColor, getStatusColor, getTimeAgo } from "@/lib/utils";
import { Plus, User as UserIcon, Edit, Trash2, MailCheck, AlertCircle } from "lucide-react";
import { type User } from "@shared/schema";

export default function UserManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users", { credentials: "include" });
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Mutation to resend verification email
  const resendVerificationMutation = useMutation({
    mutationFn: (email: string) =>
        apiRequest("POST", "/api/resend-verification-email", { email }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Verification email sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send verification email",
        variant: "destructive",
      });
    },
  });

  // Mutation to manually update user status
  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string, status: string }) =>
        apiRequest("PUT", `/api/users/${data.id}`, { status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string | undefined) => {
    if (id) {
      deleteMutation.mutate(id);
    }
  };

  const handleResendVerification = (email: string) => {
    resendVerificationMutation.mutate(email);
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
      case "administrator":
        return "👑";
      case "manager":
        return "👔";
      case "editor":
        return "✏️";
      default:
        return "👤";
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* User Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
              <Card key={user.id} className={!user.emailVerified ? "border-yellow-300" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Role:</span>
                      <Badge className={getRoleColor(user.role)}>
                        <span className="mr-1">{getRoleIcon(user.role)}</span>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Email Verification:</span>
                      <Badge variant={user.emailVerified ? "outline" : "secondary"} className={user.emailVerified ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}>
                        {user.emailVerified ? <MailCheck className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                        {user.emailVerified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Account Status:</span>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </div>
                    {/* Show activation button if email is verified but status is pending */}
                    {user.emailVerified && user.status === "pending" && (
                      <div className="mb-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-green-700 border-green-300 hover:bg-green-100 mb-3"
                          onClick={() => handleStatusChange(user.id!, "active")}
                          disabled={updateStatusMutation.isPending}
                        >
                          {updateStatusMutation.isPending ? "Updating..." : "Activate user"}
                        </Button>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Last Login:</span>
                      <span className="text-sm">
                    {user.lastLoginAt ? getTimeAgo(user.lastLoginAt) : "Never"}
                  </span>
                    </div>
                    {user.phone && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Phone:</span>
                          <span className="text-sm">{user.phone}</span>
                        </div>
                    )}
                  </div>

                  {!user.emailVerified && (
                      <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                        <p className="text-yellow-700 mb-2">User has not verified their email yet.</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                            onClick={() => handleResendVerification(user.email)}
                            disabled={resendVerificationMutation.isPending}
                        >
                          {resendVerificationMutation.isPending ? "Sending..." : "Resend verification email"}
                        </Button>
                      </div>
                  )}
                  {user.emailVerified && user.status === "pending" && (
                      <div className="mb-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-green-600 border-green-600"
                            onClick={() => handleStatusChange(user.id!, "active")}
                        >
                          <MailCheck className="mr-2 h-4 w-4" />
                          Activate User
                        </Button>
                      </div>
                  )}

                  {user.status === "pending" && user.emailVerified && (
                      <div className="mb-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-green-700 border-green-300 hover:bg-green-100 mb-3"
                            onClick={() => handleStatusChange(user.id!, "active")}
                            disabled={updateStatusMutation.isPending}
                        >
                          {updateStatusMutation.isPending ? "Updating..." : "Activate user"}
                        </Button>
                      </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        className="flex-1"
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>

        <UserModal
            open={isModalOpen}
            onOpenChange={closeModal}
            user={selectedUser}
        />
      </div>
  );
}
