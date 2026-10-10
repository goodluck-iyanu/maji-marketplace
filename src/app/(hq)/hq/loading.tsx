import { MajiPageLoader } from '@/components/brand/maji-brand'

export default function HqSubRouteLoading() {
  return (
    <MajiPageLoader
      animation="trace"
      theme="dark"
      label="Loading Maji HQ..."
      sublabel="Syncing live marketplace operations & ledger"
      fullScreen={false}
    />
  )
}
