import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MemberForm } from "@/components/forms/member-form";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, Star } from "lucide-react";
import { format } from "date-fns";
import type { User } from "@shared/schema";

export default function Members() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/users/search", searchQuery],
    enabled: searchQuery.length > 2,
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Member deleted",
        description: "The member has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete member.",
        variant: "destructive",
      });
    },
  });

  const displayMembers = searchQuery.length > 2 ? searchResults : members;

  const handleEdit = (member: User) => {
    setSelectedMember(member);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this member?")) {
      deleteMemberMutation.mutate(id);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedMember(null);
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    toast({
      title: selectedMember ? "Member updated" : "Member created",
      description: `The member has been successfully ${selectedMember ? "updated" : "created"}.`,
    });
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-text-muted">Not rated</span>;
    
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={14}
            className={i < rating ? "text-accent fill-current" : "text-gray-300"}
          />
        ))}
        <span className="ml-1 text-sm text-text-muted">({rating}/5)</span>
      </div>
    );
  };

  const columns = [
    {
      key: "name",
      title: "Member",
      sortable: true,
      render: (value: string, row: User) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium text-primary">
              {value.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-on-surface">{value}</p>
            <p className="text-sm text-text-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "membershipDate",
      title: "Member Since",
      sortable: true,
      render: (value: string) => format(new Date(value), "MMM dd, yyyy"),
    },
    {
      key: "isAdmin",
      title: "Role",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Administrator" : "Member"}
        </Badge>
      ),
    },
    {
      key: "adminRating",
      title: "Rating",
      render: (value: number | null) => renderStars(value),
    },
    {
      key: "adminNotes",
      title: "Notes",
      render: (value: string | null) => (
        <span className="text-sm text-text-muted">
          {value || "No notes"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, row: User) => (
        <div className="flex items-center space-x-2">
          {user?.isAdmin && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(row)}
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(row.id)}
                disabled={deleteMemberMutation.isPending || row.id === user?.id}
              >
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const activeMembers = members.filter(member => !member.isAdmin);
  const adminMembers = members.filter(member => member.isAdmin);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Member Management</h1>
          <p className="text-text-muted">Manage library members and their information</p>
        </div>
        {user?.isAdmin && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedMember(null)}>
                <Plus size={16} className="mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedMember ? "Edit Member" : "Add New Member"}
                </DialogTitle>
                <DialogDescription>
                  {selectedMember 
                    ? "Update the member information below." 
                    : "Enter the details for the new member."
                  }
                </DialogDescription>
              </DialogHeader>
              <MemberForm
                member={selectedMember}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setIsFormOpen(false);
                  setSelectedMember(null);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Member Directory</CardTitle>
              <CardDescription>
                {displayMembers.length} members in the system
              </CardDescription>
            </div>
            <div className="w-80">
              <SearchInput
                placeholder="Search members by name or email..."
                onSearch={setSearchQuery}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={displayMembers}
            columns={columns}
            loading={isLoading}
            emptyMessage={
              searchQuery.length > 2 
                ? "No members found matching your search." 
                : "No members registered yet."
            }
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {activeMembers.length}
                </p>
                <p className="text-sm text-text-muted">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-secondary mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {adminMembers.length}
                </p>
                <p className="text-sm text-text-muted">Administrators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-accent mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {members.filter(member => member.adminRating && member.adminRating >= 4).length}
                </p>
                <p className="text-sm text-text-muted">Highly Rated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
