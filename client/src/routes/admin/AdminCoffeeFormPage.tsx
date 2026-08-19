import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { CoffeeForm } from "@/components/shared/CoffeeForm";
import { useCoffee } from "@/hooks/useCoffees";

export function AdminCoffeeFormPage() {
  const { coffeeId } = useParams();
  const isEditing = coffeeId !== undefined;
  const { data: coffee, isLoading } = useCoffee(isEditing ? Number(coffeeId) : undefined);

  if (isEditing && isLoading) {
    return (
      <div className="py-6">
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="py-6">
      <CoffeeForm basePath="/admin/menu" coffee={isEditing ? coffee : undefined} />
    </div>
  );
}
