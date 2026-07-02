"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNewThread } from "@/hooks/useNewThread";

export function NewThreadForm() {
  const { form, categories, isLoading, isSubmitting, onSubmit } = useNewThread();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Start a new thread
        </h1>
      </div>

      <Card className="border-border/70 bg-card">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Thread Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-foreground"
                htmlFor="title"
              >
                Thread Title
              </label>
              <Input
                id="title"
                placeholder="Thread Title..."
                {...form.register("title")}
                disabled={isLoading || isSubmitting}
                className="border-border mt-3 bg-background/70 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-foreground"
                htmlFor="categorySlug"
              >
                Category
              </label>
              <select
                id="categorySlug"
                {...form.register("categorySlug")}
                disabled={isLoading || isSubmitting}
                className="h-10 mt-3 w-full rounded-md border border-border bg-background/70 px-3 text-sm text-foreground focus:outline focus:ring-2 focus:ring-primary/30"
              >
                {categories.map((category) => (
                  <option
                    value={category.slug}
                    id={category.slug}
                    key={category.slug}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-foreground"
                htmlFor="body"
              >
                Description
              </label>
              <Textarea
                id="body"
                rows={8}
                placeholder="Thread description..."
                disabled={isLoading || isSubmitting}
                className="border-border mt-3 bg-background/70 text-sm"
                {...form.register("body")}
              />
            </div>

            <CardFooter className="flex justify-end border-t border-border px-0 pt-5">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? "Submitting..." : "Publish Thread"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
