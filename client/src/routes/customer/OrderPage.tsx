import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoffee } from "@/hooks/useCoffees";
import { useCreateOrder } from "@/hooks/useOrders";
import { useSizes, useSyrups } from "@/hooks/useMenuOptions";
import { useBaristas } from "@/hooks/useUsers";
import { ApiError } from "@/lib/api";

const NONE = "none";

export interface ReorderState {
  notes: string | null;
  syrupNames: string[];
  sizeOz: number | null;
  strengthLabel: string | null;
}

const schema = z.object({
  notes: z.string().max(500).optional(),
  pickupTime: z.string().min(1, "Pick a pickup time"),
  syrupNames: z.array(z.string()),
  sizeOz: z.string(),
  strengthLabel: z.string(),
  baristaId: z.string().min(1, "Choose a barista"),
});

function toDateTimeLocal(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function minDateTimeLocal() {
  const now = new Date(Date.now() + 5 * 60_000);
  now.setSeconds(0, 0);
  return toDateTimeLocal(now);
}

function defaultPickupTime() {
  const now = new Date(Date.now() + 30 * 60_000);
  now.setSeconds(0, 0);
  return toDateTimeLocal(now);
}

export function OrderPage() {
  const { coffeeId } = useParams();
  const id = Number(coffeeId);
  const navigate = useNavigate();
  const location = useLocation();
  const reorder = (location.state as { reorder?: ReorderState } | null)?.reorder;
  const { data: coffee, isLoading } = useCoffee(id);
  const { data: syrups } = useSyrups();
  const { data: sizes } = useSizes();
  const { data: baristas, isLoading: baristasLoading } = useBaristas();
  const createOrder = useCreateOrder();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      // Reordering reuses the previous coffee's customization, but the pickup
      // time always resets to "30 minutes from now" — the old order's pickup
      // time is stale by definition. Barista isn't carried over either — who's
      // available now may not be who made it last time.
      notes: reorder?.notes ?? "",
      pickupTime: defaultPickupTime(),
      syrupNames: reorder?.syrupNames ?? [],
      sizeOz: reorder?.sizeOz ? String(reorder.sizeOz) : NONE,
      strengthLabel: reorder?.strengthLabel ?? NONE,
      baristaId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      const order = await createOrder.mutateAsync({
        coffeeId: id,
        baristaId: Number(values.baristaId),
        notes: values.notes,
        pickupTime: new Date(values.pickupTime).toISOString(),
        syrupNames: values.syrupNames.length > 0 ? values.syrupNames : undefined,
        sizeOz: values.sizeOz === NONE ? undefined : Number(values.sizeOz),
        strengthLabel: values.strengthLabel === NONE ? undefined : values.strengthLabel,
      });
      navigate(`/orders/${order.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't place your order");
    }
  }

  const noBaristasAvailable = !baristasLoading && (baristas?.length ?? 0) === 0;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!coffee) {
    return <div className="mx-auto max-w-md px-4 py-16 text-center text-muted-foreground">Coffee not found.</div>;
  }

  const strengthOptions = coffee.strengthOptions ?? [];

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Order {coffee.name}</CardTitle>
          <CardDescription>{coffee.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="baristaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Choose your barista</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={noBaristasAvailable}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={noBaristasAvailable ? "No baristas available" : "Pick a barista"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {baristas?.map((barista) => (
                          <SelectItem key={barista.id} value={String(barista.id)}>
                            {barista.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {noBaristasAvailable && (
                      <p className="text-muted-foreground text-sm">
                        No baristas are available right now — check back soon.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pickupTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" min={minDateTimeLocal()} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {sizes && sizes.length > 0 && (
                <FormField
                  control={form.control}
                  name="sizeOz"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE}>No preference</SelectItem>
                          {sizes.map((size) => (
                            <SelectItem key={size.id} value={String(size.ounces)}>
                              {size.ounces} oz
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {strengthOptions.length > 0 && (
                <FormField
                  control={form.control}
                  name="strengthLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strength</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE}>No preference</SelectItem>
                          {strengthOptions.map((option) => (
                            <SelectItem key={option.id} value={option.label}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {syrups && syrups.length > 0 && (
                <FormField
                  control={form.control}
                  name="syrupNames"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Syrup (optional, pick as many as you like)</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {syrups.map((syrup) => {
                          const selected = field.value.includes(syrup.name);
                          return (
                            <Button
                              key={syrup.id}
                              type="button"
                              variant={selected ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                field.onChange(
                                  selected
                                    ? field.value.filter((name: string) => name !== syrup.name)
                                    : [...field.value, syrup.name]
                                )
                              }
                            >
                              {syrup.name}
                            </Button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Oat milk, extra shot, name for the cup…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" loading={form.formState.isSubmitting} disabled={noBaristasAvailable} className="mt-2">
                Place order
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
