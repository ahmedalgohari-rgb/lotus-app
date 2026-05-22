# Site Architecture

Plan site architecture and information architecture for: **$ARGUMENTS**

## What This Skill Does

Design the structure of a website or app — navigation, page hierarchy, URL structure, and content organization — so users find what they need and search engines understand what the site is about.

## Why Architecture Matters

Poor information architecture is the silent conversion killer:
- Users can't find what they're looking for → they leave
- Search engines can't determine topical authority → rankings suffer
- Content is siloed → internal linking is weak → PageRank doesn't flow
- New content has nowhere logical to live → site grows messily

## Architecture Design Process

### 1. Audit (if redesigning existing site)

- List all existing pages and their current location
- Identify orphan pages (not linked from anywhere)
- Identify thin sections (categories with 1-2 pages)
- Identify heavy sections (categories that should be split)
- Map current user paths from analytics (where do people actually go?)

### 2. Content Inventory and Categorization

List all content types that will exist on the site:
- Marketing pages (home, features, pricing, about, contact)
- Product pages (specific feature pages, integrations, use cases)
- Trust pages (customers, case studies, testimonials)
- Support content (docs, help articles, FAQs)
- Editorial content (blog, resources, guides)
- Legal (privacy, terms)

### 3. Navigation Structure

**Primary navigation** (max 5-7 items):
- Group by user intent, not internal org structure
- Most important pages first and last (primacy/recency effect)
- Use action-oriented labels when possible ("See pricing" beats "Pricing")

**Secondary navigation**: utility links (login, docs, support)

**Footer navigation**: full site map, less-visited but important pages

### 4. URL Architecture

URL structure signals topical hierarchy to search engines:

```
domain.com/                          # Home
domain.com/features/                 # Features hub
domain.com/features/[feature-name]/  # Specific feature
domain.com/blog/                     # Blog hub
domain.com/blog/[category]/          # Category
domain.com/blog/[category]/[slug]/   # Article
domain.com/customers/                # Case studies hub
domain.com/customers/[company-slug]/ # Individual case study
```

Rules:
- Lowercase, hyphens, no special characters
- 3 levels maximum for most content (home > category > page)
- Keywords in URLs (descriptive, not random IDs)

### 5. Internal Linking Strategy

Define linking relationships:
- Hub pages link out to all cluster pages
- Cluster pages link back to hub and to related clusters
- Blog posts link to relevant product pages (conversion links)
- Product pages link to relevant case studies and blog posts (proof links)

### 6. Pillar/Cluster Model for SEO

For each main topic:
- One **pillar page** (comprehensive, 2000+ words, targets broad keyword)
- 5-15 **cluster pages** (specific subtopics, link to and from pillar)

## Output

Deliver: navigation structure, URL taxonomy, page hierarchy diagram (text format), and internal linking map for top 3 content pillars.
