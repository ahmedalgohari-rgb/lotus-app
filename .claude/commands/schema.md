# Schema

Generate JSON-LD schema markup for SEO for: **$ARGUMENTS**

## What This Skill Does

Write accurate, complete JSON-LD structured data that helps search engines understand page content and enables rich results in search.

## When Schema Markup Matters Most

Schema has the highest ROI on:
- **FAQ pages** — FAQ schema can expand results with accordion Q&A
- **Product pages** — shows price, availability, ratings in search results
- **Recipe pages** — rich cards with cook time, ratings, ingredients
- **How-to content** — step-by-step rich results
- **Events** — date, location, ticket info in SERP
- **Local business** — map pack, phone, hours, reviews
- **Articles / Blog posts** — author, publish date, breadcrumbs
- **Software / Apps** — ratings, OS compatibility

## Schema Types and Templates

### Organization

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{{company_name}}",
  "url": "{{url}}",
  "logo": "{{logo_url}}",
  "sameAs": [
    "{{twitter_url}}",
    "{{linkedin_url}}"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "{{email}}",
    "contactType": "customer support"
  }
}
```

### FAQ

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{{question}}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{{answer}}"
      }
    }
  ]
}
```

### SoftwareApplication

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "{{app_name}}",
  "operatingSystem": "{{iOS|Android|Web}}",
  "applicationCategory": "{{category}}",
  "offers": {
    "@type": "Offer",
    "price": "{{price}}",
    "priceCurrency": "{{currency}}"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{{rating}}",
    "reviewCount": "{{count}}"
  }
}
```

### BreadcrumbList

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "{{name}}",
      "item": "{{url}}"
    }
  ]
}
```

## Process

For $ARGUMENTS:
1. Identify which schema type(s) are appropriate
2. Generate the complete JSON-LD with all relevant fields populated
3. Flag any required fields that need information not yet provided
4. Note which fields enable specific rich result features
5. Provide the `<script>` tag wrapper for placement in `<head>`

## Validation

After generating, note:
- Test with Google's Rich Results Test: `search.google.com/test/rich-results`
- Schema.org validator: `validator.schema.org`
- Required vs. recommended fields per Google's documentation
