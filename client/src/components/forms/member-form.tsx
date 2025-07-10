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
  firstName: z.string().min(2, 'İsim gerekli'),
  lastName: z.string().min(2, 'Soyisim gerekli'),
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalı').regex(/^[a-zA-Z0-9_]+$/, 'Kullanıcı adı sadece harf, rakam ve altçizgi içerebilir'),
  adminRating: z.number().min(1).max(5).optional(),
  adminNotes: z.string().optional(),
  membershipDate: z.string(),
  email: z.string().email({ message: 'Geçersiz e-posta adresi' }).or(z.literal('')).optional(), // Boş bırakılabilir veya geçerli email
  password: z.string().optional(), // Şifre opsiyonel
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
  let firstName = '';
  let lastName = '';
  if (typeof member?.name === 'string' && member.name.trim().length > 0) {
    const [first, ...rest] = String(member.name).trim().split(' ');
    firstName = first ?? '';
    lastName = rest.length > 0 ? rest.join(' ') : '';
  }
  const form = useForm<MemberFormData & { firstName: string; lastName: string }>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      firstName,
      lastName,
      username: member?.username || "",
      name: member?.name || "",
      email: member?.email || "",
      password: "",
      isAdmin: member?.isAdmin || false,
      membershipDate: typeof member?.membershipDate === 'string'
        ? (member.membershipDate as string).slice(0, 10)
        : todayStr,
      adminRating: member?.adminRating || undefined,
      adminNotes: member?.adminNotes || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: MemberFormData) => {
      const { password, ...restData } = data;
      const payload: Partial<MemberFormData> = restData;
      
      // Admin ise password zorunlu, değilse opsiyonel
      if (data.isAdmin && password) {
        payload.password = password;
      } else if (!data.isAdmin && password) {
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

  const onSubmit: import("react-hook-form").SubmitHandler<MemberFormData & { firstName: string; lastName: string }> = (data) => {
    // İsim ve soyismi birleştirip name olarak gönder
    data.name = `${data.firstName} ${data.lastName}`.trim();
    mutation.mutate(data);
  };

  // Capitalize first letter function
  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = capitalizeFirstLetter(e.target.value);
    form.setValue("firstName", value);
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = capitalizeFirstLetter(e.target.value);
    form.setValue("lastName", value);
  };

  const handleFirstNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = capitalizeFirstLetter(e.target.value);
    form.setValue("firstName", value);
  };

  const handleLastNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = capitalizeFirstLetter(e.target.value);
    form.setValue("lastName", value);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName" className="font-semibold text-gray-800">{t('members.form.firstName')} *</Label>
          <Input
            id="firstName"
            {...form.register("firstName")}
            onChange={handleFirstNameChange}
            onBlur={handleFirstNameBlur}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition capitalize"
          />
          {form.formState.errors.firstName && <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.firstName.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName" className="font-semibold text-gray-800">{t('members.form.lastName')} *</Label>
          <Input
            id="lastName"
            {...form.register("lastName")}
            onChange={handleLastNameChange}
            onBlur={handleLastNameBlur}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition capitalize"
          />
          {form.formState.errors.lastName && <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.lastName.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="username" className="font-semibold text-gray-800">{t('members.form.username')} *</Label>
          <Input
            id="username"
            {...form.register("username")}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          {form.formState.errors.username && <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.username.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="font-semibold text-gray-800">
            {t('members.form.email')} {form.watch('isAdmin') ? '*' : ''}
          </Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          {form.formState.errors.email && <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.email.message}</p>}
        </div>
        {/* Şifre alanı sadece isAdmin ise göster */}
        {form.watch('isAdmin') && (
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
        )}
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
