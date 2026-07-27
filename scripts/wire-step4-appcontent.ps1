$p = 'C:\Users\Lenovo\Downloads\Codex\Goalify_unpacked\src\AppContent.tsx'
$c = Get-Content -LiteralPath $p -Raw
$pattern = '(?s)\s*<AnimatePresence mode="wait">.*?</nav>'
$replacement = @'
        <AnimatePresence mode="wait">
          {view === "today" ? (
            <TodayView {...sharedViewProps} />
          ) : view === "profile" ? (
            <DashboardView {...sharedViewProps} />
          ) : view === "goals" ? (
            <GoalsView {...sharedViewProps} />
          ) : view === "detail" ? (
            <GoalDetailView {...sharedViewProps} />
          ) : view === "categories" ? (
            <motion.div
              key="categories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 md:p-8 max-w-4xl mx-auto w-full"
            >
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold font-mono-nums dark:text-white text-stone-900 tracking-tight mb-2">
                    Categories
                  </h2>
                  <p className="dark:text-stone-400 dark:text-stone-500 text-stone-600 text-sm">
                    Manage your goal categories.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="w-full md:w-auto px-4 py-2 bg-orange-500 text-[#431407] btn-extruded rounded-xl font-bold text-sm hover:bg-orange-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Category
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <Card key={cat.id} className="p-6 flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{
                        backgroundColor: `${cat.color}20`,
                        color: cat.color,
                      }}
                    >
                      {cat.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="dark:text-white text-stone-900 font-bold text-lg">
                        {cat.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs dark:text-stone-400 dark:text-stone-500 text-stone-600 uppercase tracking-wider font-mono">
                          {cat.color}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingCategory(cat)}
                        className="p-2 dark:text-stone-400 dark:text-stone-500 text-stone-600 hover:dark:text-white text-stone-900 dark:bg-white/5 bg-stone-100 hover:dark:bg-white/10 bg-stone-200 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 text-rose-400 hover:dark:text-white text-stone-900 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          ) : view === "habits" ? (
            <HabitsView {...sharedViewProps} />
          ) : view === "planner" ? (
            <PlannerViewScreen {...sharedViewProps} />
          ) : view === "calendar" ? (
            <CalendarView {...sharedViewProps} />
          ) : view === "assign-tasks" ? (
            <AssignTasksViewScreen {...sharedViewProps} />
          ) : null}
        </AnimatePresence>

        <Sidebar
          view={view}
          setView={setView}
          setActiveGoalId={setActiveGoalId}
        />
'@
$new = [regex]::Replace($c, $pattern, $replacement, 1)
Set-Content -LiteralPath $p -Value $new -Encoding UTF8
