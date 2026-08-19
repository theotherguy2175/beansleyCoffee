import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { CoffeeForm } from "@/components/shared/CoffeeForm";
import { useCoffee } from "@/hooks/useCoffees";

export function StaffCoffeeFormPage() {
  const { coffeeId } = useParams();
  const isEditing = coffeeId !== undefined;
  const { data: coffee, isLoading } = useCoffee(isEditing ? Number(coffeeId) : undefined);

  if (isEditing && isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <CoffeeForm basePath="/staff/menu" coffee={isEditing ? coffee : undefined} />
    </div>
  );
}
