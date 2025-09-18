'use client'

import { useState, useEffect } from 'react'
import {
  Trophy,
  Crown,
  Clock,
  Users,
  Sparkles
} from 'lucide-react'
import DashboardLayout from './layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContextNew'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { Developer } from '@/lib/types'
import { formatHours } from '@/lib/timeUtils'

interface RankedDeveloper extends Developer {
  rank: number
  reward: string
  rewardIcon: React.ComponentType<{ className?: string }>
  rewardColor: string
  badge: string
  badgeColor: string
  performance: 'excellent' | 'good' | 'average' | 'needs-improvement'
  achievements: string[]
  isCurrentUser?: boolean
}

interface WeeklyStats {
  totalHours: number
  averageHours: number
  topPerformer: RankedDeveloper | null
  totalDevelopers: number
  currentUserRank: number
  currentUserHours: number
}

export default function DeveloperRewardsPage() {
  const { user } = useAuth()
  const [rankedDevelopers, setRankedDevelopers] = useState<RankedDeveloper[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    totalHours: 0,
    averageHours: 0,
    topPerformer: null,
    totalDevelopers: 0,
    currentUserRank: 0,
    currentUserHours: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDeveloper, setSelectedDeveloper] = useState<RankedDeveloper | null>(null)


  // Fetch data from API endpoint
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        const response = await fetch('/api/developer/rewards')
        const data = await response.json()

        console.log("User:", user)

        console.log('Developer Rewards Data:', data)

        if (data.success) {
          setRankedDevelopers(data.data.rankedDevelopers)
          setWeeklyStats(data.data.weeklyStats)
        } else {
          console.error('Error fetching rewards data:', data.error)
          // Set empty data on error
          setRankedDevelopers([])
          setWeeklyStats({
            totalHours: 0,
            averageHours: 0,
            topPerformer: null,
            totalDevelopers: 0,
            currentUserRank: 0,
            currentUserHours: 0
          })
        }
      } catch (error) {
        console.error('Error fetching rewards data:', error)
        // Set empty data on error
        setRankedDevelopers([])
        setWeeklyStats({
          totalHours: 0,
          averageHours: 0,
          topPerformer: null,
          totalDevelopers: 0,
          currentUserRank: 0,
          currentUserHours: 0
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user])

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'average': return 'text-yellow-600'
      case 'needs-improvement': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }


  const renderHoursDisplay = (developer: RankedDeveloper) => {
    if (developer.isCurrentUser) {
      return (
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{formatHours(developer.hours)}</p>
          <p className="text-sm text-gray-500">{developer.tasks} tasks</p>
        </div>
      )
    } else {
      return (
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-400">••••</p>
          <p className="text-sm text-gray-400">•• tasks</p>
        </div>
      )
    }
  }

  return (
    <DashboardLayout
      title="Weekly Rewards"
      subtitle="See how you rank among your team members"
    >
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading rewards...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Your Performance Card */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Your Performance This Week</h2>
                  <div className="flex items-center space-x-6">
                    <div>
                      <p className="text-blue-100 text-sm">Your Rank</p>
                      <p className="text-4xl font-bold">#{weeklyStats.currentUserRank}</p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm">Your Hours</p>
                      <p className="text-4xl font-bold">{formatHours(weeklyStats.currentUserHours)}</p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm">Team Size</p>
                      <p className="text-4xl font-bold">{weeklyStats.totalDevelopers}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Trophy className="w-16 h-16 text-yellow-300" />
                </div>
              </div>
            </div>

            {/* Weekly Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">Team Total Hours</p>
                    <p className="text-3xl font-bold">{formatHours(weeklyStats.totalHours)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-100" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Team Average</p>
                    <p className="text-3xl font-bold">{formatHours(weeklyStats.averageHours)}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-100" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Top Performer</p>
                    <p className="text-lg font-bold truncate">{weeklyStats.topPerformer?.name || 'N/A'}</p>
                  </div>
                  <Crown className="w-8 h-8 text-purple-100" />
                </div>
              </div>
            </div>


            {/* Leaderboard */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
                  Weekly Leaderboard
                </h2>
                <div className="text-sm text-gray-500">
                  Week of {format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d, yyyy')}
                </div>
              </div>

              {rankedDevelopers.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                  <p className="text-gray-600 mb-4">
                    No worklog data found for this week. Make sure you have logged work in Jira.
                  </p>
                  <div className="text-sm text-gray-500">
                    <p>• Check if you have worklogs in Jira for this week</p>
                    <p>• Verify your Jira integration is working</p>
                    <p>• Contact your manager if the issue persists</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                {rankedDevelopers.map((developer, index) => (
                  <div
                    key={developer.id}
                    className={`relative p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg cursor-pointer ${
                      selectedDeveloper?.id === developer.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : developer.isCurrentUser
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-100 hover:border-blue-200'
                    }`}
                    onClick={() => setSelectedDeveloper(developer)}
                  >
                    {/* Rank Badge */}
                    <div className={`absolute -top-3 -left-3 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                      index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500' :
                      'bg-gradient-to-br from-blue-400 to-blue-500'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${developer.rank}`}
                    </div>

                    {/* Current User Badge */}
                    {developer.isCurrentUser && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        YOU
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <h3 className={`text-lg font-semibold ${developer.isCurrentUser ? 'text-green-700' : 'text-gray-900'}`}>
                              {developer.name}
                            </h3>
                            <span className={`text-2xl ${developer.badgeColor} rounded-full p-1`}>
                              {developer.badge}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{developer.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        {renderHoursDisplay(developer)}

                        <div className="flex flex-col items-center">
                          <div className={`${developer.rewardColor} text-lg font-semibold`}>
                            {developer.reward}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${developer.badgeColor} ${getPerformanceColor(developer.performance)}`}>
                            {developer.performance.replace('-', ' ').toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Achievements - Only show for current user */}
                    {selectedDeveloper?.id === developer.id && developer.isCurrentUser && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Achievements</h4>
                        <div className="flex flex-wrap gap-2">
                          {developer.achievements.map((achievement, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              {achievement}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                </div>
              )}
            </div>

            {/* Motivational Message */}
            <div className="mt-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">🎉 Great Work This Week! 🎉</h3>
                <p className="text-purple-100">
                  You&apos;re ranked #{weeklyStats.currentUserRank} out of {weeklyStats.totalDevelopers} team members.
                  {weeklyStats.currentUserRank <= 3 && " Congratulations on making it to the top 3!"}
                  {weeklyStats.currentUserRank > 3 && " Keep pushing to climb higher in the rankings!"}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
