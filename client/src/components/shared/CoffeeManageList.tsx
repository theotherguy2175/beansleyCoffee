import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Coffee as CoffeeIcon, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAllCoffees, useDeleteCoffee, useSetCoffeeAvailability } from "@/hooks/useCoffees";
import { ApiError } from "@/lib/api";

export function CoffeeManageList({ basePath }: { basePath: string }) {
  const { data: coffees, isLoading } = useAllCoffees();
  const setAvailability = useSetCoffeeAvailability();
  const deleteCoffee = useDeleteCoffee();

  async function handleToggle(id: number, isAvailable: boolean) {
    try {
      await setAvailability.mutateAsync({ id, isAvailable });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update availability");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteCoffee.mutateAsync(id);
      toast.success("Coffee deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't delete coffee");
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link to={`${basePath}/options`}>Menu options</Link>
        </Button>
        <Button asChild>
          <Link to={`${basePath}/new`}>Add coffee</Link>
        </Button>
      </div>

      {coffees?.length === 0 && <p className="text-muted-foreground">No coffees yet — add the first one.</p>}

      {coffees?.map((coffee) => (
        <Card key={coffee.id}>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="bg-muted flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md">
                {coffee.imagePath ? (
                  <img src={`/uploads/${coffee.imagePath}`} alt={coffee.name} className="h-full w-full object-cover" />
                ) : (
                  <CoffeeIcon className="text-muted-foreground size-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{coffee.name}</p>
                  {coffee.coffeeTypeName && (
                    <Badge variant="outline" className="text-xs">
                      {coffee.coffeeTypeName}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground truncate text-sm">{coffee.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={coffee.isAvailable} onCheckedChange={(checked) => handleToggle(coffee.id, checked)} />
                <span className="text-muted-foreground w-16 text-xs">{coffee.isAvailable ? "Available" : "Hidden"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" asChild>
                  <Link to={`${basePath}/${coffee.id}/edit`}>
                    <Pencil className="size-4" />
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {coffee.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This can't be undone. Past orders will keep their own record of the name.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(coffee.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
