import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

export default function Members() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: members = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: searchResults = [] } = useQuery<User[]>({
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

  const columns = useMemo(() => [
    {
      key: "name",
      title: t("members.name"),
      sortable: true,
      render: (value: string, row: User) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium text-primary">
              {value.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div>
            <button
              onClick={() => setLocation(`/members/${row.id}`)}
              className="font-medium text-on-surface hover:text-primary transition-colors text-left"
            >
              {value}
            </button>
            <p className="text-sm text-text-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "membershipDate",
      title: t("members.membershipDate"),
      sortable: true,
      render: (value: string) => format(new Date(value), "MMM dd, yyyy"),
    },
    {
      key: "isAdmin",
      title: t("members.role"),
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? t("members.administrator") : t("members.member")}
        </Badge>
      ),
    },
    {
      key: "adminRating",
      title: t("members.adminRating"),
      render: (value: number | null) => renderStars(value),
    },
    {
      key: "adminNotes",
      title: t("members.adminNotes"),
      render: (value: string | null) => (
        <span className="text-sm text-text-muted">
          {value || t("members.noNotes")}
        </span>
      ),
    },
    {
      key: "actions",
      title: t("members.actions"),
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
  ], [t, user, deleteMemberMutation.isPending]);

  const activeMembers = members.filter(member => !member.isAdmin);
  const adminMembers = members.filter(member => member.isAdmin);

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{t("members.management")}</h1>
          <p className="text-text-muted">{t("members.managementDesc")}</p>
        </div>
        {user?.isAdmin && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedMember(null)}>
                <Plus size={16} className="mr-2" />
                {t("members.addMember")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedMember ? t("members.editMember") : t("members.addNewMember")}
                </DialogTitle>
                <DialogDescription>
                  {selectedMember 
                    ? t("members.updateMemberInfo")
                    : t("members.enterNewMember")
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
      </motion.div>

      {/* Search and Stats */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("members.directory")}</CardTitle>
                <CardDescription>
                  {displayMembers.length} {t("members.inSystem")}
                </CardDescription>
              </div>
              <div className="w-80">
                <SearchInput
                  placeholder={t("members.searchPlaceholder")}
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
                  ? t("members.noMembersFound")
                  : t("members.noMembersYet")
              }
              pageSize={10}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {activeMembers.length}
                </p>
                <p className="text-sm text-text-muted">{t("members.activeMembers")}</p>
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
                <p className="text-sm text-text-muted">{t("members.administrators")}</p>
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
                <p className="text-sm text-text-muted">{t("members.highlyRated")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
