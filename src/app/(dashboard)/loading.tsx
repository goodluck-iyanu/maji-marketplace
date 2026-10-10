import { MajiPageLoader } from '@/components/brand/maji-brand'

export default function DashboardLoading() {
  return (
    <MajiPageLoader
      animation="bounce"
      label="Loading your Seller Studio..."
      sublabel="Syncing products, orders & live payouts"
      fullScreen={false}
    />
  )
}
