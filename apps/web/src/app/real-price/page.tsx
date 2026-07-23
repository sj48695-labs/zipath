import RealPriceClient from "./_components/RealPriceClient";
import { buildRealPriceMonthDefaults } from "./_lib/monthOptions";

export const dynamic = "force-dynamic";

export default function RealPricePage() {
  const initialMonthDefaults = buildRealPriceMonthDefaults(new Date());

  return <RealPriceClient initialMonthDefaults={initialMonthDefaults} />;
}
