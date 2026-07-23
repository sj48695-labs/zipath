import RegionCompareClient from "./_components/RegionCompareClient";
import { buildRealPriceMonthDefaults } from "../_lib/monthOptions";

export const dynamic = "force-dynamic";

export default function RegionComparePage() {
  const initialMonthDefaults = buildRealPriceMonthDefaults(new Date());

  return <RegionCompareClient initialMonthDefaults={initialMonthDefaults} />;
}
