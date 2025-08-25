# 🌍 Plant Orientation Recommendation API

This document describes how to integrate **weather and season-based plant orientation recommendations** into the Lotus Plant Care app backend.

---

## 🎯 Overview

Plants in Egypt (and similar climates) need different sun exposure based on:

- **Season (date)**
- **Current weather conditions** (temperature, sunlight intensity, etc.)
- **Environment** (indoor vs outdoor)

This system provides an endpoint to recommend **where to place a plant** (east, west, north, south, shade, indoor window) dynamically.

---

## 🗄️ Prisma Model (Plant)

```prisma
model Plant {
  id                String   @id @default(uuid())
  name              String
  species           String
  drynessPreference String   // "completely_dry" | "mid_dry"
  environment       String   // "indoor" | "outdoor"
  orientation       String?  // stored as initial preference
  photoUrl          String?  // S3 photo

  city              String?
  governorate       String?
  latitude          Float?
  longitude         Float?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

---

## ⚡ Orientation Logic

### Seasons in Egypt
- **Summer (May–Sept):** Strong sun → prefer **east** mornings, or **north/shade** if very hot (>35°C).
- **Winter (Nov–Feb):** Weak sun → prefer **south** exposure for maximum light.
- **Spring/Autumn (Mar–Apr, Oct):** Moderate → **east or west**.

### Weather Adjustments
- **> 35°C** → move to **north/shade**.
- **< 15°C** → prefer **south**.
- **Cloudy/low sunlight** → increase exposure (south/east).

---

## 🛠️ Orientation Service

```ts
// services/orientation.service.ts
import type { Plant } from "@prisma/client";
import { getWeatherForPlant } from "./weather.service";

export async function getOrientationAdvice(plant: Plant) {
  const weather = await getWeatherForPlant(plant);

  const month = new Date().getMonth() + 1; // 1-12
  const avgTemp = weather.current?.temperature_2m ?? 25;

  let season: "summer" | "winter" | "spring" | "autumn";
  if ([12,1,2].includes(month)) season = "winter";
  else if ([6,7,8].includes(month)) season = "summer";
  else if ([3,4,5].includes(month)) season = "spring";
  else season = "autumn";

  let orientation = "east"; // default
  let indoorWindow = "east";

  if (season === "summer") {
    orientation = avgTemp > 35 ? "north/shade" : "east";
    indoorWindow = "north or east";
  }
  if (season === "winter") {
    orientation = "south";
    indoorWindow = "south";
  }
  if (season === "spring" || season === "autumn") {
    orientation = "east or west";
    indoorWindow = "east";
  }

  return {
    season,
    avgTemp,
    suggestion: plant.environment === "indoor" ? indoorWindow : orientation,
  };
}
```

---

## 🌱 API Route

```ts
// routes/plants.ts
import * as orientationService from "../services/orientation.service";

router.get("/:id/orientation", async (req, res, next) => {
  try {
    const plant = await plantService.get(req.params.id);
    const advice = await orientationService.getOrientationAdvice(plant);
    res.json(advice);
  } catch (e) { next(e); }
});
```

---

## 📊 Example Response

```json
{
  "season": "summer",
  "avgTemp": 37,
  "suggestion": "north/shade"
}
```

---

## 🚀 Future Enhancements
- Combine orientation logic with watering recommendation (`/recommendation`).
- Store **orientation history** in AuditLog for insights.
- Add **weather forecast** integration to adjust recommendations ahead of time.
