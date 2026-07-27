$srcPath = 'C:\Users\Lenovo\Downloads\Codex\Goalify_unpacked\src\App.tsx'
$viewsDir = 'C:\Users\Lenovo\Downloads\Codex\Goalify_unpacked\src\views'
$src = Get-Content -LiteralPath $srcPath

if (-not (Test-Path -LiteralPath $viewsDir)) {
  New-Item -ItemType Directory -Path $viewsDir | Out-Null
}

$sharedDestructure = @'
  const {
    motion,
    AnimatePresence,
    DndContext,
    DragOverlay,
    defaultDropAnimationSideEffects,
    cn,
    format,
    parseISO,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    isPast,
    PlannerView,
    AssignTasksView,
    Card,
    Badge,
    DraggableMilestone,
    DroppableCalendarDay,
    CircularProgress,
    CustomBarTooltip,
    CustomTooltip,
    PRIORITY_COLORS,
    isValidDate,
    isCompletedOnDate,
    setView,
    setTheme,
    setSelectedDate,
    setActiveGoalId,
    setCurrentMonth,
    setIsFocusMode,
    setIsAddingGoal,
    setIsAddingHabit,
    setIsAddingMilestone,
    setIsCustomizingLayout,
    setDismissedConquered,
    setNewMilestone,
    setEditingGoal,
    setNewGoal,
    setEditingHabit,
    setNewHabit,
    toggleHabitOptimistic,
    toggleGoalCompletionOptimistic,
    toggleMilestone,
    deleteMilestone,
    editMilestone,
    handleAddPlannerTask,
    handleDeleteGoal,
    handleDeleteHabit,
    handleDeleteCategory,
    handleMarkAllDone,
    handleToggleToday,
    handleArenaComplete,
    handleCalendarDragStart,
    handleCalendarDragEnd,
    fetchGoals,
    session,
    supabase,
    theme,
    currentDate,
    dashboardLayout,
    stats,
    chartData,
    repeatabilityData,
    categoryData,
    trendData,
    productivityInsights,
    currentMonth,
    selectedDate,
    milestonesForSelectedDate,
    todayMilestones,
    todayProgress,
    yesterdayProgress,
    yesterdayCompletedCount,
    dismissedConquered,
    personalBest,
    highestStreak,
    barPulse,
    floatingPoints,
    slidingOut,
    showBreather,
    breatherMessage,
    lastCompleted,
    breatherTimeout,
    setBreatherTimeout,
    setShowBreather,
    setSlidingOut,
    goals,
    habits,
    categories,
    activeGoal,
    activeGoalId,
    unassignedMilestones,
    sensors,
    activeCalendarDragId,
    activeCalendarMilestone,
    getItemsForDate,
    getHeroTheme,
    getBarColor,
    getHypeText,
    getStreakMessage,
    X,
    Zap,
    Plus,
    CheckCircle2,
    TrendingUp,
    TrendingDown,
    Trophy,
    Target,
    Settings,
    Trash2,
    ChevronRight,
    ArrowLeft,
    Activity,
    Flame,
    Calendar,
    CalendarDays,
    Sun,
    Moon,
    Award,
    Clock,
    LayoutDashboard,
    User,
  } = props;
'@

function Write-ViewFile($name, $startLine, $endLine) {
  $body = ($src[($startLine - 1)..($endLine - 1)] -join "`r`n")
  $content = @"
import React from "react";

export function $name(props: any) {
$sharedDestructure
  return (
$body
  );
}
"@
  Set-Content -LiteralPath (Join-Path $viewsDir "$name.tsx") -Value $content -Encoding UTF8
}

Write-ViewFile 'TodayView' 2704 3566
Write-ViewFile 'DashboardView' 3568 4151
Write-ViewFile 'GoalsView' 4153 4298
Write-ViewFile 'GoalDetailView' 4300 4588
Write-ViewFile 'HabitsView' 4660 4804
Write-ViewFile 'CalendarView' 4823 5164

$plannerContent = @'
import React from "react";

export function PlannerView(props: any) {
  const {
    motion,
    PlannerView: LegacyPlannerView,
    goals,
    categories,
    handleAddPlannerTask,
    toggleMilestone,
    deleteMilestone,
    editMilestone,
  } = props;

  return (
    <motion.div
      key="planner"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 md:p-8 max-w-7xl mx-auto w-full"
    >
      <LegacyPlannerView
        goals={goals}
        categories={categories}
        onAddMilestone={handleAddPlannerTask}
        onToggleMilestone={toggleMilestone}
        onDeleteMilestone={deleteMilestone}
        onEditMilestone={editMilestone}
      />
    </motion.div>
  );
}
'@
Set-Content -LiteralPath (Join-Path $viewsDir 'PlannerView.tsx') -Value $plannerContent -Encoding UTF8

$assignContent = @'
import React from "react";

export function AssignTasksView(props: any) {
  const { AssignTasksView: LegacyAssignTasksView, goals, fetchGoals, setView } = props;

  return (
    <LegacyAssignTasksView
      goals={goals}
      onClose={async () => {
        await fetchGoals();
        setView("calendar");
      }}
    />
  );
}
'@
Set-Content -LiteralPath (Join-Path $viewsDir 'AssignTasksView.tsx') -Value $assignContent -Encoding UTF8
