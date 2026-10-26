---
description: "Use when adding or editing forms, React islands, API routes, or auth flows. Covers the server-driven form contract, the redirect-with-?error= error protocol (errors are never JSON), null-Supabase handling, and inline validation without zod."
applyTo: "src/pages/**/*.astro, src/pages/api/**/*.ts, src/components/auth/**/*.tsx"
---

# Server-driven forms & error flow

Forms are plain HTML POSTs handled by API routes. No `fetch`, no `useActionState`, no JSON error payloads.

## The contract

1. **Astro page** reads the error from the query string and hands it to the island:

   ```astro
   ---
   const error = Astro.url.searchParams.get("error");
   ---

   <SignInForm serverError={error} client:load />
   ```

2. **React island** declares a local `interface Props` with `serverError?: string | null`, renders `<ServerError message={serverError} />`, and posts with a native form:

   ```tsx
   <form method="POST" action="/api/auth/signin" onSubmit={handleSubmit} noValidate>
   ```

3. **API route** exports an uppercase verb and redirects on both success and failure:

   ```ts
   export const POST: APIRoute = async (context) => {
     const form = await context.request.formData();
     const email = form.get("email") as string;
     const password = form.get("password") as string;

     const supabase = createClient(context.request.headers, context.cookies);
     if (!supabase) {
       return context.redirect(`/auth/signin?error=${encodeURIComponent("Supabase is not configured")}`);
     }

     const { error } = await supabase.auth.signInWithPassword({ email, password });
     if (error) {
       return context.redirect(`/auth/signin?error=${encodeURIComponent(error.message)}`);
     }
     return context.redirect("/");
   };
   ```

## Rules

- **Errors are never JSON.** Always redirect back to the form page with `?error=<encodeURIComponent(message)>`. Never `return new Response(JSON.stringify(...))` and never have the island `fetch` the route.
- **Check `supabase === null` first**, before any auth call. `createClient()` returns `null` when `SUPABASE_URL`/`SUPABASE_KEY` are unset — this is the missing-config path, not an exception.
- **No zod.** Validate inline in the island (regex + length), not in the API route. Keep `noValidate` on the form and only call `e.preventDefault()` when `validate()` returns false, so the native POST proceeds otherwise.
- **Field state shape**: `useState<{ email?: string; password?: string }>({})` for `errors`, plus a `clearError(field)` on change so an error disappears as the user retypes.
- **Reuse the existing pieces** before writing markup: `FormField`, `PasswordToggle`, `SubmitButton`, `ServerError` in `@/components/auth/`, and `Button` in `@/components/ui/`.
- **Imports use the `@/` alias**; merge conditional class names with `cn()` from `@/lib/utils` — never concatenate strings.
- **New protected page?** Add its path prefix to `PROTECTED_ROUTES` in `src/middleware.ts`. Never add a per-page auth guard.
