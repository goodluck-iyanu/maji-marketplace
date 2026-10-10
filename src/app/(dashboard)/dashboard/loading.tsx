import { MajiPageLoader } from '@/components/brand/maji-brand'

export default function DashboardSubRouteLoading() {
  return (
    <MajiPageLoader
      animation="rocker"
      theme="light"
      label="Loading Seller Studio..."
      sublabel="Syncing your store, products & live payouts"
      fullScreen={false}
    />
  )
}

