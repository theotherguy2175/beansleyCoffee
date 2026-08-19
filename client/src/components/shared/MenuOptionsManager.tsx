import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import {
  useCoffeeTypes,
  useCreateCoffeeType,
  useCreateSize,
  useCreateSyrup,
  useDeleteCoffeeType,
  useDeleteSize,
  useDeleteSyrup,
  useSizes,
  useSyrups,
} from "@/hooks/useMenuOptions";

function OptionSection({
  title,
  description,
  placeholder,
  items,
  isLoading,
  onAdd,
  onDelete,
  isAdding,
}: {
  title: string;
  description: string;
  placeholder: string;
  items: { id: number; label: string }[] | undefined;
  isLoading: boolean;
  onAdd: (value: string) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
  isAdding: boolean;
}) {
  const [value, setValue] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    try {
      await onAdd(value.trim());
      setValue("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't add");
    }
  }

  async function handleDelete(id: number) {
    try {
      await onDelete(id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't delete");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} />
          <Button type="submit" disabled={isAdding} className="shrink-0">
            Add
          </Button>
        </form>

        {isLoading ? (
          <Skeleton className="h-8" />
        ) : items?.length === 0 ? (
          <p className="text-muted-foreground text-sm">None yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items?.map((item) => (
              <Badge key={item.id} variant="secondary" className="gap-1 py-1 pr-1 text-sm">
                {item.label}
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="hover:bg-background/50 rounded-full p-0.5"
                  aria-label={`Remove ${item.label}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MenuOptionsManager() {
  const { data: coffeeTypes, isLoading: typesLoading } = useCoffeeTypes();
  const createType = useCreateCoffeeType();
  const deleteType = useDeleteCoffeeType();

  const { data: syrups, isLoading: syrupsLoading } = useSyrups();
  const createSyrup = useCreateSyrup();
  const deleteSyrup = useDeleteSyrup();

  const { data: sizes, isLoading: sizesLoading } = useSizes();
  const createSize = useCreateSize();
  const deleteSize = useDeleteSize();

  return (
    <div className="flex flex-col gap-6">
      <OptionSection
        title="Coffee types"
        description="Categories used to filter the menu (e.g. Espresso-Based, Cold Brew)."
        placeholder="e.g. Specialty"
        items={coffeeTypes?.map((t) => ({ id: t.id, label: t.name }))}
        isLoading={typesLoading}
        isAdding={createType.isPending}
        onAdd={(name) => createType.mutateAsync(name)}
        onDelete={(id) => deleteType.mutateAsync(id)}
      />
      <OptionSection
        title="Syrups"
        description="Syrup choices customers can add to an order."
        placeholder="e.g. Vanilla"
        items={syrups?.map((s) => ({ id: s.id, label: s.name }))}
        isLoading={syrupsLoading}
        isAdding={createSyrup.isPending}
        onAdd={(name) => createSyrup.mutateAsync(name)}
        onDelete={(id) => deleteSyrup.mutateAsync(id)}
      />
      <OptionSection
        title="Sizes"
        description="Size presets (in ounces) customers can choose from."
        placeholder="e.g. 12"
        items={sizes?.map((s) => ({ id: s.id, label: `${s.ounces} oz` }))}
        isLoading={sizesLoading}
        isAdding={createSize.isPending}
        onAdd={(value) => {
          const ounces = Number(value);
          if (!Number.isInteger(ounces) || ounces <= 0) throw new ApiError(400, "Size must be a whole number of ounces");
          return createSize.mutateAsync(ounces);
        }}
        onDelete={(id) => deleteSize.mutateAsync(id)}
      />
    </div>
  );
}
