import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { RouteErrorBoundary } from "./pages/RouteErrorBoundary";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, lazy: async () => ({ Component: (await import("./pages/Splash")).Splash }) },
      { path: "login", lazy: async () => ({ Component: (await import("./pages/Login")).Login }) },
      { path: "onboarding", lazy: async () => ({ Component: (await import("./pages/Onboarding")).Onboarding }) },
      { path: "home", lazy: async () => ({ Component: (await import("./pages/Home")).Home }) },
      { path: "plan", lazy: async () => ({ Component: (await import("./pages/Plan")).Plan }) },
      { path: "create-plan", lazy: async () => ({ Component: (await import("./pages/CreatePlan")).CreatePlan }) },
      { path: "log", lazy: async () => ({ Component: (await import("./pages/Log")).Log }) },
      { path: "history", lazy: async () => ({ Component: (await import("./pages/History")).History }) },
      { path: "profile", lazy: async () => ({ Component: (await import("./pages/Profile")).Profile }) },
      { path: "exercises", lazy: async () => ({ Component: (await import("./pages/Exercises")).Exercises }) },
      { path: "exercises/:id", lazy: async () => ({ Component: (await import("./pages/ExerciseDetail")).ExerciseDetail }) },
      { path: "analytics", lazy: async () => ({ Component: (await import("./pages/Analytics")).Analytics }) },
      { path: "plan/:id", lazy: async () => ({ Component: (await import("./pages/PlanDetail")).PlanDetail }) },
      { path: "history/:id", lazy: async () => ({ Component: (await import("./pages/WorkoutDetail")).WorkoutDetail }) },
      { path: "settings", lazy: async () => ({ Component: (await import("./pages/Settings")).Settings }) },
      { path: "privacy", lazy: async () => ({ Component: (await import("./pages/PrivacySecurity")).PrivacySecurity }) },
      { path: "badges", lazy: async () => ({ Component: (await import("./pages/Badges")).Badges }) },
      { path: "finish", lazy: async () => ({ Component: (await import("./pages/Finish")).Finish }) },
      { path: "coach", lazy: async () => ({ Component: (await import("./pages/coach/CoachEntry")).CoachEntry }) },
      { path: "coach/dashboard", lazy: async () => ({ Component: (await import("./pages/coach/CoachDashboard")).CoachDashboard }) },
      { path: "coach/templates", lazy: async () => ({ Component: (await import("./pages/coach/CoachTemplates")).CoachTemplates }) },
      { path: "coach/feedbacks", lazy: async () => ({ Component: (await import("./pages/coach/CoachFeedbacks")).CoachFeedbacks }) },
      { path: "coach/student/:id", lazy: async () => ({ Component: (await import("./pages/coach/StudentDetail")).StudentDetail }) },
      { path: "coach/student/:id/plan/:date", lazy: async () => ({ Component: (await import("./pages/coach/CoachPlanDay")).CoachPlanDay }) },
    ],
  },
]);
