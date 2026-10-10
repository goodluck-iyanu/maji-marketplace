import { MajiPageLoader } from '@/components/brand/maji-brand'

export default function PaymentsLoading() {
  return (
    <MajiPageLoader
      animation="trace"
      theme="light"
      label="Loading Payments & Payouts..."
      sublabel="Fetching your earnings & settlement records"
      fullScreen={false}
    />
  )
}

