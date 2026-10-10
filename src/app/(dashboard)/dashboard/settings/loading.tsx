import { MajiPageLoader } from '@/components/brand/maji-brand'

export default function SettingsLoading() {
  return (
    <MajiPageLoader
      animation="pulse"
      theme="light"
      label="Loading Store Settings..."
      sublabel="Fetching your store profile & configuration"
      fullScreen={false}
    />
  )
}

