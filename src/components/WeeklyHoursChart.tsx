'use client'

interface WeeklyData {
  day: string
  hours: number
  tasks: number
}

interface WeeklyHoursChartProps {
  data: WeeklyData[]
  className?: string
}

export default function WeeklyHoursChart({ data, className = '' }: WeeklyHoursChartProps) {
  const maxHours = Math.max(...data.map(d => d.hours))
  const maxTasks = Math.max(...data.map(d => d.tasks))

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Weekly Hours Overview</h2>
      <div className="space-y-4">
        {data.map((day) => (
          <div key={day.day} className="flex items-center space-x-4">
            <div className="w-12 text-sm font-medium text-gray-900">{day.day}</div>
            
            {/* Hours Bar */}
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(day.hours / maxHours) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">
                  {day.hours}h
                </span>
              </div>
            </div>

            {/* Tasks Indicator */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">{day.tasks} tasks</span>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            </div>
          </div>
        ))}
        
        {/* Summary */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">Total Hours</span>
            <span className="font-bold text-lg text-gray-900">
              {data.reduce((sum, day) => sum + day.hours, 0)}h
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-gray-500">Total Tasks</span>
            <span className="text-sm font-medium text-gray-700">
              {data.reduce((sum, day) => sum + day.tasks, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}








