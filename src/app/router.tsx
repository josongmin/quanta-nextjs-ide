import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { StudioPage } from '@pages/studio';

const router = createBrowserRouter([
  {
    path: '/',
    element: <StudioPage />,
  },
  {
    path: '/route/:routeId',
    element: <StudioPage />,
  },
  {
    path: '/file/*',
    element: <StudioPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
