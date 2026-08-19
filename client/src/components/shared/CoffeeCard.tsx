import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, Coffee as CoffeeIcon } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Coffee } from "@/types/api";

const DESCRIPTION_EXPAND_THRESHOLD = 110;

export function CoffeeCard({ coffee }: { coffee: Coffee }) {
  const [expanded, setExpanded] = useState(false);
  const description = coffee.description?.trim();
  const canExpand = (description?.length ?? 0) > DESCRIPTION_EXPAND_THRESHOLD;

  return (
    <Card className="overflow-hidden pt-0">
      <div className="bg-muted flex h-40 shrink-0 items-center justify-center overflow-hidden">
        {coffee.imagePath ? (
          <img src={`/uploads/${coffee.imagePath}`} alt={coffee.name} className="h-full w-full object-cover" />
        ) : (
          <CoffeeIcon className="text-muted-foreground size-10" />
        )}
      </div>
      <CardHeader className="gap-1">
        <CardTitle className="truncate">{coffee.name}</CardTitle>
        {coffee.coffeeTypeName && (
          <Badge variant="outline" className="w-fit text-xs">
            {coffee.coffeeTypeName}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <div className="min-h-[3.75rem]">
          <p className={cn("text-muted-foreground text-sm", !expanded && "line-clamp-3")}>
            {description || "No description yet."}
          </p>
        </div>
        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-muted-foreground hover:text-foreground mt-1.5 flex items-center gap-1 text-xs"
          >
            {expanded ? "Show less" : "Read more"}
            {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to={`/order/${coffee.id}`}>Order this</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
