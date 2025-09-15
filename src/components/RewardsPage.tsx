'use client'

import { useState, useEffect } from 'react'
import {
  Trophy,
  Crown,
  Star,
  Zap,
  Target,
  TrendingUp,
  Clock,
  Users,
  Medal,
  Sparkles,
  Heart
} from 'lucide-react'
import DashboardLayout from './layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContextNew'
import { jiraApiEnhanced as jiraApi } from '@/lib/jiraApiEnhanced'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { Developer } from '@/lib/types'
import { formatTimeFromHours } from '@/lib/timeUtils'

interface RankedDeveloper extends Developer {
  rank: number
  reward: string
  rewardIcon: React.ComponentType<{ className?: string }>
  rewardColor: string
  badge: string
  badgeColor: string
  performance: 'excellent' | 'good' | 'average' | 'needs-improvement'
  achievements: string[]
}

interface WeeklyStats {
  totalHours: number
  averageHours: number
  topPerformer: RankedDeveloper | null
  totalDevelopers: number
}

export default function RewardsPage() {
  const { user } = useAuth()
  const [rankedDevelopers, setRankedDevelopers] = useState<RankedDeveloper[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    totalHours: 0,
    averageHours: 0,
    topPerformer: null,
    totalDevelopers: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDeveloper, setSelectedDeveloper] = useState<RankedDeveloper | null>(null)

  // Process worklogs to extract developer data
  const processWorklogs = (worklogs: Array<{
    author: { displayName: string; emailAddress: string; accountId?: string }
    timeSpentSeconds: number
    issueKey: string
    summary: string
    started: string
  }>) => {
    const developers = new Map<string, {
      id: string
      name: string
      email: string
      hours: number
      tasks: Set<string>
      worklogs: typeof worklogs
    }>()

    worklogs.forEach(worklog => {
      const author = worklog.author.displayName
      const authorEmail = worklog.author.emailAddress
      const hours = worklog.timeSpentSeconds / 3600

      if (!developers.has(author)) {
        developers.set(author, {
          id: worklog.author.accountId || `dev-${Date.now()}-${Math.random()}`,
          name: author,
          email: authorEmail,
          hours: 0,
          tasks: new Set(),
          worklogs: []
        })
      }

      const dev = developers.get(author)!
      dev.hours += hours
      dev.tasks.add(worklog.issueKey)
      dev.worklogs.push(worklog)
    })

    return Array.from(developers.values()).map(dev => ({
      id: dev.id,
      name: dev.name,
      email: dev.email,
      hours: Math.round(dev.hours * 100) / 100,
      tasks: dev.tasks.size,
      worklogs: dev.worklogs
    }))
  }

  // Generate rewards and rankings
  const generateRewards = (developers: Developer[]): RankedDeveloper[] => {
    const sortedDevelopers = [...developers].sort((a, b) => b.hours - a.hours)

    return sortedDevelopers.map((dev, index) => {
      const rank = index + 1
      let reward = ''
      let rewardIcon = Trophy
      let rewardColor = 'text-yellow-500'
      let badge = ''
      let badgeColor = 'bg-gray-100'
      let performance: 'excellent' | 'good' | 'average' | 'needs-improvement' = 'average'
      let achievements: string[] = []

      // Generate rewards based on rank and hours
      if (rank === 1) {
        reward = '🏆 Weekly Champion'
        rewardIcon = Crown
        rewardColor = 'text-yellow-500'
        badge = '👑'
        badgeColor = 'bg-yellow-100'
        performance = 'excellent'
        achievements = ['First Place', 'Over 40h this week', 'Team Leader']
      } else if (rank === 2) {
        reward = '🥈 Silver Star'
        rewardIcon = Star
        rewardColor = 'text-gray-400'
        badge = '⭐'
        badgeColor = 'bg-gray-100'
        performance = 'excellent'
        achievements = ['Second Place', 'Consistent Performer', 'High Achiever']
      } else if (rank === 3) {
        reward = '🥉 Bronze Medal'
        rewardIcon = Medal
        rewardColor = 'text-orange-500'
        badge = '🏅'
        badgeColor = 'bg-orange-100'
        performance = 'good'
        achievements = ['Third Place', 'Solid Performance', 'Reliable Worker']
      } else if (dev.hours >= 35) {
        reward = '⚡ High Performer'
        rewardIcon = Zap
        rewardColor = 'text-blue-500'
        badge = '⚡'
        badgeColor = 'bg-blue-100'
        performance = 'good'
        achievements = ['Over 35h', 'Dedicated Worker', 'Team Player']
      } else if (dev.hours >= 25) {
        reward = '🎯 On Target'
        rewardIcon = Target
        rewardColor = 'text-green-500'
        badge = '🎯'
        badgeColor = 'bg-green-100'
        performance = 'average'
        achievements = ['On Target', 'Steady Progress', 'Contributor']
      } else if (dev.hours >= 15) {
        reward = '🌱 Growing'
        rewardIcon = TrendingUp
        rewardColor = 'text-purple-500'
        badge = '🌱'
        badgeColor = 'bg-purple-100'
        performance = 'needs-improvement'
        achievements = ['Getting Started', 'Learning Phase', 'Newcomer']
      } else {
        reward = '💪 Keep Going!'
        rewardIcon = Heart
        rewardColor = 'text-pink-500'
        badge = '💪'
        badgeColor = 'bg-pink-100'
        performance = 'needs-improvement'
        achievements = ['Getting Started', 'Room for Growth', 'Early Days']
      }

      return {
        ...dev,
        rank,
        reward,
        rewardIcon,
        rewardColor,
        badge,
        badgeColor,
        performance,
        achievements
      }
    })
  }

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Calculate current week
        const now = new Date()
        const startDate = startOfWeek(now, { weekStartsOn: 1 })
        const endDate = endOfWeek(now, { weekStartsOn: 1 })

        const worklogs = await jiraApi.getWorklogs(
          format(startDate, 'yyyy-MM-dd'),
          format(endDate, 'yyyy-MM-dd')
        )

        const developers = processWorklogs(worklogs)
        const ranked = generateRewards(developers)

        setRankedDevelopers(ranked)

        // Calculate weekly stats
        const totalHours = ranked.reduce((sum, dev) => sum + dev.hours, 0)
        const averageHours = ranked.length > 0 ? totalHours / ranked.length : 0

        setWeeklyStats({
          totalHours,
          averageHours,
          topPerformer: ranked.length > 0 ? ranked[0] : null,
          totalDevelopers: ranked.length
        })
      } catch (error) {
        console.error('Error fetching rewards data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'average': return 'text-yellow-600'
      case 'needs-improvement': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getPerformanceBgColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'bg-green-50'
      case 'good': return 'bg-blue-50'
      case 'average': return 'bg-yellow-50'
      case 'needs-improvement': return 'bg-orange-50'
      default: return 'bg-gray-50'
    }
  }

  return (
    <DashboardLayout
      title="Weekly Rewards"
      subtitle="Celebrating team performance and achievements"
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
            {/* Weekly Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">Total Hours</p>
                    <p className="text-3xl font-bold">{formatTimeFromHours(weeklyStats.totalHours)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-100" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Average Hours</p>
                    <p className="text-3xl font-bold">{formatTimeFromHours(weeklyStats.averageHours)}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-100" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Team Size</p>
                    <p className="text-3xl font-bold">{weeklyStats.totalDevelopers}</p>
                  </div>
                  <Trophy className="w-8 h-8 text-green-100" />
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

              <div className="space-y-4">
                {rankedDevelopers.map((developer, index) => (
                  <div
                    key={developer.id}
                    className={`relative p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg cursor-pointer ${
                      selectedDeveloper?.id === developer.id 
                        ? 'border-blue-500 bg-blue-50' 
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

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">{developer.name}</h3>
                            <span className={`text-2xl ${developer.badgeColor} rounded-full p-1`}>
                              {developer.badge}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{developer.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{formatTimeFromHours(developer.hours)}</p>
                          <p className="text-sm text-gray-500">{developer.tasks} tasks</p>
                        </div>

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

                    {/* Achievements */}
                    {selectedDeveloper?.id === developer.id && (
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
            </div>

            {/* Motivational Message */}
            <div className="mt-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">🎉 Congratulations Team! 🎉</h3>
                <p className="text-purple-100">
                  You&apos;ve all contributed to another amazing week of productivity.
                  Keep up the great work and continue pushing your limits!
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
