"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@clerk/nextjs";
import { Save, User } from "lucide-react";
import { useProfileForm } from "@/hooks/useProfileForm";

export default function ProfilePage() {
  const { form, isLoading, isSaving, onSubmit, watchValues } = useProfileForm();
  const { register, formState: { errors } } = form;

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
              <div>
                <h1 className="flex items-center text-3xl font-bold tracking-tight text-foreground">
                  <User className="mr-2 h-8 w-8 text-primary" />
                  Profile Settings
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your profile information
                </p>
              </div>

              <Card className="border-border/70 bg-card">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-6">
                    <Avatar className="h-20 w-20">
                      {watchValues.avatarUrl && (
                        <AvatarImage
                          src={watchValues.avatarUrl || "/placeholder.xyz"}
                          alt={watchValues.displayName ?? "Avatar"}
                        />
                      )}
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex justify-between ">
                        <CardTitle className="text-2xl text-foreground">
                          {watchValues.displayName || "Your display name"}
                        </CardTitle>
                        <div className="">
                          <SignOutButton>
                            <Button className="bg-red-500 hover:bg-red-600 text-white">Sign Out</Button>
                          </SignOutButton>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-medium",
                            watchValues.handle
                              ? "bg-primary/10 text-primary"
                              : "bg-accent text-accent-foreground"
                          )}
                        >
                          {watchValues.handle ? `@${watchValues.handle}` : "@handle"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-border/70 bg-card">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Edit Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={onSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">

                      {/* Display Name */}
                      <div className="space-y-2">
                        <label htmlFor="displayName" className="text-sm font-semibold text-foreground">
                          Display Name
                        </label>
                        <Input
                          id="displayName"
                          placeholder="Enter your name"
                          {...register("displayName")}
                          disabled={isLoading || isSaving}
                          className={cn("mt-2 bg-background/60 text-sm", errors.displayName && "border-red-500")}
                        />
                        {errors.displayName && (
                          <p className="text-xs text-red-500">{errors.displayName.message}</p>
                        )}
                      </div>

                      {/* Handle */}
                      <div className="space-y-2">
                        <label htmlFor="handle" className="text-sm font-semibold text-foreground">
                          Handle
                        </label>
                        <Input
                          id="handle"
                          placeholder="@nickname"
                          {...register("handle")}
                          disabled={isLoading || isSaving}
                          className={cn("mt-2 bg-background/60 text-sm", errors.handle && "border-red-500")}
                        />
                        {errors.handle && (
                          <p className="text-xs text-red-500">{errors.handle.message}</p>
                        )}
                      </div>

                      {/* Bio */}
                      <div className="space-y-2 md:col-span-2">
                        <label htmlFor="bio" className="text-sm font-semibold text-foreground">
                          Bio
                        </label>
                        <Textarea
                          id="bio"
                          placeholder="Tell about yourself!!!"
                          rows={4}
                          {...register("bio")}
                          disabled={isLoading || isSaving}
                          className={cn("mt-2 bg-background/60 text-sm", errors.bio && "border-red-500")}
                        />
                        {errors.bio && (
                          <p className="text-xs text-red-500">{errors.bio.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Avatar URL */}
                    <div className="space-y-2">
                      <label htmlFor="avatarUrl" className="text-sm font-semibold text-foreground">
                        Avatar URL
                      </label>
                      <Input
                        id="avatarUrl"
                        placeholder="https://example.com/avatar.jpg"
                        {...register("avatarUrl")}
                        disabled={isLoading || isSaving}
                        className={cn("mt-2 bg-background/60 text-sm", errors.avatarUrl && "border-red-500")}
                      />
                      {errors.avatarUrl && (
                        <p className="text-xs text-red-500">{errors.avatarUrl.message}</p>
                      )}
                    </div>

                    <CardFooter className="p-0 pt-4">
                      <Button
                        type="submit"
                        disabled={isLoading || isSaving}
                        className="min-w-[150px] bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </CardFooter>
                  </form>
                </CardContent>
              </Card>
          </div>
        </div>


      </div>


    </>
  );
}