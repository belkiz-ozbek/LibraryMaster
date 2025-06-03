import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { insertUserSchema, type User } from "@shared/schema";
import { z } from "zod";

const memberFormSchema = insertUserSchema.extend({
  adminRating: z.number().min(1).max(5).optional(),
  adminNotes: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberFormSchema>;

interface MemberFormProps {
  member?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MemberForm({ member, onSuccess, onCancel }: MemberFormProps) {
  const isEditing = !!member;

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      name: member?.name || "",
      email: member?.email || "",
      password: "",
      isAdmin: member?.isAdmin || false,
      membershipDate: member?.membershipDate || new Date().toISOString().split('T')[0],
      adminRating: member?.adminRating || undefined,
      adminNotes: member?.adminNotes || "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: MemberFormData) => {
      // Don't send empty password on edit
      if (isEditing && !data.password) {
        delete data.password;
      }
      
      if (isEditing) {
        return apiRequest("PUT", `/api/users/${member.id}`, data);
      }
      return apiRequest("POST", "/api/users", data);
    },
    onSuccess,
  });

  const onSubmit = (data: MemberFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            {...form.register("name")}
            error={form.formState.errors.name?.message}
          />
        </div>
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            error={form.formState.errors.email?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="password">
            Password {isEditing ? "(leave blank to keep current)" : "*"}
          </Label>
          <Input
            id="password"
            type="password"
            {...form.register("password")}
            error={form.formState.errors.password?.message}
          />
        </div>
        <div>
          <Label htmlFor="membershipDate">Membership Date *</Label>
          <Input
            id="membershipDate"
            type="date"
            {...form.register("membershipDate")}
            error={form.formState.errors.membershipDate?.message}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isAdmin"
          checked={form.watch("isAdmin")}
          onCheckedChange={(checked) => form.setValue("isAdmin", checked as boolean)}
        />
        <Label htmlFor="isAdmin">Administrator privileges</Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="adminRating">Admin Rating (1-5)</Label>
          <Select
            value={form.watch("adminRating")?.toString() || "0"}
            onValueChange={(value) => form.setValue("adminRating", value ? parseInt(value) : undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">No rating</SelectItem>
              <SelectItem value="1">1 - Poor</SelectItem>
              <SelectItem value="2">2 - Fair</SelectItem>
              <SelectItem value="3">3 - Good</SelectItem>
              <SelectItem value="4">4 - Very Good</SelectItem>
              <SelectItem value="5">5 - Excellent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="adminNotes">Admin Notes</Label>
        <Textarea
          id="adminNotes"
          {...form.register("adminNotes")}
          placeholder="Any notes about this member..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : isEditing ? "Update Member" : "Add Member"}
        </Button>
      </div>

      {mutation.isError && (
        <p className="text-sm text-destructive mt-2">
          Failed to {isEditing ? "update" : "create"} member. Please try again.
        </p>
      )}
    </form>
  );
}
