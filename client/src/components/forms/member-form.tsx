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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
      const { password, ...restData } = data;
      const payload: Partial<MemberFormData> = restData;
      // Don't send empty password on edit
      if (isEditing && password) {
        payload.password = password;
      } else if (!isEditing) {
        payload.password = password;
      }
      
      if (isEditing) {
        return apiRequest("PUT", `/api/users/${member.id}`, payload);
      }
      return apiRequest("POST", "/api/users", payload);
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
          <Label htmlFor="name">{t('members.form.fullName')} *</Label>
          <Input
            id="name"
            {...form.register("name")}
          />
          {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">{t('members.form.email')} *</Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
          />
          {form.formState.errors.email && <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="password">
            {t('members.form.password')} {isEditing ? `(${t('members.form.passwordHint')})` : "*"}
          </Label>
          <Input
            id="password"
            type="password"
            {...form.register("password")}
          />
          {form.formState.errors.password && <p className="text-sm text-destructive mt-1">{form.formState.errors.password.message}</p>}
        </div>
        <div>
          <Label htmlFor="membershipDate">{t('members.form.membershipDate')} *</Label>
          <Input
            id="membershipDate"
            type="date"
            {...form.register("membershipDate")}
          />
          {form.formState.errors.membershipDate && <p className="text-sm text-destructive mt-1">{form.formState.errors.membershipDate.message}</p>}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isAdmin"
          checked={form.watch("isAdmin")}
          onCheckedChange={(checked) => form.setValue("isAdmin", checked as boolean)}
        />
        <Label htmlFor="isAdmin">{t('members.form.adminPrivileges')}</Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="adminRating">{t('members.form.adminRating')}</Label>
          <Select
            value={form.watch("adminRating")?.toString() || "0"}
            onValueChange={(value) => form.setValue("adminRating", value ? parseInt(value) : undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('members.form.selectRating')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t('members.form.noRating')}</SelectItem>
              <SelectItem value="1">1 - {t('members.form.ratings.poor')}</SelectItem>
              <SelectItem value="2">2 - {t('members.form.ratings.fair')}</SelectItem>
              <SelectItem value="3">3 - {t('members.form.ratings.good')}</SelectItem>
              <SelectItem value="4">4 - {t('members.form.ratings.veryGood')}</SelectItem>
              <SelectItem value="5">5 - {t('members.form.ratings.excellent')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="adminNotes">{t('members.form.adminNotes')}</Label>
        <Textarea
          id="adminNotes"
          {...form.register("adminNotes")}
          placeholder={t('members.form.adminNotesPlaceholder')}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t('common.saving') : isEditing ? t('members.form.updateMember') : t('members.form.addMember')}
        </Button>
      </div>

      {mutation.isError && (
        <p className="text-sm text-destructive mt-2">
          {t(isEditing ? 'errors.memberUpdateFailed' : 'errors.memberCreateFailed')}
        </p>
      )}
    </form>
  );
}
