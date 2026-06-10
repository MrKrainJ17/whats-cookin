import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Photo from "./pages/Photo.jsx";
import Confirm from "./pages/Confirm.jsx";
import Recipes from "./pages/Recipes.jsx";
import RecipeDetail from "./pages/RecipeDetail.jsx";
import Settings from "./pages/Settings.jsx";
import TypeIngredients from "./pages/TypeIngredients.jsx";
import SpeakIngredients from "./pages/SpeakIngredients.jsx";
import LogoPreview from "./pages/LogoPreview.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import GroceryList from "./pages/GroceryList.jsx";
import Welcome from "./pages/Welcome.jsx";
import SignUp from "./pages/SignUp.jsx";
import LogIn from "./pages/LogIn.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import PasswordReset from "./pages/PasswordReset.jsx";
import Profile from "./pages/Profile.jsx";
import EditDiet from "./pages/profile/EditDiet.jsx";
import EditAllergies from "./pages/profile/EditAllergies.jsx";
import EditSpice from "./pages/profile/EditSpice.jsx";
import EditCuisines from "./pages/profile/EditCuisines.jsx";
import EditSkill from "./pages/profile/EditSkill.jsx";
import EditTime from "./pages/profile/EditTime.jsx";
import EditDislikes from "./pages/profile/EditDislikes.jsx";
import EditName from "./pages/profile/EditName.jsx";
import NameRequired from "./pages/NameRequired.jsx";
import { wasNameSkipped } from "./lib/namePrompt.js";
import { useSession } from "./lib/sessionContext.js";
import { SessionProvider } from "./lib/sessionContext.jsx";
import { hasCompletedOnboarding, bumpAppOpenCount } from "./lib/preferences.js";

export default function App() {
  // useLocation re-renders this component on every navigation, so
  // reading onboarding state synchronously here picks up the saved
  // value right after Onboarding finishes and navigates to "/".
  useLocation();
  const onboarded = hasCompletedOnboarding();

  // Bump the app-open counter once per session — used by the soft nudge
  // to decide whether to surface the "complete the survey" banner.
  useEffect(() => {
    bumpAppOpenCount();
  }, []);

  return (
    <SessionProvider>
      <NameGate>
        <Routes>
          <Route
            path="/"
            element={onboarded ? <Home /> : <Navigate to="/onboarding" replace />}
          />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/photo" element={<Photo />} />
          <Route path="/type" element={<TypeIngredients />} />
          <Route path="/speak" element={<SpeakIngredients />} />
          <Route path="/confirm" element={<Confirm />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/grocery" element={<GroceryList />} />
          <Route path="/logo-preview" element={<LogoPreview />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/welcome/name" element={<NameRequired />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/diet" element={<EditDiet />} />
          <Route path="/profile/allergies" element={<EditAllergies />} />
          <Route path="/profile/spice" element={<EditSpice />} />
          <Route path="/profile/cuisines" element={<EditCuisines />} />
          <Route path="/profile/skill" element={<EditSkill />} />
          <Route path="/profile/time" element={<EditTime />} />
          <Route path="/profile/dislikes" element={<EditDislikes />} />
          <Route path="/profile/name" element={<EditName />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </NameGate>
    </SessionProvider>
  );
}

// Redirects signed-in accounts that have no user_metadata.full_name to
// `/welcome/name` once per session. Bypassed on the auth + naming
// routes so the gate can't deadlock itself.
const NAME_EXEMPT_PATHS = new Set([
  "/welcome",
  "/welcome/name",
  "/signup",
  "/login",
  "/auth/callback",
  "/reset-password",
]);

function NameGate({ children }) {
  const { session, loading } = useSession();
  const location = useLocation();

  if (loading) return children;
  if (!session) return children;

  const hasName = Boolean(session.user?.user_metadata?.full_name);
  const exempt = NAME_EXEMPT_PATHS.has(location.pathname);
  if (hasName || exempt || wasNameSkipped()) return children;

  return <Navigate to="/welcome/name" replace />;
}
