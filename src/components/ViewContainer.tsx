import React from "react";
import { AnimatePresence } from "motion/react";
import { TodayView } from "../views/TodayView";
import { ProfileView } from "../views/ProfileView";
import { AccountView } from "../views/AccountView";
import { ArchiveView } from "../views/ArchiveView";
import { GoalsView } from "../views/GoalsView";
import { GoalInsightsView } from "../views/GoalInsightsView";
import { GoalDetailView } from "../views/GoalDetailView";
import { CategoriesView } from "../views/CategoriesView";
import { HabitsView } from "../views/HabitsView";
import { PlannerView } from "../views/PlannerView";
import { CalendarView } from "../views/CalendarView";
import { AssignTasksView } from "../views/AssignTasksView";
import { InitialDataSkeleton } from "./InitialDataSkeleton";
import type { ViewType } from "../hooks/useAppRouter";

type SharedViewProps = React.ComponentProps<typeof TodayView> &
  React.ComponentProps<typeof ProfileView> &
  React.ComponentProps<typeof AccountView> &
  React.ComponentProps<typeof ArchiveView> &
  React.ComponentProps<typeof GoalsView> &
  React.ComponentProps<typeof GoalInsightsView> &
  React.ComponentProps<typeof GoalDetailView> &
  React.ComponentProps<typeof CategoriesView> &
  React.ComponentProps<typeof HabitsView> &
  React.ComponentProps<typeof PlannerView> &
  React.ComponentProps<typeof CalendarView> &
  React.ComponentProps<typeof AssignTasksView> & {
    isInitialDataLoading: boolean;
  };

interface ViewContainerProps {
  view: ViewType;
  sharedViewProps: SharedViewProps;
}

export const ViewContainer: React.FC<ViewContainerProps> = ({ view, sharedViewProps }) => {
  if (sharedViewProps.isInitialDataLoading) {
    return (
      <AnimatePresence mode="wait">
        <InitialDataSkeleton key={`initial-${view}`} view={view} />
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {view === "today" ? (
        <TodayView {...sharedViewProps} />
      ) : view === "dashboard" ? (
        <ProfileView {...sharedViewProps} />
      ) : view === "account" ? (
        <AccountView {...sharedViewProps} />
      ) : view === "archive" ? (
        <ArchiveView {...sharedViewProps} />
      ) : view === "goals" ? (
        <GoalsView {...sharedViewProps} />
      ) : view === "goal-insights" ? (
        <GoalInsightsView {...sharedViewProps} />
      ) : view === "detail" ? (
        <GoalDetailView {...sharedViewProps} />
      ) : view === "categories" ? (
        <CategoriesView {...sharedViewProps} />
      ) : view === "habits" ? (
        <HabitsView {...sharedViewProps} />
      ) : view === "planner" ? (
        <PlannerView {...sharedViewProps} />
      ) : view === "calendar" ? (
        <CalendarView {...sharedViewProps} />
      ) : view === "assign-tasks" ? (
        <AssignTasksView {...sharedViewProps} />
      ) : null}
    </AnimatePresence>
  );
};
