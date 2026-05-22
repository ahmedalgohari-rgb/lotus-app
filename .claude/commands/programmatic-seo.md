# Programmatic SEO

Build programmatic SEO strategy and page templates for: **$ARGUMENTS**

## What This Skill Does

Design a programmatic SEO system — identifying the data patterns that generate thousands of valuable, indexable pages without writing each one manually.

## What Programmatic SEO Is

Programmatic SEO uses a template + data model to generate large numbers of pages targeting long-tail search queries. It works when:
- A pattern of queries exists that differs only by variable (location, category, comparison)
- You have or can acquire the structured data to fill the template
- Each page is genuinely useful to the searcher (not just keyword stuffing)

## Discovery Process

### 1. Identify Programmatic Patterns

Common patterns by query structure:
- **Location-based**: "[product/service] in [city/country]"
- **Comparison**: "[A] vs [B]"
- **Use-case**: "best [category] for [job-to-be-done]"
- **Integration**: "[product] + [tool] integration"
- **Template**: "[type] template for [use case]"
- **Directory**: "top [N] [category] in [vertical]"

For $ARGUMENTS, identify which patterns apply and estimate page volume.

### 2. Data Requirements

For each pattern, specify:
- What data populates the variable fields?
- Where does this data come from? (existing database, API, scrape, manual)
- Minimum data quality required to make the page useful
- What unique value does each page offer beyond just filling in the template?

### 3. Page Template Design

Every programmatic page needs:
- **H1**: includes the target keyword naturally
- **Unique intro paragraph**: generated from data, not copy-pasted
- **Core content block**: the unique, data-driven value for this specific page
- **Related pages**: internal linking to neighboring pages in the pattern
- **CTA**: relevant to the page intent (local? feature? comparison?)

Write the template with `{{variable}}` placeholders clearly marked.

### 4. Technical Requirements

- Canonical URLs for near-duplicate content
- Noindex for thin pages until content threshold is met
- XML sitemap coverage
- Page speed: all programmatic pages must hit Core Web Vitals
- Pagination if listing pages exceed 30-50 items

### 5. Quality Threshold

Define the minimum viable page:
- What's the minimum data required before a page goes live?
- What marks a page as "thin" and should be noindexed?

## Output

Deliver: identified programmatic patterns with estimated volume, data model specification, page template with placeholders, and 3 example pages filled with real or representative data.
