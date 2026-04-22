import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import KategorienPage from '@/pages/KategorienPage';
import StandortePage from '@/pages/StandortePage';
import ElektrogeraetePage from '@/pages/ElektrogeraetePage';
import WartungenPage from '@/pages/WartungenPage';
import PublicFormKategorien from '@/pages/public/PublicForm_Kategorien';
import PublicFormStandorte from '@/pages/public/PublicForm_Standorte';
import PublicFormElektrogeraete from '@/pages/public/PublicForm_Elektrogeraete';
import PublicFormWartungen from '@/pages/public/PublicForm_Wartungen';
// <public:imports>
// </public:imports>
// <custom:imports>
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/69e8810fdd12d6d0097878ed" element={<PublicFormKategorien />} />
              <Route path="public/69e8811331e937575115dfb9" element={<PublicFormStandorte />} />
              <Route path="public/69e88114578bd52f940aaaac" element={<PublicFormElektrogeraete />} />
              <Route path="public/69e88115cc9d2c5a229b5b9a" element={<PublicFormWartungen />} />
              {/* <public:routes> */}
              {/* </public:routes> */}
              <Route element={<Layout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="kategorien" element={<KategorienPage />} />
                <Route path="standorte" element={<StandortePage />} />
                <Route path="elektrogeraete" element={<ElektrogeraetePage />} />
                <Route path="wartungen" element={<WartungenPage />} />
                <Route path="admin" element={<AdminPage />} />
                {/* <custom:routes> */}
                {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}
