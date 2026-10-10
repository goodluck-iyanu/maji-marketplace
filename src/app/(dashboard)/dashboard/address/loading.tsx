import { MajiPageLoader } from '@/components/brand/maji-brand'

export default function AddressLoading() {
  return (
    <MajiPageLoader
      animation="rocker"
      theme="light"
      label="Loading Pickup Address..."
      sublabel="Fetching your dispatch & courier coordinates"
      fullScreen={false}
    />
  )
}

