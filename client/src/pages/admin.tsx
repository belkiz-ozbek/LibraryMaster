import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export default function AdminPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showUsers, setShowUsers] = useState(false);
  const [showStats, setShowStats] = useState(false);

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold text-on-surface mb-2">{t("sidebar.admin")}</h2>
            <p className="text-text-muted">{t("errors.forbidden")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("sidebar.admin")} Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Button onClick={() => setShowUsers((v) => !v)}>{t("members.title")}</Button>
            <Button onClick={() => setShowStats((v) => !v)}>{t("statistics.title")}</Button>
          </div>
        </CardContent>
      </Card>
      {showUsers && (
        <Card>
          <CardHeader>
            <CardTitle>{t("members.management")}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Buraya üye yönetim bileşenleri eklenebilir */}
            <p>{t("members.managementDesc")}</p>
          </CardContent>
        </Card>
      )}
      {showStats && (
        <Card>
          <CardHeader>
            <CardTitle>{t("statistics.titleAndReports")}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Buraya istatistik bileşenleri eklenebilir */}
            <p>{t("statistics.analyticsDesc")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 