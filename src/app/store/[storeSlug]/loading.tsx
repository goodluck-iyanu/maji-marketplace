import { MajiPageLoader } from '@/components/brand/maji-brand'

export default function StorefrontLoading() {
  return (
    <MajiPageLoader
      animation="rocker"
      label="Opening Storefront..."
      sublabel="Fetching verified merchant catalog & live pricing"
      fullScreen={true}
    />
  )
}

