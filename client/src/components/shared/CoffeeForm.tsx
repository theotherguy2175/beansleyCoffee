import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCoffee, useUpdateCoffee } from "@/hooks/useCoffees";
import { useCoffeeTypes } from "@/hooks/useMenuOptions";
import { ApiError } from "@/lib/api";
import type { Coffee } from "@/types/api";

const NO_TYPE = "none";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  coffeeTypeId: z.string(),
});

export function CoffeeForm({ basePath, coffee }: { basePath: string; coffee?: Coffee }) {
  const navigate = useNavigate();
  const createCoffee = useCreateCoffee();
  const updateCoffee = useUpdateCoffee();
  const { data: coffeeTypes } = useCoffeeTypes();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [strengthOptions, setStrengthOptions] = useState<string[]>(coffee?.strengthOptions?.map((o) => o.label) ?? []);
  const [strengthInput, setStrengthInput] = useState("");

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: coffee?.name ?? "",
      description: coffee?.description ?? "",
      coffeeTypeId: coffee?.coffeeTypeId ? String(coffee.coffeeTypeId) : NO_TYPE,
    },
  });

  function addStrengthOption(e: React.FormEvent) {
    e.preventDefault();
    const label = strengthInput.trim();
    if (!label || strengthOptions.includes(label)) return;
    setStrengthOptions([...strengthOptions, label]);
    setStrengthInput("");
  }

  function removeStrengthOption(label: string) {
    setStrengthOptions(strengthOptions.filter((o) => o !== label));
  }

  async function onSubmit(values: z.infer<typeof schema>) {
    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("description", values.description ?? "");
    formData.set("coffeeTypeId", values.coffeeTypeId === NO_TYPE ? "" : values.coffeeTypeId);
    formData.set("strengthOptions", JSON.stringify(strengthOptions));
    if (imageFile) formData.set("image", imageFile);

    try {
      if (coffee) {
        await updateCoffee.mutateAsync({ id: coffee.id, formData });
        toast.success("Coffee updated");
      } else {
        await createCoffee.mutateAsync(formData);
        toast.success("Coffee created");
      }
      navigate(basePath);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save coffee");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{coffee ? `Edit ${coffee.name}` : "Add a coffee"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coffeeTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_TYPE}>No type</SelectItem>
                      {coffeeTypes?.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2">
              <Label>Strength options</Label>
              <p className="text-muted-foreground text-xs">
                Optional per-coffee choices customers pick from when ordering (e.g. "Single shot" / "Double shot", or
                "Regular" / "Decaf").
              </p>
              <div className="flex gap-2">
                <Input
                  value={strengthInput}
                  onChange={(e) => setStrengthInput(e.target.value)}
                  placeholder="e.g. Double shot"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addStrengthOption(e);
                  }}
                />
                <Button type="button" variant="outline" onClick={addStrengthOption} className="shrink-0">
                  Add
                </Button>
              </div>
              {strengthOptions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {strengthOptions.map((label) => (
                    <Badge key={label} variant="secondary" className="gap-1 py-1 pr-1 text-sm">
                      {label}
                      <button
                        type="button"
                        onClick={() => removeStrengthOption(label)}
                        className="hover:bg-background/50 rounded-full p-0.5"
                        aria-label={`Remove ${label}`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="coffee-image">Picture</Label>
              {coffee?.imagePath && !imageFile && (
                <img src={`/uploads/${coffee.imagePath}`} alt={coffee.name} className="h-32 w-32 rounded-md object-cover" />
              )}
              <Input
                id="coffee-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="submit" loading={form.formState.isSubmitting} className="mt-2">
              {coffee ? "Save changes" : "Add coffee"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
