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
  membershipDate: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
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

  const todayStr = new Date().toISOString().slice(0, 10);
  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      name: member?.name || "",
      email: member?.email || "",
      password: "",
      isAdmin: member?.isAdmin || false,
      membershipDate: member?.membershipDate
        ? (typeof member.membershipDate === 'string'
            ? member.membershipDate.slice(0, 10)
            : member.membershipDate.toISOString().slice(0, 10))
        : todayStr,
      adminRating: member?.adminRating || undefined,
      adminNotes: member?.adminNotes || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: MemberFormData) => {
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
    onError: (error: any) => {
      console.error('Mutation error:', error);
      console.error('Error message:', error?.message);
      console.error('Error object:', error);
    },
  });

  const onSubmit: import("react-hook-form").SubmitHandler<MemberFormData> = (data) => {
    if (typeof data.membershipDate === "string") {
      data.membershipDate = new Date(data.membershipDate);
    }
    mutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="font-semibold text-gray-800">{t('members.form.fullName')} *</Label>
          <Input
            id="name"
            {...form.register("name")}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          {form.formState.errors.name && <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.name.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="font-semibold text-gray-800">{t('members.form.email')} *</Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          {form.formState.errors.email && <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="font-semibold text-gray-800">
            {t('members.form.password')} {isEditing ? `(${t('members.form.passwordHint')})` : "*"}
          </Label>
          <Input
            id="password"
            type="password"
            {...form.register("password")}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          {form.formState.errors.password && <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.password.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="membershipDate" className="font-semibold text-gray-800">{t('members.form.membershipDate')} *</Label>
          <Input
            id="membershipDate"
            type="date"
            {...form.register("membershipDate")}
            value={form.watch("membershipDate") || todayStr}
            onChange={e => form.setValue("membershipDate", e.target.value)}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          {form.formState.errors.membershipDate && <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.membershipDate.message}</p>}
        </div>
      </div>

      <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-4 py-2">
        <Checkbox
          id="isAdmin"
          checked={form.watch("isAdmin")}
          onCheckedChange={(checked) => form.setValue("isAdmin", checked as boolean)}
        />
        <Label htmlFor="isAdmin" className="font-medium text-gray-700">{t('members.form.adminPrivileges')}</Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="adminRating" className="font-semibold text-gray-800">{t('members.form.adminRating')}</Label>
          <Select
            value={form.watch("adminRating")?.toString() || "0"}
            onValueChange={(value) => form.setValue("adminRating", value ? parseInt(value) : undefined)}
          >
            <SelectTrigger className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition">
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="adminNotes" className="font-semibold text-gray-800">{t('members.form.adminNotes')}</Label>
        <Textarea
          id="adminNotes"
          {...form.register("adminNotes")}
          placeholder={t('members.form.adminNotesPlaceholder')}
          rows={3}
          className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-6">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-lg px-6 py-2 text-base">
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={mutation.isPending} className="rounded-lg px-6 py-2 text-base">
          {mutation.isPending ? t('common.saving') : isEditing ? t('members.form.updateMember') : t('members.form.addMember')}
        </Button>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600 mt-2 text-center font-medium">
          {(() => {
            const errorMessage = mutation.error?.message || '';
            // Email hatası kontrolü
            if (errorMessage.includes('Bu e-posta adresi zaten kullanılıyor') || 
                errorMessage.includes('already in use') ||
                errorMessage.includes('400:') && errorMessage.includes('email')) {
              return t('errors.emailAlreadyExists');
            }
            // Genel hata mesajları
            return errorMessage || t(isEditing ? 'errors.memberUpdateFailed' : 'errors.memberCreateFailed');
          })()}
        </p>
      )}
    </form>
  );
}
