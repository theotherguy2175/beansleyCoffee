import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSendTestEmail, useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useResetTheme, useUpdateTheme } from "@/hooks/useTheme";
import { ApiError } from "@/lib/api";
import { applyTheme, DEFAULT_THEME, isValidHex } from "@/lib/theme";
import type { ThemeColors } from "@/types/api";

const THEME_FIELDS: Array<{ key: keyof ThemeColors; label: string; description: string }> = [
  { key: "theme_primary", label: "Primary", description: "Main buttons, links, active states" },
  { key: "theme_secondary", label: "Secondary", description: "Secondary buttons, subtle badges" },
  { key: "theme_accent", label: "Accent", description: "Hover states, highlighted badges" },
  { key: "theme_background", label: "Background", description: "Page background" },
  { key: "theme_foreground", label: "Text", description: "Default body text color" },
  { key: "theme_card", label: "Card", description: "Card and panel backgrounds" },
  { key: "theme_border", label: "Border", description: "Borders and dividers" },
];

function ColorField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-9 shrink-0 cursor-pointer rounded-md border"
        aria-label={label}
      />
      <div className="min-w-0 flex-1">
        <Label className="text-sm">{label}</Label>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-28 font-mono text-xs"
        maxLength={7}
      />
    </div>
  );
}

export function AdminSettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const sendTestEmail = useSendTestEmail();
  const updateTheme = useUpdateTheme();
  const resetTheme = useResetTheme();

  const [makerEmail, setMakerEmail] = useState("");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [theme, setTheme] = useState<Record<keyof ThemeColors, string>>(DEFAULT_THEME);

  useEffect(() => {
    if (settings?.maker_notification_email) setMakerEmail(settings.maker_notification_email);
    if (typeof settings?.smtp_user === "string") setSmtpUser(settings.smtp_user);
    if (settings) {
      const next = { ...DEFAULT_THEME };
      for (const field of THEME_FIELDS) {
        const value = settings[field.key];
        if (typeof value === "string" && isValidHex(value)) next[field.key] = value;
      }
      setTheme(next);
    }
  }, [settings]);

  function handleThemeFieldChange(key: keyof ThemeColors, value: string) {
    setTheme((prev) => ({ ...prev, [key]: value }));
    if (isValidHex(value)) applyTheme({ [key]: value });
  }

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

  async function handleSaveTheme() {
    const invalid = THEME_FIELDS.find((f) => !isValidHex(theme[f.key]));
    if (invalid) {
      toast.error(`${invalid.label} isn't a valid hex color`);
      return;
    }
    try {
      await updateTheme.mutateAsync(theme);
      toast.success("Theme saved for everyone");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save theme");
    }
  }

  async function handleResetTheme() {
    try {
      await resetTheme.mutateAsync();
      setTheme(DEFAULT_THEME);
      applyTheme(DEFAULT_THEME);
      toast.success("Theme reset to default");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't reset theme");
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
          <Button onClick={handleSaveNotifications} loading={updateSettings.isPending} className="w-fit">
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
            <Button onClick={handleSaveSmtp} loading={updateSettings.isPending} className="w-fit">
              Save
            </Button>
            <Button variant="outline" onClick={handleTestEmail} loading={sendTestEmail.isPending} className="w-fit">
              Send test email
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Theme colors</CardTitle>
          <CardDescription>
            Changes preview live on this page as you pick — nothing applies for other visitors until you hit Save.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {THEME_FIELDS.map((field) => (
                <ColorField
                  key={field.key}
                  label={field.label}
                  description={field.description}
                  value={theme[field.key]}
                  onChange={(value) => handleThemeFieldChange(field.key, value)}
                />
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSaveTheme} loading={updateTheme.isPending} className="w-fit">
              Save theme
            </Button>
            <Button variant="outline" onClick={handleResetTheme} loading={resetTheme.isPending} className="w-fit">
              Reset to default
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
