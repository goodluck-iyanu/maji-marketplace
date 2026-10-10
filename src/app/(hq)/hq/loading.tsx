import { MajiPageLoader } from '@/components/brand/maji-brand'

export default function HQLoading() {
  return (
    <MajiPageLoader
      animation="pulse"
      theme="dark"
      label="Loading Maji HQ..."
      sublabel="Synchronizing marketplace telemetry & ledger"
      fullScreen={false}
    />
  )
}

