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

export default function Evaluations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false);
  const [newRating, setNewRating] = useState<number>(5);
  const [newNotes, setNewNotes] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: members = [], isLoading } = useQuery({
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
        title: "Evaluation updated",
        description: "Member evaluation has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update evaluation.",
        variant: "destructive",
      });
    },
  });

  const filteredMembers = searchQuery.length > 2 
    ? members.filter(member => 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members;

  // Filter out admin users for evaluation
  const evaluableMembers = filteredMembers.filter(member => !member.isAdmin);

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
    if (!rating && !interactive) return <span className="text-text-muted">Not rated</span>;
    
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
    if (!rating) return <Badge variant="outline">Not Rated</Badge>;
    
    if (rating >= 4) return <Badge variant="default" className="bg-secondary">Excellent</Badge>;
    if (rating >= 3) return <Badge variant="secondary">Good</Badge>;
    if (rating >= 2) return <Badge variant="outline" className="border-accent text-accent">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
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
      key: "adminRating",
      title: "Rating",
      sortable: true,
      render: (value: number | null) => renderStars(value),
    },
    {
      key: "adminRating",
      title: "Performance",
      render: (value: number | null) => getRatingBadge(value),
    },
    {
      key: "adminNotes",
      title: "Notes",
      render: (value: string | null) => (
        <span className="text-sm text-text-muted max-w-xs truncate block">
          {value || "No notes"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, row: User) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEvaluate(row)}
          disabled={updateMemberMutation.isPending}
        >
          <Edit size={14} className="mr-1" />
          Evaluate
        </Button>
      ),
    },
  ];

  const stats = {
    totalMembers: evaluableMembers.length,
    ratedMembers: evaluableMembers.filter(m => m.adminRating).length,
    excellentMembers: evaluableMembers.filter(m => m.adminRating && m.adminRating >= 4).length,
    averageRating: evaluableMembers.filter(m => m.adminRating).length > 0 
      ? evaluableMembers.reduce((sum, m) => sum + (m.adminRating || 0), 0) / evaluableMembers.filter(m => m.adminRating).length
      : 0
  };

  // Show admin access required if not admin
  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <Star className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-on-surface mb-2">Admin Access Required</h2>
            <p className="text-text-muted">
              You need administrator privileges to access member evaluations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Member Evaluations</h1>
          <p className="text-text-muted">Rate and evaluate library members</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {stats.totalMembers}
                </p>
                <p className="text-sm text-text-muted">Total Members</p>
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
                <p className="text-sm text-text-muted">Rated Members</p>
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
                <p className="text-sm text-text-muted">Excellent (4+ stars)</p>
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
                <p className="text-sm text-text-muted">Average Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Member Evaluations</CardTitle>
              <CardDescription>
                Manage member ratings and notes
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
            data={evaluableMembers}
            columns={columns}
            loading={isLoading}
            emptyMessage={
              searchQuery.length > 2 
                ? "No members found matching your search." 
                : "No members to evaluate."
            }
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Evaluation Dialog */}
      <Dialog open={isEvaluationDialogOpen} onOpenChange={setIsEvaluationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Evaluate Member</DialogTitle>
            <DialogDescription>
              {selectedMember && (
                <>
                  Rate the performance of {selectedMember.name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Rating (1-5 stars)</Label>
              <div className="mt-2">
                {renderStars(newRating, true, setNewRating)}
              </div>
              <p className="text-sm text-text-muted mt-1">
                Click on stars to set rating
              </p>
            </div>
            
            <div>
              <Label htmlFor="evaluationNotes">Notes</Label>
              <Textarea
                id="evaluationNotes"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Add notes about member behavior, punctuality, book care, etc."
                rows={4}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setIsEvaluationDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmEvaluation}
                disabled={updateMemberMutation.isPending}
              >
                {updateMemberMutation.isPending ? "Saving..." : "Save Evaluation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
