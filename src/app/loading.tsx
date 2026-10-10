import { MajiPageLoader } from '@/components/brand/maji-brand'

export default function Loading() {
  return (
    <MajiPageLoader
      animation="splash"
      label="Loading Maji..."
      sublabel="Your marketplace, your way"
      fullScreen={true}
    />
  )
}
