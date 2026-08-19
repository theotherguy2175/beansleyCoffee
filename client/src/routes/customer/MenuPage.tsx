import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useMenu } from "@/hooks/useCoffees";
import { CoffeeCard } from "@/components/shared/CoffeeCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";

const ALL_TYPES = "all";

export function MenuPage() {
  const { data: coffees, isLoading } = useMenu();
  const { user } = useAuth();
  const canManageMenu = user?.role === "staff" || user?.role === "admin";
  const [typeFilter, setTypeFilter] = useState(ALL_TYPES);

  const types = useMemo(() => {
    const names = new Set(coffees?.map((c) => c.coffeeTypeName).filter((name): name is string => Boolean(name)));
    return Array.from(names).sort();
  }, [coffees]);

  const filteredCoffees = coffees?.filter((c) => typeFilter === ALL_TYPES || c.coffeeTypeName === typeFilter);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Menu</h1>
          <p className="text-muted-foreground mt-1">Pick something to order — it's on the house.</p>
        </div>
        {canManageMenu && (
          <Button asChild>
            <Link to={user.role === "admin" ? "/admin/menu/new" : "/staff/menu/new"}>
              <Plus />
              Add coffee
            </Link>
          </Button>
        )}
      </div>

      {types.length > 0 && (
        <div className="mt-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TYPES}>All types</SelectItem>
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      )}

      {!isLoading && coffees?.length === 0 && (
        <p className="text-muted-foreground mt-8">No coffees on the menu yet — check back soon.</p>
      )}

      {!isLoading && filteredCoffees && filteredCoffees.length === 0 && coffees && coffees.length > 0 && (
        <p className="text-muted-foreground mt-8">No coffees match that filter.</p>
      )}

      {!isLoading && filteredCoffees && filteredCoffees.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCoffees.map((coffee) => (
            <CoffeeCard key={coffee.id} coffee={coffee} />
          ))}
        </div>
      )}
    </div>
  );
}
