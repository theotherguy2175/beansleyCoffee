import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSendTestEmail, useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { ApiError } from "@/lib/api";

export function AdminSettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const sendTestEmail = useSendTestEmail();

  const [makerEmail, setMakerEmail] = useState("");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");

  useEffect(() => {
    if (settings?.maker_notification_email) setMakerEmail(settings.maker_notification_email);
    if (typeof settings?.smtp_user === "string") setSmtpUser(settings.smtp_user);
  }, [settings]);

  async function handleSaveNotifications() {
    try {
      await updateSettings.mutateAsync({ maker_notification_email: makerEmail });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save settings");
    }
  }

  async function handleSaveSmtp() {
    try {
      const payload: Record<string, string> = { smtp_user: smtpUser };
      if (smtpPass) payload.smtp_pass = smtpPass;
      await updateSettings.mutateAsync(payload);
      setSmtpPass("");
      toast.success("SMTP settings saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save SMTP settings");
    }
  }

  async function handleTestEmail() {
    try {
      const result = await sendTestEmail.mutateAsync(undefined);
      if (result.success) {
        toast.success("Test email sent — check the inbox.");
      } else {
        toast.error(result.error ?? "Test email failed to send");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't send test email");
    }
  }

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Order notifications</CardTitle>
          <CardDescription>Where order notification emails are sent when someone places an order.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoading ? (
            <Skeleton className="h-9" />
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="maker-email">Maker notification email</Label>
              <Input
                id="maker-email"
                type="email"
                value={makerEmail}
                onChange={(e) => setMakerEmail(e.target.value)}
                placeholder="maker@example.com"
              />
            </div>
          )}
          <Button onClick={handleSaveNotifications} disabled={updateSettings.isPending} className="w-fit">
            Save
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>SMTP (Gmail)</CardTitle>
          <CardDescription>
            The Gmail address and app password used to send order notification emails. Overrides the server's env vars once
            set. Create an app password at{" "}
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              myaccount.google.com/apppasswords
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoading ? (
            <Skeleton className="h-9" />
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="smtp-user">Gmail address</Label>
                <Input
                  id="smtp-user"
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="you@gmail.com"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="smtp-pass">App password</Label>
                <Input
                  id="smtp-pass"
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder={settings?.smtpPassSet ? "•••••••••••••• (set — leave blank to keep)" : "16-character app password"}
                />
              </div>
            </>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSaveSmtp} disabled={updateSettings.isPending} className="w-fit">
              Save
            </Button>
            <Button
              variant="outline"
              onClick={handleTestEmail}
              disabled={sendTestEmail.isPending}
              className="w-fit"
            >
              {sendTestEmail.isPending ? "Sending…" : "Send test email"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
