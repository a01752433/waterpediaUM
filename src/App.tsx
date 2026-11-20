import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { ArchivePage } from "./pages/ArchivePage";
import { ComparePage } from "./pages/ComparePage";
import { MapPage } from "./pages/MapPage";
import { ProfilePage } from "./pages/ProfilePage";
import { StationPage } from "./pages/StationPage";
import { UploadPage } from "./pages/UploadPage";
import { AppStateProvider } from "./state";

export function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<MapPage />} />
            <Route path="station/:id" element={<StationPage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="archive" element={<ArchivePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  );
}
