import { MajiPageLoader } from '@/components/brand/maji-brand'

export default function ProductDetailLoading() {
  return (
    <MajiPageLoader
      animation="bounce"
      theme="light"
      label="Loading Product..."
      sublabel="Fetching official store details & live inventory"
    />
  )
}

