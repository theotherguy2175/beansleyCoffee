import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateUser, useUpdateUser, useUser } from "@/hooks/useUsers";
import { ApiError } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
  role: z.enum(["admin", "staff", "customer"]),
});

export function AdminUserFormPage() {
  const { userId } = useParams();
  const isEditing = userId !== undefined;
  const navigate = useNavigate();
  const { data: user, isLoading } = useUser(isEditing ? Number(userId) : undefined);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const form = useForm({
    resolver: zodResolver(schema),
    values: user
      ? { name: user.name, email: user.email, role: user.role, password: "" }
      : { name: "", email: "", role: "customer" as const, password: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    if (!isEditing && !values.password) {
      form.setError("password", { message: "Password is required" });
      return;
    }

    try {
      if (isEditing && user) {
        await updateUser.mutateAsync({ id: user.id, name: values.name, email: values.email, role: values.role });
        toast.success("User updated");
      } else {
        await createUser.mutateAsync({ name: values.name, email: values.email, role: values.role, password: values.password! });
        toast.success("User created");
      }
      navigate("/admin/users");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save user");
    }
  }

  if (isEditing && isLoading) {
    return (
      <div className="py-6">
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="py-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit user" : "Add user"}</CardTitle>
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isEditing && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" loading={form.formState.isSubmitting} className="mt-2">
                {isEditing ? "Save changes" : "Add user"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
