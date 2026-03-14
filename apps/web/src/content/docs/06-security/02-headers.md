# Security Headers

<!-- AI_CONTEXT
This document covers HTTP security headers configuration.
Key files: apps/api/src/index.ts (helmet middleware)
Library: helmet (default configuration with no customization in current code)
App Shell uses helmet() with no arguments — the default configuration.
These headers are set by the API server only. Next.js has its own separate security configuration.
Related docs: cors, backend/middleware
-->

## What Security Headers Are

When a browser receives a response from a server, that response includes not just the content (HTML, JSON, etc.) but also **HTTP headers** — metadata that tells the browser how to handle the response. Security headers are a subset of these that instruct the browser to enforce specific security behaviors.

Without them, browsers fall back to permissive defaults. With them, you can tell the browser to refuse to run inline scripts (blocking most XSS attacks), refuse to display the page inside an iframe on another site (blocking clickjacking), and only connect to your site over HTTPS going forward.

The great thing about security headers is they're free to add and require no changes to your application code.

## Helmet

App Shell uses **Helmet**, a library that sets a collection of security headers in one line:

```typescript
app.use(helmet());
```

Helmet's defaults are a reasonable baseline for most applications. Here's what each header does and why it matters.

## Headers Set by Default

### Content-Security-Policy (CSP)

**What it does:** Tells the browser which sources it's allowed to load scripts, styles, images, fonts, and other resources from.

**Why it matters:** The primary defense against Cross-Site Scripting (XSS). XSS happens when an attacker manages to inject malicious JavaScript into your page — through a form input, a stored database value that gets rendered, or a third-party service. CSP can stop that script from executing or from sending data anywhere useful.

```
Content-Security-Policy: default-src 'self'; base-uri 'self'; font-src 'self' https: data:; ...
```

Helmet's default CSP is fairly strict. If you add third-party scripts (analytics, chat widgets, etc.), you'll need to extend it:

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://analytics.example.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://avatars.example.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
}));
```

### X-Content-Type-Options

**What it does:** Tells the browser not to guess the content type of a response — it must use what the server declared.

```
X-Content-Type-Options: nosniff
```

**Why it matters:** Without this, if you upload a file with a `.jpg` extension that actually contains JavaScript, some browsers would run it as a script. "MIME sniffing" is the attack; `nosniff` blocks it.

### X-Frame-Options

**What it does:** Controls whether your page can be embedded inside an `<iframe>` on another website.

```
X-Frame-Options: SAMEORIGIN
```

**Why it matters:** Clickjacking is an attack where a malicious site embeds your page in a transparent iframe, then tricks users into clicking buttons they can't see. Setting this to `SAMEORIGIN` means your pages can only be framed by pages on your own domain.

### Strict-Transport-Security (HSTS)

**What it does:** Once a browser has connected to your site over HTTPS, it will refuse to connect over HTTP in the future — even if the user types `http://`.

```
Strict-Transport-Security: max-age=15552000; includeSubDomains
```

**Why it matters:** Prevents "SSL stripping" attacks where an attacker intercepts an initial HTTP connection before your server redirects to HTTPS. After the first HTTPS visit, the browser won't give the attacker that window.

### Referrer-Policy

**What it does:** Controls how much information the browser includes in the `Referer` header when users navigate away from your site.

```
Referrer-Policy: no-referrer
```

**Why it matters:** Without this, if a user clicks a link from your dashboard to an external site, the URL of the page they were on is sent in the `Referer` header. That URL might contain session IDs, user IDs, or other sensitive data you don't want leaking.

### X-XSS-Protection

```
X-XSS-Protection: 0
```

This is intentionally set to **disabled**. Older browsers had a built-in XSS filter that this header controlled, but it could be abused to introduce vulnerabilities. Modern browsers have removed it entirely. CSP is the proper XSS defense now.

### Cross-Origin Headers

Helmet also sets several `Cross-Origin-*` headers that control how your resources can be accessed by other origins:

- `Cross-Origin-Embedder-Policy` — Controls embedding cross-origin resources
- `Cross-Origin-Opener-Policy` — Controls cross-origin window relationships
- `Cross-Origin-Resource-Policy` — Controls cross-origin resource loading

## Testing Your Headers

While the API is running locally, you can check headers with curl:

```bash
curl -I http://localhost:4001/healthz
```

Or use the [Security Headers scanner](https://securityheaders.com/) against a publicly deployed version.

## Customizing Helmet

The default configuration is a good starting point. The most common reasons to customize:

**Adding external script sources (analytics, etc.):**
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.segment.com"],
    },
  },
}));
```

**Disabling a specific header:**
```typescript
app.use(helmet({
  frameguard: false, // Removes X-Frame-Options
}));
```

**Allowing cross-origin embedding (e.g., if you embed content in iframes):**
```typescript
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));
```

Start with the defaults and relax specific headers only when something breaks. The opposite approach — starting permissive and tightening later — rarely happens in practice.

## A Note on Next.js

Helmet sets headers on the API server responses (`apps/api`). Next.js serves the frontend (`apps/web`) and handles its own headers separately. You can add security headers to Next.js responses in `next.config.js` using the `headers()` async function, though App Shell doesn't configure this by default — the API's Helmet config only covers API responses.

## Next Steps

- **[CORS](/dashboard/docs/security/cors)** — Controlling which origins can make requests
- **[Environment](/dashboard/docs/security/environment)** — Keeping secrets out of your code
