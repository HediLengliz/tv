import React, { useState, useEffect, useContext } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthContext } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";

interface TvModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tv?: any;
  onSubmit: (data: any) => void;
}

export function TvModal({ open, onOpenChange, tv, onSubmit }: TvModalProps) {
  const { user } = useContext(AuthContext);

  // Fetch users for the dropdown
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users", { credentials: "include" });
      return response.json();
    },
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    macAddress: "",
    status: "offline",
    createdById: user?.id || "",
  });

  useEffect(() => {
    if (tv) {
      setForm({
        name: tv.name || "",
        description: tv.description || "",
        macAddress: tv.macAddress || "",
        status: tv.status || "offline",
        createdById: tv.createdById || user?.id || "",
      });
    } else {
      setForm({
        name: "",
        description: "",
        macAddress: "",
        status: "offline",
        createdById: user?.id || "",
      });
    }
  }, [tv, open, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStatusChange = (value: string) => {
    setForm({ ...form, status: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tv ? "Edit TV" : "Add New TV"}</DialogTitle>
            <DialogDescription>
              Enter the details for the TV device
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter TV name"
                    required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Input
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Enter description"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="macAddress" className="text-sm font-medium">MAC Address</label>
                <Input
                    id="macAddress"
                    name="macAddress"
                    value={form.macAddress}
                    onChange={handleChange}
                    placeholder="AA:BB:CC:DD:EE:FF"
                    required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="createdById" className="text-sm font-medium">Created By</label>
                <Select
                    value={form.createdById}
                    onValueChange={(value) => setForm({ ...form, createdById: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select creator" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {tv ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  );
}
