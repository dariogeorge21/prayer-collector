import { AdminUserDetailPage } from '@/components/admin/AdminUserDetailPage'

interface AdminUserDetailPageProps {
  params: Promise<{
    userId: string
  }>
}

export default async function AdminUserPage({ params }: AdminUserDetailPageProps) {
  const { userId } = await params
  return <AdminUserDetailPage userId={userId} />
}
