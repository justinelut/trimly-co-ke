import { getPayload } from "payload";
import config from "../payload.config.ts";
import { seedTrimly } from "../seed/index.ts";

async function main() {
  const payload = await getPayload({ config });
  await seedTrimly(payload, console.log);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
