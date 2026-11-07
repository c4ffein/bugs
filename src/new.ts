// bun run new <project> <slug>: print a fresh uuid and a bug skeleton.
import { DATA, readToml } from "./lib";
import { join } from "node:path";

const [project, slug] = process.argv.slice(2);
if (!project || !slug) { console.error("usage: bun run new <project> <slug>"); process.exit(2); }
const projects = (await readToml(join(DATA, "projects.toml"))).project.map((p: any) => p.id);
if (!projects.includes(project)) { console.error(`unknown project ${project}; known: ${projects.join(", ")}`); process.exit(2); }
const id = `${project}-${slug}`;
const uuid = crypto.randomUUID();
console.log(`# append to data/uuids.txt:
${uuid} ${id}

# data/bugs/${project}/${id}.toml
uuid       = "${uuid}"
id         = "${id}"
project    = "${project}"
title      = ""
where      = ""
kind       = ""
confidence = ""
reach      = ""
disclosure = "private"
state      = "suspected"

[[discovery]]
by      = ""
date    = "${new Date().toISOString().slice(0, 10)}"
date_is = "stated"`);
