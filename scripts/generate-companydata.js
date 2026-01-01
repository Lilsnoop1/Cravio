#!/usr/bin/env node

/**
 * Regenerate companydata.json with category attached to each company.
 *
 * Output shape:
 * [{ name: string, image: string, productCount: number, category: string }]
 */

import fs from "fs";
import path from "path";

const csvPath = path.join(__dirname, "..", "app", "Data", "products_updated.csv");
const existingPath = path.join(__dirname, "..", "app", "Data", "companydata.json");
const outputPath = existingPath;

const parseCsvLine = (line) => {
  // Split on commas that are not inside quotes
  return line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((cell) => cell.replace(/^"|"$/g, "").trim());
};

const main = () => {
  const csvRaw = fs.readFileSync(csvPath, "utf8").trim();
  const lines = csvRaw.split(/\r?\n/);
  const header = lines.shift();
  if (!header) {
    throw new Error("CSV appears empty");
  }

  const existing = fs.existsSync(existingPath)
    ? JSON.parse(fs.readFileSync(existingPath, "utf8"))
    : [];
  const imageMap = existing.reduce((acc, curr) => {
    acc[curr.name] = curr.image || "";
    return acc;
  }, {});

  const companies = new Map();

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    const category = cols[1] || "";
    const company = cols[3] || "";
    if (!company) continue;

    if (!companies.has(company)) {
      companies.set(company, { count: 0, categories: new Set() });
    }
    const entry = companies.get(company);
    entry.count += 1;
    if (category) entry.categories.add(category);
  }

  const result = Array.from(companies.entries()).map(([name, data]) => {
    return {
      name,
      image: imageMap[name] ?? "",
      productCount: data.count,
      categories: Array.from(data.categories).sort(),
    };
  });

  result.sort((a, b) => a.name.localeCompare(b.name));

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`Wrote ${result.length} companies to ${path.relative(process.cwd(), outputPath)}`);
};

main();

