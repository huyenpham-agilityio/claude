import type { RouteObject } from 'react-router'
import { App } from './App.tsx'
import { GuestOnly, RequireAuth } from './components/RouteGuards.tsx'
import { Home } from './pages/Home.tsx'
import { Login } from './pages/Login.tsx'
import { NotFound } from './pages/NotFound.tsx'
import { Register } from './pages/Register.tsx'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        element: <RequireAuth />,
        children: [{ index: true, element: <Home /> }],
      },
      {
        element: <GuestOnly />,
        children: [
          { path: 'login', element: <Login /> },
          { path: 'register', element: <Register /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]
