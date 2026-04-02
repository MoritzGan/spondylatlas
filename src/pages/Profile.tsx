import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">{t('profile.title')}</h1>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
            {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.displayName || user?.email}
            </h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <dl className="mt-6 space-y-4">
          <div className="flex justify-between border-b border-gray-100 pb-3">
            <dt className="font-medium text-gray-700">{t('profile.member_since')}</dt>
            <dd className="text-gray-600">
              {user?.metadata.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString()
                : '—'}
            </dd>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-3">
            <dt className="font-medium text-gray-700">{t('profile.role')}</dt>
            <dd className="text-gray-600">{t('profile.roles.user')}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
