import { MajiPageLoader } from '@/components/brand/maji-brand'

export default function ProductsLoading() {
  return (
    <MajiPageLoader
      animation="bounce"
      theme="light"
      label="Loading Products..."
      sublabel="Fetching your catalog & inventory"
      fullScreen={false}
    />
  )
}

