import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout, ScrollToTop } from './layouts/PublicLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { SeriesDetailsPage } from './pages/SeriesDetailsPage';
import { WatchPage } from './pages/WatchPage';
import { SearchPage } from './pages/SearchPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminLoginPage } from './admin/AdminLoginPage';
import { AdminLayout } from './admin/AdminLayout';
import { AdminDashboardPage } from './admin/AdminDashboardPage';
import { AdminContentListPage } from './admin/AdminContentListPage';
import { AdminContentFormPage } from './admin/AdminContentFormPage';
import { AdminTitlePickerPage } from './admin/AdminTitlePickerPage';
import { AdminTitleManagePage } from './admin/AdminTitleManagePage';
import { AdminCategoriesPage } from './admin/AdminCategoriesPage';
import { AdminGenresPage } from './admin/AdminGenresPage';
import { AdminSettingsPage } from './admin/AdminSettingsPage';

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public website */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />

          <Route path="movies" element={<BrowsePage section="movies" />} />
          <Route path="movies/category/:slug" element={<BrowsePage section="movies" categoryMode />} />
          <Route path="movie/:slug" element={<MovieDetailsPage />} />

          <Route path="series" element={<BrowsePage section="series" />} />
          <Route path="series/category/:slug" element={<BrowsePage section="series" categoryMode />} />
          <Route path="series/:slug" element={<SeriesDetailsPage kind="series" />} />
          <Route
            path="series/:slug/season/:seasonNumber/episode/:episodeNumber"
            element={<WatchPage kind="series" />}
          />

          <Route path="tv-shows" element={<BrowsePage section="tv-shows" />} />
          <Route path="tv-shows/category/:slug" element={<BrowsePage section="tv-shows" categoryMode />} />
          <Route path="tv-show/:slug" element={<SeriesDetailsPage kind="tv_show" />} />
          <Route
            path="tv-show/:slug/season/:seasonNumber/episode/:episodeNumber"
            element={<WatchPage kind="tv_show" />}
          />

          <Route path="anime" element={<BrowsePage section="anime" />} />
          <Route path="anime/category/:slug" element={<BrowsePage section="anime" categoryMode />} />
          <Route path="anime/:slug" element={<SeriesDetailsPage kind="anime" />} />
          <Route
            path="anime/:slug/season/:seasonNumber/episode/:episodeNumber"
            element={<WatchPage kind="anime" />}
          />

          <Route path="search" element={<SearchPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Administrator authentication */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Administrator dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />

          <Route path="movies" element={<AdminContentListPage kind="movie" />} />
          <Route path="movies/new" element={<AdminContentFormPage kind="movie" />} />
          <Route path="movies/:id/edit" element={<AdminContentFormPage kind="movie" />} />

          <Route path="series" element={<AdminContentListPage kind="series" />} />
          <Route path="series/new" element={<AdminContentFormPage kind="series" />} />
          <Route path="series/:id/edit" element={<AdminContentFormPage kind="series" />} />
          <Route path="series/manage" element={<AdminTitlePickerPage kind="series" />} />
          <Route path="series/:id/manage" element={<AdminTitleManagePage kind="series" />} />

          <Route path="tv-shows" element={<AdminContentListPage kind="tv_show" />} />
          <Route path="tv-shows/new" element={<AdminContentFormPage kind="tv_show" />} />
          <Route path="tv-shows/:id/edit" element={<AdminContentFormPage kind="tv_show" />} />
          <Route path="tv-shows/manage" element={<AdminTitlePickerPage kind="tv_show" />} />
          <Route path="tv-shows/:id/manage" element={<AdminTitleManagePage kind="tv_show" />} />

          <Route path="anime" element={<AdminContentListPage kind="anime" />} />
          <Route path="anime/new" element={<AdminContentFormPage kind="anime" />} />
          <Route path="anime/:id/edit" element={<AdminContentFormPage kind="anime" />} />
          <Route path="anime/manage" element={<AdminTitlePickerPage kind="anime" />} />
          <Route path="anime/:id/manage" element={<AdminTitleManagePage kind="anime" />} />

          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="genres" element={<AdminGenresPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />

          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </>
  );
}
