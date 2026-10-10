import { MajiPageLoader } from '@/components/brand/maji-brand'

export default function StoreCartLoading() {
  return (
    <MajiPageLoader
      animation="rocker"
      theme="light"
      label="Loading Checkout..."
      sublabel="Preparing your cart & live delivery options"
    />
  )
}

