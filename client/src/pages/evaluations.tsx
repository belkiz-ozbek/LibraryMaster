import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Star, Edit, Users, TrendingUp, Award } from "lucide-react";
import { format } from "date-fns";
import type { User } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import LoadingScreen from "@/components/ui/loading-screen";

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

export default function Evaluations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false);
  const [newRating, setNewRating] = useState<number>(5);
  const [newNotes, setNewNotes] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: members = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEvaluationDialogOpen(false);
      setSelectedMember(null);
      setNewNotes("");
      setNewRating(5);
      toast({
        title: t("evaluations.evaluationUpdated"),
        description: t("evaluations.evaluationUpdatedDesc"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("evaluations.evaluationUpdateFailed"),
        variant: "destructive",
      });
    },
  });

  const filteredMembers = searchQuery.length > 2 
    ? members.filter((member: User) => 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : members;

  const evaluableMembers = filteredMembers;

  const handleEvaluate = (member: User) => {
    setSelectedMember(member);
    setNewRating(member.adminRating || 5);
    setNewNotes(member.adminNotes || "");
    setIsEvaluationDialogOpen(true);
  };

  const confirmEvaluation = () => {
    if (!selectedMember) return;
    
    updateMemberMutation.mutate({
      id: selectedMember.id,
      data: {
        adminRating: newRating,
        adminNotes: newNotes
      }
    });
  };

  const renderStars = (rating: number | null, interactive = false, onRatingChange?: (rating: number) => void) => {
    if (!rating && !interactive) return <span className="text-text-muted">{t("evaluations.notRated")}</span>;
    
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={interactive ? 20 : 14}
            className={
              i < (rating || 0)
                ? "text-accent fill-current cursor-pointer" 
                : "text-gray-300 cursor-pointer"
            }
            onClick={interactive && onRatingChange ? () => onRatingChange(i + 1) : undefined}
          />
        ))}
        {!interactive && rating && (
          <span className="ml-1 text-sm text-text-muted">({rating}/5)</span>
        )}
      </div>
    );
  };

  const getRatingBadge = (rating: number | null) => {
    if (!rating) return <Badge variant="outline">{t("evaluations.notRated")}</Badge>;
    if (rating === 5) return <Badge variant="default" className="bg-secondary">{t("evaluations.excellent")}</Badge>;
    if (rating === 4) return <Badge variant="default" style={{background:'#e0e7ff', color:'#3730a3'}}>{t("members.form.ratings.veryGood")}</Badge>;
    if (rating >= 3) return <Badge variant="secondary">{t("evaluations.good")}</Badge>;
    if (rating >= 2) return <Badge variant="outline" className="border-accent text-accent">{t("evaluations.fair")}</Badge>;
    return <Badge variant="destructive">{t("evaluations.poor")}</Badge>;
  };

  const columns = [
    {
      key: "name",
      title: t("evaluations.member"),
      sortable: true,
      render: (value: string, row: User) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium text-primary">
              {value.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div>
            <Link to={`/members/${row.id}`} className="font-medium text-on-surface hover:underline hover:text-primary transition-colors">
              {value}
            </Link>
            <p className="text-sm text-text-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "membershipDate",
      title: t("evaluations.memberSince"),
      sortable: true,
      render: (value: string) => format(new Date(value), "MMM dd, yyyy"),
    },
    {
      key: "adminRating",
      title: t("evaluations.rating"),
      sortable: true,
      render: (value: number | null) => renderStars(value),
    },
    {
      key: "adminRating",
      title: t("evaluations.performance"),
      render: (value: number | null) => getRatingBadge(value),
    },
    {
      key: "adminNotes",
      title: t("evaluations.notes"),
      render: (value: string | null) => (
        <span className="text-sm text-text-muted max-w-xs truncate block">
          {value || t("evaluations.noNotes")}
        </span>
      ),
    },
    {
      key: "actions",
      title: t("evaluations.actions"),
      render: (_: any, row: User) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEvaluate(row)}
          disabled={updateMemberMutation.isPending}
        >
          <Edit size={14} className="mr-1" />
          {t("evaluations.evaluate")}
        </Button>
      ),
    },
  ];

  const stats = {
    totalMembers: evaluableMembers.length,
    ratedMembers: evaluableMembers.filter((m: User) => m.adminRating).length,
    excellentMembers: evaluableMembers.filter((m: User) => m.adminRating && m.adminRating >= 4).length,
    averageRating: evaluableMembers.filter((m: User) => m.adminRating).length > 0 
      ? evaluableMembers.reduce((sum: number, m: User) => sum + (m.adminRating || 0), 0) / evaluableMembers.filter((m: User) => m.adminRating).length
      : 0
  };

  // Show admin access required if not admin
  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <Star className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-on-surface mb-2">{t("evaluations.adminAccessRequired")}</h2>
            <p className="text-text-muted">
              {t("evaluations.adminAccessRequiredDesc")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        {/* Başlık ve açıklama kaldırıldı, sadece header'da görünecek */}
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {stats.totalMembers}
                </p>
                <p className="text-sm text-text-muted">{t("evaluations.totalMembers")}</p>
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
                  {stats.ratedMembers}
                </p>
                <p className="text-sm text-text-muted">{t("evaluations.ratedMembers")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-secondary mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {stats.excellentMembers}
                </p>
                <p className="text-sm text-text-muted">{t("evaluations.excellentMembers")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {stats.averageRating.toFixed(1)}
                </p>
                <p className="text-sm text-text-muted">{t("evaluations.averageRating")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Members Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("evaluations.title")}</CardTitle>
                <CardDescription>
                  {t("evaluations.manageRatings")}
                </CardDescription>
              </div>
              <div className="w-80">
                <SearchInput
                  placeholder={t("evaluations.searchPlaceholder")}
                  onSearch={setSearchQuery}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={evaluableMembers}
              columns={columns}
              loading={isLoading}
              emptyMessage={
                searchQuery.length > 2 
                  ? t("evaluations.noMembersFound")
                  : t("evaluations.noMembersToEvaluate")
              }
              pageSize={10}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Evaluation Dialog */}
      <Dialog open={isEvaluationDialogOpen} onOpenChange={setIsEvaluationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("evaluations.evaluateMember")}</DialogTitle>
            <DialogDescription>
              {selectedMember && (
                <>
                  {t("evaluations.ratePerformance", { name: selectedMember.name })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>{t("evaluations.ratingLabel")}</Label>
              <div className="mt-2">
                {renderStars(newRating, true, setNewRating)}
              </div>
              <p className="text-sm text-text-muted mt-1">
                {t("evaluations.clickToSetRating")}
              </p>
            </div>
            
            <div>
              <Label htmlFor="evaluationNotes">{t("evaluations.notes")}</Label>
              <Textarea
                id="evaluationNotes"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder={t("evaluations.notesPlaceholder")}
                rows={4}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setIsEvaluationDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                onClick={confirmEvaluation}
                disabled={updateMemberMutation.isPending}
              >
                {updateMemberMutation.isPending ? t("common.saving") : t("evaluations.saveEvaluation")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
