import { MajiPageLoader } from '@/components/brand/maji-brand'

export default function NewProductLoading() {
  return (
    <MajiPageLoader
      animation="bounce"
      theme="light"
      label="Loading Product Builder..."
      sublabel="Preparing your category attributes & media uploader"
      fullScreen={false}
    />
  )
}

